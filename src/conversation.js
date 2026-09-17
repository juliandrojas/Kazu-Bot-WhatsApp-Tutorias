const STEPS = {
  CONTACT: 'contact',
  NEED: 'need',
  MATERIAL: 'material',
  RECOMMENDATION: 'recommendation',
  RATE: 'rate',
  AVAILABILITY: 'availability',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed'
};

export const firstMessage = '¡Hola! Soy Kazu, el asistente de tutorías. Te ayudaré a organizar tu clase.\n\n¿Cómo te llamas?';

function normalize(text) {
  return text.trim().toLowerCase();
}

function isYes(text) {
  return ['si', 'sí', 's', 'yes'].includes(normalize(text));
}

function isNo(text) {
  return ['no', 'n'].includes(normalize(text));
}

function reset() {
  return { step: STEPS.CONTACT, data: {} };
}

/**
 * Avanza una conversación. No conoce WhatsApp ni HTTP: por eso es fácil de probar.
 */
export function advance(current, incomingText, settings) {
  const text = incomingText?.trim();
  if (!text) return { conversation: current ?? reset(), reply: 'No alcancé a leer tu mensaje. ¿Podrías escribirlo de nuevo?' };

  if (['menu', 'inicio', 'hola'].includes(normalize(text))) {
    return { conversation: reset(), reply: firstMessage };
  }

  const conversation = current ?? reset();
  const data = conversation.data ?? {};

  switch (conversation.step) {
    case STEPS.CONTACT:
      return {
        conversation: { step: STEPS.NEED, data: { ...data, name: text } },
        reply: `¡Mucho gusto, ${text}!\n\n¿Qué materia o tema necesitas reforzar y para cuándo?`
      };
    case STEPS.NEED:
      return {
        conversation: { step: STEPS.MATERIAL, data: { ...data, need: text } },
        reply: '¿Tienes una guía, taller, fotos o apuntes para revisar? Responde *sí* y envíalos, o *no* si aún no los tienes.'
      };
    case STEPS.MATERIAL:
      if (isNo(text)) {
        return {
          conversation: { step: STEPS.RECOMMENDATION, data: { ...data, material: 'No tiene material' } },
          reply: 'No hay problema. Recomiendo tener a mano el temario, los últimos apuntes y las dudas puntuales antes de iniciar.\n\n¿Te parece bien esta preparación? (sí/no)'
        };
      }
      if (isYes(text)) {
        return {
          conversation: { step: STEPS.MATERIAL, data: { ...data, material: 'Pendiente de recibir' } },
          reply: 'Perfecto. Envía ahora las fotos, PDF o enlace. Cuando termines, escribe *listo*.'
        };
      }
      if (normalize(text) === 'listo') {
        return {
          conversation: { step: STEPS.RECOMMENDATION, data: { ...data, material: 'Recibido' } },
          reply: 'Gracias. Revisaremos el material antes de la sesión y empezaremos por los ejercicios que más te cuesten.\n\n¿Te parece bien esta preparación? (sí/no)'
        };
      }
      return { conversation, reply: 'Responde *sí* para enviar material o *no* si no lo tienes.' };
    case STEPS.RECOMMENDATION:
      if (!isYes(text)) return { conversation, reply: 'Para continuar, responde *sí*. Si quieres cambiar la necesidad, escribe *inicio* y empezamos de nuevo.' };
      return {
        conversation: { step: STEPS.RATE, data },
        reply: `La tarifa es *${settings.price}*. Incluye preparación y una hora de tutoría.\n\n¿Quieres continuar? (sí/no)`
      };
    case STEPS.RATE:
      if (isNo(text)) return { conversation: reset(), reply: 'Entiendo. Si más adelante quieres agendar una tutoría, escribe *inicio*. ¡Gracias!' };
      if (!isYes(text)) return { conversation, reply: 'Por favor responde *sí* para continuar o *no* para finalizar.' };
      return {
        conversation: { step: STEPS.AVAILABILITY, data },
        reply: '¿Qué día y hora te quedan mejor? Por ejemplo: “jueves 5:00 p. m.”.'
      };
    case STEPS.AVAILABILITY:
      return {
        conversation: { step: STEPS.CONFIRMATION, data: { ...data, availability: text } },
        reply: `Resumen: tutoría de *${data.need}* para *${text}*, a nombre de *${data.name}*.\n\n¿Confirmas la solicitud? (sí/no)`
      };
    case STEPS.CONFIRMATION:
      if (isNo(text)) return { conversation: { step: STEPS.AVAILABILITY, data }, reply: 'De acuerdo. Indícame otro día y hora que te sirvan.' };
      if (!isYes(text)) return { conversation, reply: 'Responde *sí* para confirmar o *no* para cambiar el horario.' };
      return {
        conversation: { step: STEPS.COMPLETED, data: { ...data, confirmedAt: new Date().toISOString() } },
        reply: '¡Solicitud confirmada! Te contactaremos para validar la disponibilidad final. Escribe *inicio* si necesitas otra tutoría.'
      };
    case STEPS.COMPLETED:
      return { conversation, reply: 'Tu solicitud ya está registrada. Escribe *inicio* si quieres crear una nueva.' };
    default:
      return { conversation: reset(), reply: firstMessage };
  }
}
