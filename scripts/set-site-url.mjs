#!/usr/bin/env node
// Cambia la URL pública del sitio en canonical, Open Graph, JSON-LD, robots.txt, 404.html y regenera sitemap.xml.
// Uso:  node scripts/set-site-url.mjs https://jazyelae.github.io/nombre-del-repositorio/
//       node scripts/set-site-url.mjs https://midominio.com/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const write = (f, s) => writeFileSync(join(root, f), s);

const arg = process.argv[2];
if (!arg || !/^https?:\/\//.test(arg)) { console.error('Uso: node scripts/set-site-url.mjs https://usuario.github.io/repositorio/'); process.exit(1); }
const next = arg.replace(/\/*$/, '/');
const index = read('index.html');
const prev = (index.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
if (!prev) { console.error('No se encontró la URL actual (canonical) en index.html'); process.exit(1); }

for (const f of ['index.html', 'project.html', 'robots.txt']) write(f, read(f).split(prev).join(next));

// 404.html usa <base href="/ruta/"> porque GitHub Pages lo sirve desde cualquier URL inexistente
const basePath = new URL(next).pathname;
write('404.html', read('404.html').replace(/<base href="[^"]*">/, `<base href="${basePath}">`));

// sitemap.xml: portada + proyectos publicados
const projects = JSON.parse(read('data/projects.json')).projects.filter((p) => p.published === true && p.slug);
const urls = [next, ...projects.map((p) => `${next}project.html?slug=${encodeURIComponent(p.slug)}`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`URL actualizada:\n  ${prev}\n  → ${next}\nSitemap con ${urls.length} URLs.`);
