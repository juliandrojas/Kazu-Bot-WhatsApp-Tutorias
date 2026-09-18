export async function sendText({ baseUrl, apiKey, instance, number, text }) {
  const url = `${baseUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ number, text, options: { delay: 800, presence: 'composing' } })
  });
  if (!response.ok) throw new Error(`Evolution API respondió ${response.status}: ${await response.text()}`);
}

/** Envía una lista nativa de WhatsApp mediante Evolution API v2. */
export async function sendList({ baseUrl, apiKey, instance, number, text, options }) {
  const url = `${baseUrl.replace(/\/$/, '')}/message/sendList/${encodeURIComponent(instance)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({
      number, title: options.title ?? 'Kazu Tutorías', description: text,
      buttonText: options.buttonText ?? 'Elegir', footerText: 'Kazu Tutorías',
      sections: [{ title: options.sectionTitle ?? 'Elige una opción', rows: options.rows.map(({ id, title, description }) => ({ rowId: id, title, description })) }]
    })
  });
  if (!response.ok) throw new Error(`Evolution API respondió ${response.status}: ${await response.text()}`);
}

export function incomingText(payload) {
  const message = payload?.data?.message ?? payload?.message;
  const selected = message?.listResponseMessage?.singleSelectReply?.selectedRowId ?? message?.buttonsResponseMessage?.selectedButtonId;
  if (selected) return selected.endsWith('_yes') ? 'sí' : selected.endsWith('_no') ? 'no' : selected;
  return message?.conversation ?? message?.extendedTextMessage?.text ?? message?.imageMessage?.caption ?? '';
}

export function incomingAttachment(payload) {
  const message = payload?.data?.message ?? payload?.message;
  for (const [key, type] of [['imageMessage', 'imagen'], ['documentMessage', 'documento'], ['videoMessage', 'video'], ['audioMessage', 'audio']]) {
    const media = message?.[key];
    if (media) return { type, name: media.fileName ?? null, mimeType: media.mimetype ?? null, caption: media.caption ?? null, messageId: incomingMessageId(payload) ?? null, receivedAt: new Date().toISOString() };
  }
  return null;
}

export function incomingContact(payload) {
  return payload?.data?.key?.remoteJid ?? payload?.key?.remoteJid;
}

/** Identificador estable que Evolution API conserva cuando reintenta un mismo evento. */
export function incomingMessageId(payload) {
  return payload?.data?.key?.id ?? payload?.key?.id;
}

export function isIncoming(payload) {
  const key = payload?.data?.key ?? payload?.key;
  return Boolean(key?.remoteJid) && !key.fromMe && !key.remoteJid.endsWith('@g.us');
}
