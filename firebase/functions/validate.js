'use strict';
// Validación y limpieza del mensaje de contacto (lado servidor). Sin dependencias.

const LIMITS = { name: [2, 80], email: [5, 120], subject: [3, 120], message: [10, 2000] };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LINKS = 3;

// Quita caracteres de control (incluye saltos de línea cuando singleLine = true) para evitar inyección de cabeceras.
function clean(value, singleLine) {
  let v = typeof value === 'string' ? value : '';
  v = v.replace(/\r\n?/g, '\n');
  v = singleLine ? v.replace(/[\u0000-\u001F\u007F]+/g, ' ') : v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return v.trim();
}

function validateContact(body) {
  const input = body && typeof body === 'object' ? body : {};
  const data = {
    name: clean(input.name, true),
    email: clean(input.email, true),
    subject: clean(input.subject, true),
    message: clean(input.message, false),
  };
  const fields = {};
  const check = (key, ok, msg) => { if (!ok) fields[key] = msg; };
  const inRange = (key) => data[key].length >= LIMITS[key][0] && data[key].length <= LIMITS[key][1];

  check('name', inRange('name'), 'Escribe tu nombre (2 a 80 caracteres).');
  check('email', inRange('email') && EMAIL_RE.test(data.email), 'Escribe un correo válido.');
  check('subject', inRange('subject'), 'Escribe un asunto (3 a 120 caracteres).');
  check('message', inRange('message'), 'El mensaje debe tener entre 10 y 2000 caracteres.');
  if (!fields.message && (data.message.match(/https?:\/\//gi) || []).length > MAX_LINKS) {
    fields.message = `El mensaje no puede incluir más de ${MAX_LINKS} enlaces.`;
  }
  return { ok: Object.keys(fields).length === 0, data, fields };
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = { validateContact, escapeHtml, LIMITS };
