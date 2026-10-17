// Punto de entrada de la página principal. Cada módulo se inicia por separado:
// si uno falla, el resto del sitio sigue funcionando.
import { $, $$, esc, hydrateIcons, safeUrl } from './utils.js';
import { getProfile, getSkills } from './data.js';
import { initIntro, observeReveals, initBackground, initGlow, initMagnetic, initHero } from './animations.js';
import { initMenu, initActiveLink, initProgress, initPageTransitions } from './navigation.js';
import { initProjects } from './projects.js';
import { initCopyEmail, initContactForm } from './contact.js';

const safe = (name, fn) => { try { return fn(); } catch (err) { console.error(`[${name}]`, err); } };

function applyProfile(profile) {
  // Enlaces profesionales (los valores por defecto ya están en el HTML)
  const { email, github, linkedin } = profile.links || {};
  $$('[data-link]').forEach((a) => {
    const kind = a.dataset.link;
    if (kind === 'email' && email) a.href = `mailto:${email}`;
    if (kind === 'github' && safeUrl(github)) a.href = github;
    if (kind === 'linkedin' && safeUrl(linkedin)) a.href = linkedin;
  });
  if (email) { const t = $('#mail-text'); if (t) t.textContent = email; const m = $('#mail-link'); if (m) m.href = `mailto:${email}`; }

  // Disponibilidad: solo se muestra si se activa en data/profile.json
  const av = $('#availability');
  if (av && profile.availability?.enabled && profile.availability.text) { av.textContent = profile.availability.text; av.hidden = false; }

  // Texto de perfil, destacados y formación
  if (Array.isArray(profile.about) && profile.about.length) $('#about-text').innerHTML = profile.about.map((t) => `<p>${esc(t)}</p>`).join('');
  if (Array.isArray(profile.highlights) && profile.highlights.length) {
    $('#highlights').innerHTML = profile.highlights.map((h) => `<li><span data-icon="${esc(h.icon)}"></span>${esc(h.title)}</li>`).join('');
  }
  if (Array.isArray(profile.education) && profile.education.length) {
    $('#edu-list').innerHTML = profile.education.map((e) => `<li${e.current ? ' class="current"' : ''}>
      <strong>${esc(e.institution)}</strong>
      <span>${esc(e.degree)}${e.area ? ` · ${esc(e.area)}` : ''}</span>
      <span class="period">${esc(e.period || '')}${e.current ? ' · <em class="mono">En curso</em>' : ''}</span></li>`).join('');
  }
  hydrateIcons();
}

async function checkCv(profile) {
  const path = profile.cv?.path;
  const links = $$('[data-cv]');
  if (!path || !links.length) return;
  try {
    const res = await fetch(path, { method: 'HEAD' });
    if (!res.ok) return;
    links.forEach((a) => { a.href = path; a.hidden = false; });
  } catch { /* sin CV: los botones permanecen ocultos */ }
}

function renderSkills(skills) {
  const grid = $('#skills-grid');
  if (!grid || !Array.isArray(skills.groups)) return;
  grid.innerHTML = skills.groups.map((g, i) => `
    <article class="skill-group" data-reveal data-idx="0${i + 1}">
      <div class="skill-head"><span data-icon="${esc(g.icon)}"></span><h3>${esc(g.title)}</h3></div>
      <ul class="tags">${(g.items || []).map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>
    </article>`).join('');
  hydrateIcons(grid);
  observeReveals(grid);
}

async function boot() {
  document.documentElement.classList.add('js-ok');
  hydrateIcons();
  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  safe('intro', initIntro);
  safe('fondo', () => initBackground($('#bg')));
  safe('luz', initGlow);
  safe('progreso', initProgress);
  safe('menu', initMenu);
  safe('nav-activa', initActiveLink);
  safe('transiciones', initPageTransitions);
  safe('hero', initHero);
  safe('magnetico', initMagnetic);
  safe('reveal', () => observeReveals());

  const projects = initProjects().catch((e) => console.error('[proyectos]', e));
  const skills = getSkills().then(renderSkills).catch((e) => { console.error('[skills]', e); });

  let profile = {};
  try { profile = await getProfile(); safe('perfil', () => applyProfile(profile)); safe('cv', () => checkCv(profile)); }
  catch (e) { console.error('[perfil]', e); }

  const email = profile.links?.email || 'jahirarana06@gmail.com';
  safe('copiar', () => initCopyEmail(email));
  safe('formulario', () => initContactForm({ endpoint: profile.contact?.endpoint || '', email }));
  await Promise.allSettled([projects, skills]);
}

boot();
