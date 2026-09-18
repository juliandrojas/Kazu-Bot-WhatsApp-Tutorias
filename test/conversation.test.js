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
  result = advance(state, 'Jueves 24 de septiembre de 2026, 5:00 p. m.', settings); state = result.conversation;
  assert.equal(result.conversation.data.scheduledAt, '2026-09-24T17:00:00-05:00');
  assert.equal(result.conversation.data.availability, 'Jueves 24 de septiembre de 2026, 5:00 p. m.');
  result = advance(state, 'sí', settings);
  assert.match(result.reply, /Solicitud confirmada/);
  assert.doesNotMatch(result.reply, /\d\/8|📍|Mapa:/);
  assert.equal(result.conversation.step, 'completed');
});

test('pide una fecha completa y consistente con el día de la semana', () => {
  const current = { step: 'availability', data: { name: 'Ana', need: 'Álgebra' } };
  const result = advance(current, 'lunes 22 de septiembre de 2026, 12:00 p. m.', settings);

  assert.equal(result.conversation, current);
  assert.match(result.reply, /día de la semana, la fecha y la hora/);
});

test('inicio reinicia el flujo', () => {
  const result = advance({ step: 'completed', data: { name: 'Ana' } }, 'inicio', settings);
  assert.equal(result.reply, firstMessage);
  assert.equal(result.conversation.step, 'contact');
});
