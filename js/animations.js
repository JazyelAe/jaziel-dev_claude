// Lenguaje de movimiento: fondo de nodos, luz ambiental, revelado, inclinación 3D y microinteracciones.
// Todo usa transform/opacity y requestAnimationFrame. Se reduce o desactiva en móviles y con prefers-reduced-motion.
import { $, $$, reducedMotion, finePointer, smallScreen, storage } from './utils.js';

/* ---------- Intro ---------- */
export function initIntro() {
  const intro = $('#intro');
  storage('session').set('jd-intro', '1');
  if (intro) setTimeout(() => intro.remove(), 2300); // el CSS ya lo oculta a los 2 s; aquí se retira del DOM
}

/* ---------- Revelado al hacer scroll ---------- */
let revealObserver;
export function observeReveals(root = document) {
  const items = $$('[data-reveal]:not(.is-in)', root);
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || reducedMotion()) { items.forEach((el) => el.classList.add('is-in')); return; }
  revealObserver ||= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach((el, i) => {
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${(i % 4) * 70}ms`);
    revealObserver.observe(el);
  });
}

/* ---------- Fondo interactivo de nodos ---------- */
export function initBackground(canvas) {
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const still = reducedMotion();
  const light = smallScreen() || !finePointer();
  let w = 0, h = 0, dpr = 1, nodes = [], raf = 0, running = false;
  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    w = window.innerWidth; h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, light ? 1 : 1.5);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(light ? 24 : 64, Math.round((w * h) / (light ? 24000 : 20000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, r: Math.random() * 1.2 + 0.5,
    }));
    draw();
  };

  const LINK = light ? 110 : 130, MOUSE_LINK = 170;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]; const dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          ctx.strokeStyle = `rgba(104,169,255,${(1 - Math.sqrt(d2) / LINK) * 0.16})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const mx = a.x - mouse.x, my = a.y - mouse.y; const md = mx * mx + my * my;
      if (md < MOUSE_LINK * MOUSE_LINK) {
        ctx.strokeStyle = `rgba(101,245,196,${(1 - Math.sqrt(md) / MOUSE_LINK) * 0.5})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(154,167,183,.55)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  function step() {
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
      if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
    }
    draw();
    raf = requestAnimationFrame(step);
  }
  const start = () => { if (!running && !still) { running = true; raf = requestAnimationFrame(step); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });
  if (!light) window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}

/* ---------- Luz ambiental que sigue al cursor ---------- */
export function initGlow() {
  if (!finePointer() || reducedMotion()) return;
  const root = document.documentElement;
  let tx = window.innerWidth / 2, ty = window.innerHeight * 0.3, cx = tx, cy = ty, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    root.style.setProperty('--mx', `${cx.toFixed(1)}px`); root.style.setProperty('--my', `${cy.toFixed(1)}px`);
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
}

/* ---------- Inclinación 3D sutil ---------- */
export function tilt(el, { max = 5, listenOn = el } = {}) {
  if (!el || !finePointer() || reducedMotion()) return;
  let raf = 0;
  listenOn.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`); el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
    });
  });
  listenOn.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
}

export function initCardTilt(root = document) { $$('.project-card', root).forEach((card) => tilt(card, { max: 4 })); }

/* ---------- Botones magnéticos ---------- */
export function initMagnetic() {
  if (!finePointer() || reducedMotion()) return;
  $$('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--bx', `${((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1)}px`);
      btn.style.setProperty('--by', `${((e.clientY - r.top - r.height / 2) * 0.24).toFixed(1)}px`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--bx', '0px'); btn.style.setProperty('--by', '0px'); });
  });
}

/* ---------- Hero: retrato y línea de pruebas ---------- */
export function initHero() {
  const stage = $('[data-stage]');
  const portrait = $('#portrait');
  const img = $('.portrait-media img');
  if (img) {
    const fail = () => { $('.portrait-fallback')?.removeAttribute('hidden'); img.remove(); };
    if (img.complete && img.naturalWidth === 0) fail(); else img.addEventListener('error', fail, { once: true });
  }
  if (stage && portrait) tilt(portrait, { max: 5, listenOn: stage });

  const line = $('#test-line');
  if (line && !reducedMotion()) {
    const steps = ['render ✓', 'responsive ✓', 'formularios ✓', 'flujos ✓'];
    let i = 0;
    setInterval(() => { i = (i + 1) % steps.length; line.textContent = steps[i]; }, 2400);
  }
}
