import { advance } from './conversation.js';
import { incomingContact, incomingMessageId, incomingText, isIncoming, sendText } from './evolution.js';

/** Crea el manejador HTTP independiente de Express o Vercel. */
export function createEvolutionWebhook({ store, evolution, settings, logger = console }) {
  return async (req, res) => {
    if (!isIncoming(req.body)) return res.status(200).json({ ok: true, ignored: true });

    const contact = incomingContact(req.body);
    const message = incomingText(req.body);
    if (!message) return res.status(200).json({ ok: true, ignored: true });

    const messageId = incomingMessageId(req.body);
    let claimedMessage = false;
    try {
      if (messageId) {
        claimedMessage = await store.claimMessage(messageId);
        if (!claimedMessage) return res.status(200).json({ ok: true, ignored: true, duplicate: true });
      }

      const result = advance(await store.get(contact), message, settings);
      await store.set(contact, result.conversation);
      await sendText({ ...evolution, number: contact, text: result.reply });
      return res.status(200).json({ ok: true });
    } catch (error) {
      if (claimedMessage) {
        try {
          await store.releaseMessage(messageId);
        } catch (releaseError) {
          logger.error('No se pudo liberar el mensaje para reintento:', releaseError.message);
        }
      }
      logger.error('No se pudo procesar el webhook:', error.message);
      return res.status(500).json({ ok: false });
    }
  };
}
