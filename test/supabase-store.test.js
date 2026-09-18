import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseConversationStore } from '../src/supabase-store.js';

test('persiste los campos de la solicitud junto con el estado del diálogo', async () => {
  const requests = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response('', { status: 201 });
  };

  try {
    const store = new SupabaseConversationStore({
      url: 'https://example.supabase.co/',
      serviceRoleKey: 'service-role-key'
    });
    const conversation = {
      step: 'completed',
      data: {
        name: 'Ana',
        need: 'Álgebra',
        material: 'Recibido',
        availability: 'Jueves 5 pm',
        scheduledAt: '2026-09-24T17:00:00-05:00',
        confirmedAt: '2026-09-17T17:00:00.000Z'
      }
    };

    await store.set('573001112233', conversation);

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://example.supabase.co/rest/v1/conversations?on_conflict=contact');
    const saved = JSON.parse(requests[0].options.body);
    assert.deepEqual(saved, {
      contact: '573001112233',
      name: 'Ana',
      need: 'Álgebra',
      material: 'Recibido',
      materials: [],
      availability: 'Jueves 5 pm',
      scheduled_at: '2026-09-24T17:00:00-05:00',
      confirmed: true,
      confirmed_at: '2026-09-17T17:00:00.000Z',
      conversation,
      updated_at: saved.updated_at
    });
    assert.ok(Number.isFinite(Date.parse(saved.updated_at)));
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('reclama un mensaje solo cuando Supabase lo inserta por primera vez', async () => {
  const previousFetch = globalThis.fetch;
  const responses = [
    new Response(JSON.stringify([{ message_id: 'ABC123' }]), { status: 201 }),
    new Response(JSON.stringify([]), { status: 201 })
  ];
  globalThis.fetch = async () => responses.shift();

  try {
    const store = new SupabaseConversationStore({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'service-role-key'
    });

    assert.equal(await store.claimMessage('ABC123'), true);
    assert.equal(await store.claimMessage('ABC123'), false);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
