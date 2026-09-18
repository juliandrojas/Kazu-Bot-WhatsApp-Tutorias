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

function choices(prefix) {
  return {
    buttonText: 'Elegir',
    rows: [
      { id: `${prefix}_yes`, title: 'Sí, continuar', description: 'Confirmar esta opción' },
      { id: `${prefix}_no`, title: 'No', description: 'Cambiar o finalizar' }
    ]
  };
}

const months = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11
};

const weekdays = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  'miércoles': 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6
};

const WORK_SCHEDULE = 'lunes a viernes, de 8:00 a. m. a 12:00 m. y de 1:00 p. m. a 5:00 p. m.';

function conflictsWithWorkSchedule(weekday, hour) {
  return weekday >= 1 && weekday <= 5 && ((hour >= 8 && hour < 12) || (hour >= 13 && hour < 17));
}

function formatHour(hour, minute, period) {
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayPeriod = period
    ? (period.startsWith('a') ? 'a. m.' : 'p. m.')
    : (hour >= 12 ? 'p. m.' : 'a. m.');
  return `${displayHour}:${String(minute).padStart(2, '0')} ${displayPeriod}`;
}

/**
 * Acepta, por ejemplo, "lunes 21 de septiembre de 2026, 5:00 p. m.".
 * Valida que la fecha y el día de la semana realmente coincidan.
 */
