'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContact } = require('../validate');
const { createHandler } = require('../handler');

const ORIGIN = 'https://jazyelae.github.io';
const good = { name: 'Ana Pérez', email: 'ana@example.com', subject: 'Hola', message: 'Me gustaría hablar sobre una vacante.', website: '', elapsed: 9000 };

function mkRes() {
  const r = { code: 200, headers: {}, body: undefined };
  r.set = (k, v) => { r.headers[k] = v; return r; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  return r;
}
const mkReq = (over = {}) => ({ method: 'POST', body: { ...good }, ip: '1.2.3.4', headers: {}, get: (h) => (h.toLowerCase() === 'origin' ? ORIGIN : ''), ...over });
const setup = (sendMail) => {
  const sent = [];
  const handle = createHandler({ allowedOrigins: [ORIGIN], to: 'dest@example.com', logger: { error() {} }, sendMail: sendMail || (async (m) => { sent.push(m); }) });
  return { handle, sent };
};

test('validación acepta datos correctos', () => assert.equal(validateContact(good).ok, true));
test('validación rechaza campos inválidos', () => {
  const r = validateContact({ name: 'A', email: 'x', subject: '', message: 'corto' });
  assert.deepEqual(Object.keys(r.fields).sort(), ['email', 'message', 'name', 'subject']);
});
test('validación elimina saltos de línea del asunto (inyección de cabeceras)', () => {
  const r = validateContact({ ...good, subject: 'Hola\r\nBcc: x@y.com' });
  assert.equal(/[\r\n]/.test(r.data.subject), false);
});
test('rechaza demasiados enlaces', () => {
  const m = 'http://a.com http://b.com http://c.com http://d.com texto';
  assert.ok(validateContact({ ...good, message: m }).fields.message);
});

test('envía el correo con datos válidos', async () => {
  const { handle, sent } = setup(); const res = mkRes();
  await handle(mkReq(), res);
  assert.equal(res.code, 200); assert.equal(res.body.ok, true);
  assert.equal(sent.length, 1); assert.equal(sent[0].to, 'dest@example.com');
  assert.match(sent[0].subject, /^\[JAZIEL\.DEV\] Hola/);
  assert.equal(res.headers['Access-Control-Allow-Origin'], ORIGIN);
});
test('escapa HTML en el cuerpo del correo', async () => {
  const { handle, sent } = setup(); const res = mkRes();
  await handle(mkReq({ body: { ...good, message: '<script>alert(1)</script> mensaje largo' } }), res);
  assert.equal(sent[0].html.includes('<script>'), false);
});
test('honeypot: responde ok pero no envía', async () => {
  const { handle, sent } = setup(); const res = mkRes();
  await handle(mkReq({ body: { ...good, website: 'http://spam' } }), res);
  assert.equal(res.code, 200); assert.equal(sent.length, 0);
});
test('rechaza envíos demasiado rápidos', async () => {
  const { handle, sent } = setup(); const res = mkRes();
  await handle(mkReq({ body: { ...good, elapsed: 300 } }), res);
  assert.equal(res.code, 400); assert.equal(sent.length, 0);
});
test('rechaza orígenes no permitidos', async () => {
  const { handle, sent } = setup(); const res = mkRes();
  await handle(mkReq({ get: () => 'https://malo.example' }), res);
  assert.equal(res.code, 403); assert.equal(sent.length, 0);
});
test('responde al preflight OPTIONS', async () => {
  const { handle } = setup(); const res = mkRes();
  await handle(mkReq({ method: 'OPTIONS' }), res);
  assert.equal(res.code, 204);
});
test('solo acepta POST', async () => {
  const { handle } = setup(); const res = mkRes();
  await handle(mkReq({ method: 'GET' }), res);
  assert.equal(res.code, 405);
});
test('limita por IP (3 por ventana)', async () => {
  const { handle } = setup(); const codes = [];
  for (let i = 0; i < 4; i++) { const res = mkRes(); await handle(mkReq(), res); codes.push(res.code); }
  assert.deepEqual(codes, [200, 200, 200, 429]);
});
test('devuelve 502 si falla el envío y no filtra detalles', async () => {
  const { handle } = setup(async () => { throw new Error('SMTP caído'); }); const res = mkRes();
  await handle(mkReq(), res);
  assert.equal(res.code, 502); assert.equal(JSON.stringify(res.body).includes('SMTP'), false);
});
