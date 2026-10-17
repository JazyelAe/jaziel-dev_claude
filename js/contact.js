// Contacto: copiar correo y formulario con validación, estados accesibles y envío real a la función de Firebase.
import { $, esc } from './utils.js';

const LIMITS = { name: [2, 80], subject: [3, 120], message: [10, 2000], email: [5, 120] };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGES = {
  name: 'Escribe tu nombre (mínimo 2 caracteres).',
  email: 'Escribe un correo válido, por ejemplo nombre@dominio.com.',
  subject: 'Escribe un asunto (mínimo 3 caracteres).',
  message: 'Escribe un mensaje de al menos 10 caracteres.',
};

export function initCopyEmail(email) {
  const btn = $('#copy-mail'), status = $('#copy-status');
  if (!btn) return;
  const label = $('.copy-label', btn);
  btn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(email); ok = true; }
    catch {
      const ta = document.createElement('textarea'); ta.value = email; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    if (label) label.textContent = ok ? 'Copiado' : 'No se pudo copiar';
    if (status) status.textContent = ok ? 'Correo copiado al portapapeles.' : 'No se pudo copiar. Selecciona el correo manualmente.';
    setTimeout(() => { if (label) label.textContent = 'Copiar correo'; }, 2200);
  });
}

export function initContactForm({ endpoint = '', email = '' } = {}) {
  const form = $('#contact-form');
  if (!form) return;
  const status = $('#cf-status'), submit = $('#cf-submit'), count = $('#cf-count');
  const startedAt = Date.now();
  const fields = ['name', 'email', 'subject', 'message'];
  const input = (n) => form.elements[n];
  const err = (n) => $(`#cf-${n}-err`);

  const validateField = (n) => {
    const v = input(n).value.trim();
    const [min, max] = LIMITS[n];
    let ok = v.length >= min && v.length <= max;
    if (n === 'email') ok = ok && EMAIL_RE.test(v);
    input(n).setAttribute('aria-invalid', String(!ok));
    err(n).textContent = ok ? '' : MESSAGES[n];
    return ok;
  };
  const setStatus = (html, kind = '') => { status.className = `form-status ${kind}`; status.innerHTML = html; };

  fields.forEach((n) => {
    input(n).addEventListener('blur', () => { if (input(n).value) validateField(n); });
    input(n).addEventListener('input', () => { if (input(n).getAttribute('aria-invalid') === 'true') validateField(n); });
  });
  input('message').addEventListener('input', () => { count.textContent = `${input('message').value.length} / ${LIMITS.message[1]}`; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = fields.map((n) => [n, validateField(n)]);
    const firstBad = results.find(([, ok]) => !ok);
    if (firstBad) { input(firstBad[0]).focus(); setStatus('Revisa los campos marcados.', 'err'); return; }

    const payload = Object.fromEntries(fields.map((n) => [n, input(n).value.trim()]));
    payload.website = input('website').value; // honeypot
    payload.elapsed = Date.now() - startedAt;

    if (!endpoint) {
      const href = `mailto:${email}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(`${payload.message}\n\n— ${payload.name} (${payload.email})`)}`;
      setStatus(`El envío desde el formulario todavía no está configurado. <a href="${esc(href)}">Enviar este mensaje con tu app de correo</a>.`, 'err');
      return;
    }

    submit.disabled = true; submit.setAttribute('aria-busy', 'true');
    const label = $('.btn-label', submit), prev = label.textContent;
    label.textContent = 'Enviando…';
    setStatus('Enviando tu mensaje…');
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
      let data = {}; try { data = await res.json(); } catch { /* respuesta sin JSON */ }
      if (res.ok && data.ok) {
        form.reset(); count.textContent = `0 / ${LIMITS.message[1]}`;
        fields.forEach((n) => input(n).removeAttribute('aria-invalid'));
        setStatus('Mensaje enviado. Te responderé al correo que indicaste.', 'ok');
      } else if (res.status === 400 && data.fields) {
        Object.entries(data.fields).forEach(([n, m]) => { if (err(n)) { err(n).textContent = m; input(n).setAttribute('aria-invalid', 'true'); } });
        setStatus('Revisa los campos marcados.', 'err');
      } else if (res.status === 429) {
        setStatus('Has enviado varios mensajes seguidos. Espera unos minutos e inténtalo de nuevo.', 'err');
      } else {
        setStatus(`No se pudo enviar el mensaje. Inténtalo de nuevo o escribe a <a href="mailto:${esc(email)}">${esc(email)}</a>.`, 'err');
      }
    } catch (error) {
      const timeout = error.name === 'AbortError';
      setStatus(`${timeout ? 'El servidor tardó demasiado en responder.' : 'No hay conexión con el servidor.'} Inténtalo de nuevo o escribe a <a href="mailto:${esc(email)}">${esc(email)}</a>.`, 'err');
    } finally {
      clearTimeout(timer); submit.disabled = false; submit.removeAttribute('aria-busy'); label.textContent = prev;
    }
  });
}
