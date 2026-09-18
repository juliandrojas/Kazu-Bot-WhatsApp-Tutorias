import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, firstMessage } from '../src/conversation.js';

const settings = { price: 'COP 45.000' };

test('recorre una solicitud hasta la confirmación', () => {
  let state;
  let result = advance(state, 'Ana', settings); state = result.conversation;
  assert.match(result.reply, /Mucho gusto, Ana/);
  result = advance(state, 'Álgebra para el viernes', settings); state = result.conversation;
  result = advance(state, 'no', settings); state = result.conversation;
  result = advance(state, 'sí', settings); state = result.conversation;
  assert.match(result.reply, /45.000/);
  result = advance(state, 'sí', settings); state = result.conversation;
  result = advance(state, 'Jueves 24 de septiembre de 2026, 4:00 p. m.', settings); state = result.conversation;
  assert.equal(result.conversation.data.scheduledAt, '2026-09-24T16:00:00-05:00');
  assert.equal(result.conversation.data.availability, 'Jueves 24 de septiembre de 2026, 4:00 p. m.');
  result = advance(state, 'sí', settings);
  assert.match(result.reply, /Solicitud confirmada/);
  assert.doesNotMatch(result.reply, /\d\/8|📍|Mapa:/);
  assert.equal(result.conversation.step, 'completed');
});

test('pide una fecha completa y consistente con el día de la semana', () => {
  const current = { step: 'availability', data: { name: 'Ana', need: 'Álgebra' } };
  const result = advance(current, 'lunes 22 de septiembre de 2026, 12:00 p. m.', settings);

  assert.equal(result.conversation, current);
  assert.match(result.reply, /día de la semana no coincide/);
});

test('inicio reinicia el flujo', () => {
  const result = advance({ step: 'completed', data: { name: 'Ana' } }, 'inicio', settings);
  assert.equal(result.reply, firstMessage);
  assert.equal(result.conversation.step, 'contact');
});

test('registra adjuntos y no permite horarios fuera de la jornada', () => {
  const material = advance(
    { step: 'material', data: { name: 'Ana', need: 'Álgebra' } },
    'adjunto', settings,
    { type: 'documento', name: 'taller.pdf', mimeType: 'application/pdf', messageId: 'M1' }
  );
  assert.equal(material.conversation.data.material, '1 adjunto(s)');
  assert.equal(material.conversation.data.materials[0].name, 'taller.pdf');

  const availability = advance(
    { step: 'availability', data: { name: 'Ana', need: 'Álgebra' } },
    'viernes 25 de septiembre de 2026, 6:00 a. m.',
    { ...settings, now: '2026-09-18T12:00:00-05:00', startHour: 7, endHour: 21 }
  );
  assert.equal(availability.conversation.step, 'availability');
  assert.match(availability.reply, /lunes a viernes, de 8:00 a\. m\. a 12:00 m\. y de 1:00 p\. m\. a 5:00 p\. m\./);
});

test('solo permite horarios de lunes a viernes en las dos franjas de atención', () => {
  const current = { step: 'availability', data: { name: 'Ana', need: 'Álgebra' } };
  const settingsWithNow = { ...settings, now: '2026-09-18T12:00:00-05:00' };
  const weekend = advance(current, 'sábado 19 de septiembre de 2026, 10:00 a. m.', settingsWithNow);
  const lunch = advance(current, 'lunes 21 de septiembre de 2026, 12:30 p. m.', settingsWithNow);

  assert.match(weekend.reply, /Elige un día entre lunes y viernes/);
  assert.match(lunch.reply, /Nuestro horario es lunes a viernes/);
});
