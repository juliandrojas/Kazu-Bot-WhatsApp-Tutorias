export async function sendText({ baseUrl, apiKey, instance, number, text }) {
  const url = `${baseUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ number, text, options: { delay: 800, presence: 'composing' } })
  });
  if (!response.ok) throw new Error(`Evolution API respondió ${response.status}: ${await response.text()}`);
}

export function incomingText(payload) {
  const message = payload?.data?.message ?? payload?.message;
  return message?.conversation ?? message?.extendedTextMessage?.text ?? message?.imageMessage?.caption ?? '';
}

export function incomingContact(payload) {
  return payload?.data?.key?.remoteJid ?? payload?.key?.remoteJid;
}

export function isIncoming(payload) {
  const key = payload?.data?.key ?? payload?.key;
  return Boolean(key?.remoteJid) && !key.fromMe && !key.remoteJid.endsWith('@g.us');
}
