import { advance } from './conversation.js';
import { incomingAttachment, incomingContact, incomingMessageId, incomingText, isIncoming, sendList, sendText } from './evolution.js';

/** Crea el manejador HTTP independiente de Express o Vercel. */
export function createEvolutionWebhook({ store, evolution, settings, logger = console }) {
  return async (req, res) => {
    if (!isIncoming(req.body)) return res.status(200).json({ ok: true, ignored: true });

    const contact = incomingContact(req.body);
    const message = incomingText(req.body);
    const attachment = incomingAttachment(req.body);
    if (!message && !attachment) return res.status(200).json({ ok: true, ignored: true });

    const messageId = incomingMessageId(req.body);
    let claimedMessage = false;
    try {
      if (messageId) {
        claimedMessage = await store.claimMessage(messageId);
        if (!claimedMessage) return res.status(200).json({ ok: true, ignored: true, duplicate: true });
      }

      const result = advance(await store.get(contact), message || 'adjunto', settings, attachment);
      await store.set(contact, result.conversation);
      if (result.confirmed && settings.tutorNumber) {
        const request = result.conversation.data;
        await sendText({ ...evolution, number: settings.tutorNumber, text: `Nueva tutoría confirmada\nEstudiante: ${request.name}\nContacto: ${contact}\nTema: ${request.need}\nHorario: ${request.availability}\nMaterial: ${request.material ?? 'Sin adjuntos'}` });
      }
      if (result.options) await sendList({ ...evolution, number: contact, text: result.reply, options: result.options });
      else await sendText({ ...evolution, number: contact, text: result.reply });
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
