import test from 'node:test';
import assert from 'node:assert/strict';
import { createEvolutionWebhook } from '../src/webhook.js';

function responseRecorder() {
  return {
    code: null,
    body: null,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('ignora un reintento con el mismo identificador de WhatsApp', async () => {
  let claims = 0;
  let saves = 0;
  const store = {
    async claimMessage() { claims += 1; return claims === 1; },
    async releaseMessage() {},
    async get() { return undefined; },
    async set() { saves += 1; }
  };
  const previousFetch = globalThis.fetch;
  const sentMessages = [];
  globalThis.fetch = async (url, options) => {
    sentMessages.push({ url, options });
    return new Response('', { status: 200 });
  };
  const handler = createEvolutionWebhook({
    store,
    settings: { price: 'COP 45.000' },
    evolution: { baseUrl: 'https://evolution.example.com', apiKey: 'key', instance: 'kazu' }
  });
  const request = {
    body: {
      data: {
        key: { id: 'ABC123', remoteJid: '573001112233@s.whatsapp.net', fromMe: false },
        message: { conversation: 'hola' }
      }
    }
  };

  try {
    const firstResponse = responseRecorder();
    await handler(request, firstResponse);
    const retryResponse = responseRecorder();
    await handler(request, retryResponse);

    assert.equal(firstResponse.code, 200);
    assert.equal(retryResponse.code, 200);
    assert.deepEqual(retryResponse.body, { ok: true, ignored: true, duplicate: true });
    assert.equal(saves, 1);
    assert.equal(sentMessages.length, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
