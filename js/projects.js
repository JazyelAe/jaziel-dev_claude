// Sección de proyectos: tarjetas, filtros generados desde los datos y estados vacío/error.
import { $, esc, safeUrl, safeAsset, hydrateIcons, initials } from './utils.js';
import { getProjects } from './data.js';
import { observeReveals, initCardTilt } from './animations.js';

const GITHUB_FALLBACK = 'https://github.com/JazyelAe';

/** Portada: imagen real si existe; si no (o si falla), composición tipográfica que no simula ser una captura. */
export function coverMarkup(p, { lazy = true } = {}) {
  const src = safeAsset(p.coverImage);
  const note = esc((p.categories && p.categories[0]) ? p.role || '' : p.role || '');
  const fallback = `<div class="cover-fallback"${src ? ' hidden' : ''}><span class="cover-note">${note ? `${note} · ` : ''}portada ilustrativa</span><span class="cover-mono" aria-hidden="true">${esc(initials(p.title))}</span></div>`;
  const img = src ? `<img src="${esc(src)}" alt="Captura de ${esc(p.title)}" ${lazy ? 'loading="lazy"' : ''} decoding="async" data-cover-img>` : '';
  return `<div class="cover">${img}${fallback}</div>`;
}

export function bindCoverFallbacks(root) {
  root.querySelectorAll('img[data-cover-img]').forEach((img) => {
    img.addEventListener('error', () => { img.closest('.cover')?.querySelector('.cover-fallback')?.removeAttribute('hidden'); img.remove(); }, { once: true });
  });
}

function cardMarkup(p, i) {
  const repo = safeUrl(p.repositoryUrl), live = safeUrl(p.liveUrl);
  const tech = (p.technologies || []).slice(0, 5);
  const extra = (p.technologies || []).length - tech.length;
  return `
  <article class="project-card enter${p.featured ? ' is-featured' : ''}" style="--i:${i}" data-slug="${esc(p.slug)}">
    ${coverMarkup(p)}
    <div class="card-body">
      <div class="card-top">
        <span class="card-role">${esc(p.role || 'Proyecto')}</span>
        ${p.status ? `<span class="badge">${esc(p.status)}</span>` : (p.featured ? '<span class="badge">Destacado</span>' : '')}
      </div>
      <h3 class="card-title"><a href="project.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h3>
      ${p.subtitle ? `<p class="card-sub">${esc(p.subtitle)}</p>` : ''}
      <p class="card-desc">${esc(p.shortDescription || p.description || '')}</p>
      ${tech.length ? `<ul class="tags" aria-label="Tecnologías">${tech.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}${extra > 0 ? `<li class="tag">+${extra}</li>` : ''}</ul>` : ''}
      <div class="card-foot">
        <div class="card-links">
          ${repo ? `<a class="icon-link" href="${esc(repo)}" target="_blank" rel="noopener" aria-label="Repositorio de ${esc(p.title)} en GitHub"><span data-icon="github"></span>Repositorio</a>` : ''}
          ${live ? `<a class="icon-link" href="${esc(live)}" target="_blank" rel="noopener" aria-label="Demo de ${esc(p.title)}"><span data-icon="arrow-up-right"></span>Demo</a>` : ''}
        </div>
        <span class="card-more">Ver detalle <span data-icon="arrow-up-right"></span></span>
      </div>
    </div>
  </article>`;
}

export async function initProjects() {
  const grid = $('#project-grid'), filters = $('#filters'), status = $('#projects-status');
  if (!grid) return;

  const showError = (err) => {
    console.error(err);
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = `<div class="state-box" role="alert"><p>No se pudieron cargar los proyectos. Revisa tu conexión e inténtalo de nuevo.</p>
      <button class="btn btn-ghost btn-sm" type="button" id="retry-projects">Reintentar</button>
      <a class="btn btn-text btn-sm" href="${GITHUB_FALLBACK}" target="_blank" rel="noopener">Ver GitHub</a></div>`;
    $('#retry-projects')?.addEventListener('click', () => { grid.innerHTML = '<div class="state-box skeleton">Cargando proyectos…</div>'; initProjects(); });
  };

  let data;
  try { data = await getProjects(); } catch (err) { showError(err); return; }
  const { projects, categories } = data;

  if (!projects.length) {
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = `<div class="state-box"><p>Aún no hay proyectos publicados aquí. Mientras tanto, puedes ver mi trabajo en GitHub.</p>
      <a class="btn btn-primary btn-sm" href="${GITHUB_FALLBACK}" target="_blank" rel="noopener">Abrir GitHub</a></div>`;
    hydrateIcons(grid);
    return;
  }

  let active = 'all';
  const render = (animate = true) => {
    const list = active === 'all' ? projects : projects.filter((p) => (p.categories || []).includes(active));
    grid.innerHTML = list.map(cardMarkup).join('');
    if (!animate) grid.querySelectorAll('.enter').forEach((c) => c.classList.remove('enter'));
    grid.setAttribute('aria-busy', 'false');
    hydrateIcons(grid); bindCoverFallbacks(grid); initCardTilt(grid);
    const label = active === 'all' ? '' : ` en ${categories.find((c) => c.id === active)?.label}`;
    if (status) status.textContent = `Mostrando ${list.length} ${list.length === 1 ? 'proyecto' : 'proyectos'}${label}.`;
  };

  if (filters) {
    if (categories.length >= 2) {
      const all = [{ id: 'all', label: 'Todos', count: projects.length }, ...categories];
      filters.innerHTML = all.map((c) => `<button class="filter" type="button" data-filter="${esc(c.id)}" aria-pressed="${c.id === 'all'}">${esc(c.label)}<span class="count">${c.count}</span></button>`).join('');
      filters.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter]'); if (!btn || btn.dataset.filter === active) return;
        active = btn.dataset.filter;
        filters.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        render();
      });
    } else filters.hidden = true;
  }
  render();
  observeReveals(grid);
}
