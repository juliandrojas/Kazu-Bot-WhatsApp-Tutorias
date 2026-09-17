import { advance } from './conversation.js';
import { incomingContact, incomingText, isIncoming, sendText } from './evolution.js';

/** Crea el manejador HTTP independiente de Express o Vercel. */
export function createEvolutionWebhook({ store, evolution, settings, logger = console }) {
  return async (req, res) => {
    if (!isIncoming(req.body)) return res.status(200).json({ ok: true, ignored: true });

    const contact = incomingContact(req.body);
    const message = incomingText(req.body);
    if (!message) return res.status(200).json({ ok: true, ignored: true });

    try {
      const result = advance(await store.get(contact), message, settings);
      await store.set(contact, result.conversation);
      await sendText({ ...evolution, number: contact, text: result.reply });
      return res.status(200).json({ ok: true });
    } catch (error) {
      logger.error('No se pudo procesar el webhook:', error.message);
      return res.status(500).json({ ok: false });
    }
  };
}
