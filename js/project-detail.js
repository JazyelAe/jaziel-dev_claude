// Página de detalle: project.html?slug=<slug>. Oculta los apartados sin contenido.
import { $, esc, safeUrl, safeAsset, hydrateIcons } from './utils.js';
import { getProjects } from './data.js';
import { coverMarkup, bindCoverFallbacks } from './projects.js';
import { initBackground, initGlow, initMagnetic } from './animations.js';
import { initProgress, initPageTransitions } from './navigation.js';

const root = $('#detail-root');
const SITE = 'JAZIEL.DEV';

function meta(name, content, attr = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function notFound(msg) {
  root.setAttribute('aria-busy', 'false');
  document.title = `Proyecto no encontrado — ${SITE}`;
  root.innerHTML = `<div class="state-box" role="alert"><p>${esc(msg)}</p><a class="btn btn-primary btn-sm" href="index.html#proyectos">Ver todos los proyectos</a></div>`;
}

const textSection = (title, text) => (text && String(text).trim() ? `<section class="dsection"><h2>${esc(title)}</h2><p>${esc(text)}</p></section>` : '');
const listSection = (title, items) => (Array.isArray(items) && items.length ? `<section class="dsection"><h2>${esc(title)}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>` : '');

function render(p, all) {
  const d = p.details || {};
  const repo = safeUrl(p.repositoryUrl), live = safeUrl(p.liveUrl);
  const gallery = (p.gallery || []).map((g) => (typeof g === 'string' ? { src: g, alt: '' } : g)).filter((g) => safeAsset(g.src));
  const rows = [['Rol', p.role], ['Periodo', p.period], ['Equipo', p.team], ['Estado', p.status]].filter(([, v]) => v);

  const idx = all.findIndex((x) => x.slug === p.slug);
  const prev = all[idx - 1], next = all[idx + 1];

  root.setAttribute('aria-busy', 'false');
  root.innerHTML = `
  <header class="detail-head">
    <nav class="crumb mono" aria-label="Ruta"><a href="index.html#proyectos">Proyectos</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.title)}</span></nav>
    <p class="detail-kicker mono">${esc(p.role || 'Proyecto')}</p>
    <h1 class="detail-title">${esc(p.title)}</h1>
    ${p.subtitle ? `<p class="detail-sub">${esc(p.subtitle)}</p>` : ''}
    <div class="detail-actions">
      ${repo ? `<a class="btn btn-primary" href="${esc(repo)}" target="_blank" rel="noopener"><span data-icon="github"></span>Ver repositorio</a>` : ''}
      ${live ? `<a class="btn btn-ghost" href="${esc(live)}" target="_blank" rel="noopener">Ver demo<span data-icon="arrow-up-right"></span></a>` : ''}
    </div>
  </header>
  <div class="detail-cover">${coverMarkup(p, { lazy: false })}</div>
  <div class="detail-grid">
    <div class="detail-main">
      ${textSection('Descripción', p.description)}
      ${textSection('Contexto', d.context)}
      ${textSection('Objetivo', d.objective)}
      ${textSection('Problema abordado', d.problem)}
      ${textSection('Solución desarrollada', d.solution)}
      ${listSection('Mi contribución', d.contribution)}
      ${listSection(p.featuresLabel || 'Funcionalidades', d.features)}
      ${gallery.length ? `<section class="dsection"><h2>Capturas</h2><div class="shots">${gallery.map((g, i) => `<figure class="shot"><button type="button" data-shot="${i}" aria-label="Ampliar captura ${i + 1}"><img src="${esc(safeAsset(g.src))}" alt="${esc(g.alt || `Captura ${i + 1} de ${p.title}`)}" loading="lazy" decoding="async"></button></figure>`).join('')}</div></section>` : ''}
    </div>
    <aside class="meta-card" aria-label="Ficha del proyecto">
      <dl>
        ${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
        ${(p.technologies || []).length ? `<div><dt>Tecnologías</dt><dd><ul class="tags">${p.technologies.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul></dd></div>` : ''}
      </dl>
    </aside>
  </div>
  ${prev || next ? `<nav class="detail-nav" aria-label="Otros proyectos">
    ${prev ? `<a class="prev" href="project.html?slug=${encodeURIComponent(prev.slug)}"><small>Anterior</small><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
    ${next ? `<a class="next" href="project.html?slug=${encodeURIComponent(next.slug)}"><small>Siguiente</small><strong>${esc(next.title)}</strong></a>` : ''}
  </nav>` : ''}`;

  hydrateIcons(root); bindCoverFallbacks(root);

  document.title = `${p.title} — ${SITE}`;
  const desc = p.shortDescription || p.description || '';
  meta('description', desc); meta('og:title', `${p.title} — ${SITE}`, 'property'); meta('og:description', desc, 'property');

  const dialog = $('#lightbox');
  if (dialog && gallery.length && typeof dialog.showModal === 'function') {
    const big = $('img', dialog);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-shot]'); if (!b) return;
      const g = gallery[Number(b.dataset.shot)];
      big.src = safeAsset(g.src); big.alt = g.alt || `Captura de ${p.title}`;
      dialog.showModal();
    });
    $('.lightbox-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  }
}

async function boot() {
  hydrateIcons();
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  document.documentElement.classList.add('js-ok');
  try { initBackground($('#bg')); initGlow(); initProgress(); initPageTransitions(); initMagnetic(); } catch (e) { console.error(e); }

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) return notFound('No se indicó qué proyecto abrir.');
  try {
    const { projects } = await getProjects();
    const project = projects.find((p) => p.slug === slug);
    if (!project) return notFound('Este proyecto no existe o todavía no está publicado.');
    render(project, projects);
  } catch (err) {
    console.error(err);
    notFound('No se pudo cargar la información del proyecto. Inténtalo de nuevo más tarde.');
  }
}
boot();
