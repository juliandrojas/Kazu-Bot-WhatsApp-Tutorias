import { RedisConversationStore } from '../../src/redis-store.js';
import { createEvolutionWebhook } from '../../src/webhook.js';

const required = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE'];
const missing = required.filter((key) => !process.env[key]);

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const configurationError = missing.length
  ? `Faltan variables de Evolution API: ${missing.join(', ')}.`
  : null;

const handler = !configurationError && redisUrl && redisToken
  ? createEvolutionWebhook({
      store: new RedisConversationStore({ url: redisUrl, token: redisToken }),
      settings: { price: process.env.TUTOR_PRICE ?? 'COP 45.000 por hora' },
      evolution: {
        baseUrl: process.env.EVOLUTION_API_URL,
        apiKey: process.env.EVOLUTION_API_KEY,
        instance: process.env.EVOLUTION_INSTANCE
      }
    })
  : null;

export default async function evolutionWebhook(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  if (configurationError) {
    console.error(configurationError);
    return res.status(500).json({ ok: false, error: 'Configuración incompleta.' });
  }
  if (!handler) {
    console.error('Faltan variables de Redis REST.');
    return res.status(500).json({ ok: false, error: 'Almacenamiento no configurado.' });
  }
  return handler(req, res);
}
