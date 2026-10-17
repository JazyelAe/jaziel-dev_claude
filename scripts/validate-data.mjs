#!/usr/bin/env node
// Revisa data/*.json antes de publicar: campos obligatorios, slugs únicos, enlaces https, imágenes existentes.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [], warnings = [];
const load = (f) => { try { return JSON.parse(readFileSync(join(root, f), 'utf8')); } catch (e) { errors.push(`${f}: JSON inválido (${e.message})`); return null; } };

const data = load('data/projects.json');
load('data/profile.json'); load('data/skills.json');

if (data) {
  const cats = Object.keys(data.categories || {});
  const slugs = new Set();
  for (const [i, p] of (data.projects || []).entries()) {
    const id = `projects[${i}] (${p.slug || p.title || '?'})`;
    for (const k of ['id', 'slug', 'title', 'shortDescription', 'description']) if (!p[k]) errors.push(`${id}: falta "${k}"`);
    if (p.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) errors.push(`${id}: el slug solo admite minúsculas, números y guiones`);
    if (slugs.has(p.slug)) errors.push(`${id}: slug repetido`); slugs.add(p.slug);
    if (typeof p.published !== 'boolean') errors.push(`${id}: "published" debe ser true o false`);
    for (const c of p.categories || []) if (!cats.includes(c)) errors.push(`${id}: categoría "${c}" no definida en "categories"`);
    for (const k of ['repositoryUrl', 'liveUrl']) if (p[k] && !/^https:\/\//.test(p[k])) errors.push(`${id}: "${k}" debe empezar con https://`);
    const imgs = [p.coverImage, ...(p.gallery || []).map((g) => (typeof g === 'string' ? g : g.src))].filter(Boolean);
    for (const img of imgs) if (!existsSync(join(root, img))) (p.published ? errors : warnings).push(`${id}: no existe la imagen ${img}`);
    if (p.published && !p.repositoryUrl && !p.liveUrl) warnings.push(`${id}: publicado sin repositorio ni demo`);
  }
}
for (const f of ['assets/images/jaziel-profile.webp', 'assets/cv/cv-jahir-jaziel.pdf']) if (!existsSync(join(root, f))) warnings.push(`Falta ${f}`);

warnings.forEach((w) => console.warn('⚠ ', w));
errors.forEach((e) => console.error('✖ ', e));
console.log(errors.length ? `\n${errors.length} error(es).` : '\n✔ Datos válidos.');
process.exit(errors.length ? 1 : 0);
