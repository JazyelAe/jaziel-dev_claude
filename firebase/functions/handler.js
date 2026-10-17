'use strict';
// Lógica del endpoint de contacto, separada de Firebase para poder probarla sin desplegar.
const { validateContact, escapeHtml } = require('./validate');

const MIN_FILL_MS = 2500;            // un humano tarda más que esto en rellenar el formulario
const MAX_BODY_BYTES = 10 * 1024;
const WINDOW_MS = 10 * 60 * 1000;    // ventana de límite por IP
const MAX_PER_WINDOW = 3;
const MAX_GLOBAL_PER_HOUR = 30;      // tope por instancia

function createLimiter(now = Date.now) {
  const byIp = new Map();
  let globalHits = [];
  return function allow(ip) {
    const t = now();
    globalHits = globalHits.filter((h) => t - h < 3600 * 1000);
    if (globalHits.length >= MAX_GLOBAL_PER_HOUR) return false;
    const hits = (byIp.get(ip) || []).filter((h) => t - h < WINDOW_MS);
    if (hits.length >= MAX_PER_WINDOW) { byIp.set(ip, hits); return false; }
    hits.push(t); byIp.set(ip, hits); globalHits.push(t);
    if (byIp.size > 500) for (const [k, v] of byIp) if (!v.some((h) => t - h < WINDOW_MS)) byIp.delete(k);
    return true;
  };
}

/**
 * @param {object} deps
 * @param {string[]} deps.allowedOrigins  Orígenes permitidos (p. ej. https://jazyelae.github.io)
 * @param {(mail: object) => Promise<void>} deps.sendMail
 * @param {string} deps.to  Correo de destino
 * @param {{error: Function, warn: Function}} [deps.logger]
 */
function createHandler({ allowedOrigins, sendMail, to, logger = console, now = Date.now }) {
  const allow = createLimiter(now);
  const origins = allowedOrigins.map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);

  return async function handle(req, res) {
    const origin = String(req.get ? req.get('origin') || '' : req.headers.origin || '').replace(/\/$/, '');
    const originOk = origins.includes(origin);
    if (originOk) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
    }
    if (req.method === 'OPTIONS') return res.status(originOk ? 204 : 403).send('');
    if (req.method !== 'POST') { res.set('Allow', 'POST, OPTIONS'); return res.status(405).json({ ok: false, error: 'method_not_allowed' }); }
    if (!originOk) return res.status(403).json({ ok: false, error: 'origin_not_allowed' });

    const size = req.rawBody ? req.rawBody.length : JSON.stringify(req.body || {}).length;
    if (size > MAX_BODY_BYTES) return res.status(413).json({ ok: false, error: 'payload_too_large' });
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // Trampa para bots: si el campo oculto trae algo, se responde "ok" sin enviar nada.
    if (typeof body.website === 'string' && body.website.trim() !== '') return res.status(200).json({ ok: true });

    const elapsed = Number(body.elapsed);
    if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
      return res.status(400).json({ ok: false, error: 'too_fast', fields: { message: 'Espera un momento antes de enviar y vuelve a intentarlo.' } });
    }

    const ip = req.ip || (req.headers && req.headers['x-forwarded-for']) || 'unknown';
    if (!allow(String(ip))) return res.status(429).json({ ok: false, error: 'rate_limited' });

    const result = validateContact(body);
    if (!result.ok) return res.status(400).json({ ok: false, error: 'validation', fields: result.fields });

    const { name, email, subject, message } = result.data;
    try {
      await sendMail({
        to,
        replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
        subject: `[JAZIEL.DEV] ${subject}`,
        text: `Nuevo mensaje desde el portafolio\n\nNombre: ${name}\nCorreo: ${email}\nAsunto: ${subject}\n\n${message}\n`,
        html: `<p><strong>Nuevo mensaje desde el portafolio</strong></p><p><strong>Nombre:</strong> ${escapeHtml(name)}<br><strong>Correo:</strong> ${escapeHtml(email)}<br><strong>Asunto:</strong> ${escapeHtml(subject)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      logger.error('Fallo al enviar el correo de contacto', { code: err && err.code, message: err && err.message });
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }
  };
}

module.exports = { createHandler, createLimiter, MIN_FILL_MS };