function parseAvailability(text, settings) {
  const pattern = /^(domingo|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado)\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?\s*,?\s*(?:a\s+las\s+)?(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?$/i;
  const match = text.trim().match(pattern);
  if (!match) return { error: 'format' };

  const [, weekdayName, dayText, monthName, yearText, hourText, minuteText, periodText] = match;
  const weekday = normalize(weekdayName);
  const month = normalize(monthName);
  const day = Number(dayText);
  const year = yearText ? Number(yearText) : new Date().getFullYear();
  let hour = Number(hourText);
  const minute = minuteText ? Number(minuteText) : 0;
  const period = periodText ? normalize(periodText).replace(/\s/g, '') : null;

  if (minute > 59 || hour < 0 || hour > 23 || !Object.hasOwn(months, month)) return { error: 'time' };
  if (period) {
    if (hour < 1 || hour > 12) return { error: 'time' };
    if (period.startsWith('a') && hour === 12) hour = 0;
    if (period.startsWith('p') && hour !== 12) hour += 12;
  } else if (hour < 13) {
    return { error: 'period' };
  }

  const date = new Date(Date.UTC(year, months[month], day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== months[month] ||
    date.getUTCDate() !== day ||
    date.getUTCDay() !== weekdays[weekday]
  ) return { error: 'date' };

  const formattedWeekday = `${weekday[0].toUpperCase()}${weekday.slice(1)}`;
  const formattedMonth = month === 'setiembre' ? 'septiembre' : month;
  const scheduledAt = `${year}-${String(months[month] + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-05:00`;
  const now = settings.now ? new Date(settings.now) : new Date();
  if (new Date(scheduledAt) <= now) return { error: 'past' };
  if (weekdays[weekday] === 0) return { error: 'sunday' };
  if (hour < (settings.startHour ?? 7) || hour >= (settings.endHour ?? 21)) return { error: 'businessHours' };
  if (conflictsWithWorkSchedule(weekdays[weekday], hour)) return { error: 'workSchedule' };

  return {
    availability: `${formattedWeekday} ${day} de ${formattedMonth} de ${year}, ${formatHour(hour, minute, period)}`,
    scheduledAt
  };
}

function availabilityErrorReply(error, settings) {
  const example = `“lunes 21 de septiembre de ${new Date().getFullYear()}, 5:00 p. m.”`;
  switch (error) {
    case 'past':
      return 'Ese horario ya pasó. Elige una fecha y hora posteriores a este momento.';
    case 'businessHours':
      return `Solo podemos agendar entre ${settings.startHour ?? 7}:00 y ${settings.endHour ?? 21}:00. Elige una hora dentro de ese rango.`;
    case 'workSchedule':
      return `No podemos agendar en horario laboral: ${WORK_SCHEDULE} Elige otra hora.`;
    case 'sunday':
      return 'No agendamos tutorías los domingos. Elige otro día, por favor.';
    case 'date':
      return 'El día de la semana no coincide con la fecha, o esa fecha no existe. Revísala e intenta de nuevo.';
    case 'period':
      return `Falta indicar si la hora es a. m. o p. m. Por ejemplo: ${example}.`;
    case 'time':
      return 'La hora no es válida. Usa una hora entre 1:00 y 12:59 con a. m. o p. m.';
    default:
      return `Escríbeme el día, la fecha y la hora. Por ejemplo: ${example}.`;
  }
}

function reset() {
  return { step: STEPS.CONTACT, data: {} };
}

/**
 * Avanza una conversación. No conoce WhatsApp ni HTTP: por eso es fácil de probar.
 */
export function advance(current, incomingText, settings, attachment = null) {
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
        reply: '¿Tienes una guía, taller, fotos o apuntes para revisar? Puedes adjuntar imágenes, documentos, audio o video.',
        options: choices('material')
      };
    case STEPS.MATERIAL:
      if (attachment) {
        const materials = [...(data.materials ?? []), attachment];
        return {
          conversation: { step: STEPS.MATERIAL, data: { ...data, materials, material: `${materials.length} adjunto(s)` } },
          reply: `Recibí ${attachment.name ? `*${attachment.name}*` : `un(a) ${attachment.type}`}. Puedes enviar más archivos o escribe *listo* para continuar.`
        };
      }
      if (isNo(text)) {
        return {
          conversation: { step: STEPS.RECOMMENDATION, data: { ...data, material: 'No tiene material' } },
          reply: 'No hay problema. Recomiendo tener a mano el temario, los últimos apuntes y las dudas puntuales antes de iniciar.\n\n¿Te parece bien esta preparación?',
          options: choices('recommendation')
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
          conversation: { step: STEPS.RECOMMENDATION, data: { ...data, material: data.material ?? 'Recibido' } },
          reply: 'Gracias. Revisaremos el material antes de la sesión y empezaremos por los ejercicios que más te cuesten.\n\n¿Te parece bien esta preparación?',
          options: choices('recommendation')
        };
      }
      return { conversation, reply: 'Responde *sí* para enviar material o *no* si no lo tienes.' };
    case STEPS.RECOMMENDATION:
      if (!isYes(text)) return { conversation, reply: 'Para continuar, responde *sí*. Si quieres cambiar la necesidad, escribe *inicio* y empezamos de nuevo.' };
      return {
        conversation: { step: STEPS.RATE, data },
        reply: `La tarifa es *${settings.price}* una hora de tutoría.\n\n¿Quieres continuar?`,
        options: choices('rate')
      };
    case STEPS.RATE:
      if (isNo(text)) return { conversation: reset(), reply: 'Entiendo. Si más adelante quieres agendar una tutoría, escribe *inicio*. ¡Gracias!' };
      if (!isYes(text)) return { conversation, reply: 'Por favor responde *sí* para continuar o *no* para finalizar.' };
      return {
        conversation: { step: STEPS.AVAILABILITY, data },
        reply: `¿Qué día, fecha y hora te quedan mejor? No agendamos los domingos ni en horario laboral (${WORK_SCHEDULE}). Solo podemos agendar horarios futuros. Por ejemplo: “lunes 21 de septiembre de ${new Date().getFullYear()}, 6:00 p. m.”.`
      };
    case STEPS.AVAILABILITY:
      const schedule = parseAvailability(text, settings);
      if (schedule.error) {
        return {
          conversation,
          reply: availabilityErrorReply(schedule.error, settings)
        };
      }
      return {
        conversation: { step: STEPS.CONFIRMATION, data: { ...data, ...schedule } },
        reply: `Resumen de solicitud\n• Estudiante: *${data.name}*\n• Tema: *${data.need}*\n• Material: *${data.material ?? 'Sin adjuntos'}*\n• Fecha: *${schedule.availability}*\n\n¿Confirmas la solicitud?`,
        options: choices('confirmation')
      };
    case STEPS.CONFIRMATION:
      if (isNo(text)) return { conversation: { step: STEPS.AVAILABILITY, data }, reply: 'De acuerdo. Indícame otro día y hora que te sirvan.' };
      if (!isYes(text)) return { conversation, reply: 'Responde *sí* para confirmar o *no* para cambiar el horario.' };
      return {
        conversation: { step: STEPS.COMPLETED, data: { ...data, confirmedAt: new Date().toISOString() } },
        reply: '¡Solicitud confirmada! Tu solicitud fue enviada al tutor para revisar la disponibilidad final. Escribe *inicio* si necesitas otra tutoría.',
        confirmed: true
      };
    case STEPS.COMPLETED:
      return { conversation, reply: 'Tu solicitud ya está registrada. Escribe *inicio* si quieres crear una nueva.' };
    default:
      return { conversation: reset(), reply: firstMessage };
  }
}
