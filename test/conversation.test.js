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
  result = advance(state, 'jueves 5 pm', settings); state = result.conversation;
  result = advance(state, 'sí', settings);
  assert.match(result.reply, /Solicitud confirmada/);
  assert.doesNotMatch(result.reply, /\d\/8|📍|Mapa:/);
  assert.equal(result.conversation.step, 'completed');
});

test('inicio reinicia el flujo', () => {
  const result = advance({ step: 'completed', data: { name: 'Ana' } }, 'inicio', settings);
  assert.equal(result.reply, firstMessage);
  assert.equal(result.conversation.step, 'contact');
});
