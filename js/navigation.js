// Navegación: menú móvil, enlace activo, barra de progreso y transición entre páginas.
import { $, $$ } from './utils.js';

export function initProgress() {
  const bar = $('#progress span');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

export function initMenu() {
  const toggle = $('.menu-toggle');
  const nav = $('#site-nav');
  if (!toggle || !nav) return;
  const links = $$('a, button', nav);
  $$('li', nav).forEach((li, i) => li.style.setProperty('--i', i));

  const setOpen = (open, returnFocus = true) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open) $('a[data-nav]', nav)?.focus();
    else if (returnFocus) toggle.focus();
  };
  const isOpen = () => document.body.classList.contains('nav-open');

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  nav.addEventListener('click', (e) => { if (e.target.closest('a') && isOpen()) setOpen(false, false); });
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Tab') {
      const items = [toggle, ...links.filter((el) => !el.hidden && el.offsetParent !== null)];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 880px)').addEventListener('change', (m) => { if (m.matches && isOpen()) setOpen(false, false); });
}

export function initActiveLink() {
  const links = $$('a[data-nav]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map(links.map((a) => [a.dataset.nav, a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      const a = map.get(entry.target.id);
      if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

/** Pequeña salida antes de abrir la página de detalle. */
export function initPageTransitions() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!/^project\.html\?/.test(href)) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { window.location.href = a.href; }, 220);
  });
  // Si se vuelve con el botón "atrás" (bfcache), se restaura la página.
  window.addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('is-leaving'); });
}
