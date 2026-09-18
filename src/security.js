import { createHmac, timingSafeEqual } from 'node:crypto';

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left ?? '');
  const rightBuffer = Buffer.from(right ?? '');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

/** Verifica el secreto del webhook sin exponerlo en los registros. */
export function hasValidWebhookSecret(req, secret) {
  if (!secret) return false;
  const supplied = req.get?.('x-webhook-secret') ?? req.headers?.['x-webhook-secret'];
  if (supplied && safeEqual(supplied, secret)) return true;

  // Alternativa para proveedores que firman el cuerpo con HMAC SHA-256.
  const signature = req.get?.('x-webhook-signature') ?? req.headers?.['x-webhook-signature'];
  if (signature && req.rawBody) {
    const expected = `sha256=${createHmac('sha256', secret).update(req.rawBody).digest('hex')}`;
    return safeEqual(signature, expected);
  }
  return false;
}

export function requireAdmin(req, res, adminUsername, adminPassword) {
  if (!adminUsername || !adminPassword) return res.status(503).json({ ok: false, error: 'Panel no configurado.' });
  const authorization = req.headers?.authorization ?? '';
  const encoded = authorization.startsWith('Basic ') ? authorization.slice(6) : '';
  const [username, password] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
  if (!safeEqual(username, adminUsername) || !safeEqual(password, adminPassword)) {
    res.setHeader?.('WWW-Authenticate', 'Basic realm="Kazu administración", charset="UTF-8"');
    res.status(401).json({ ok: false, error: 'No autorizado.' });
    return false;
  }
  return true;
}
