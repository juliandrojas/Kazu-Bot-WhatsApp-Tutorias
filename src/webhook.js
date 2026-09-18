import { advance } from './conversation.js';
import { incomingAttachment, incomingContact, incomingMessageId, incomingText, isIncoming, sendList, sendText } from './evolution.js';
import { hasValidWebhookSecret } from './security.js';
import { createCalendarEvent } from './calendar.js';

/** Crea el manejador HTTP independiente de Express o Vercel. */
export function createEvolutionWebhook({ store, evolution, settings, webhookSecret, calendar, logger = console }) {
  return async (req, res) => {
    if (webhookSecret && !hasValidWebhookSecret(req, webhookSecret)) return res.status(401).json({ ok: false, error: 'Webhook no autorizado.' });
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
      if (result.confirmed && calendar?.calendarId && (calendar?.accessToken || calendar?.refreshToken)) {
        try {
          const event = await createCalendarEvent({ calendar, request: { ...result.conversation.data, contact } });
          if (event?.id) await store.setCalendarEvent(contact, event.id);
        } catch (calendarError) {
          logger.error('No se pudo crear el evento de calendario:', calendarError.message);
          try { await store.logError?.({ source: 'calendar', message: calendarError.message, messageId }); } catch { /* El webhook no debe fallar por el registro operativo. */ }
        }
      }
      if (result.confirmed && settings.tutorNumber) {
        const request = result.conversation.data;
        const phone = contact.replace(/@s\.whatsapp\.net$/, '');
        await sendText({ ...evolution, number: settings.tutorNumber, text: `Nueva tutoría confirmada\nEstudiante: ${request.name}\nContacto: ${phone}\nTema: ${request.need}\nHorario: ${request.availability}\nMaterial: ${request.material ?? 'Sin adjuntos'}` });
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
      try { await store.logError?.({ source: 'webhook', message: error.message, messageId }); } catch (logError) { logger.error('No se pudo registrar el error:', logError.message); }
      return res.status(500).json({ ok: false });
    }
  };
}
