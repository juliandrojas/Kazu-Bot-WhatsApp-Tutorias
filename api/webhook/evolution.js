import { SupabaseConversationStore } from '../../src/supabase-store.js';
import { createEvolutionWebhook } from '../../src/webhook.js';

const required = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE'];
const missing = required.filter((key) => !process.env[key]);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configurationError = missing.length
  ? `Faltan variables de Evolution API: ${missing.join(', ')}.`
  : null;

const handler = !configurationError && supabaseUrl && supabaseServiceRoleKey
  ? createEvolutionWebhook({
      store: new SupabaseConversationStore({ url: supabaseUrl, serviceRoleKey: supabaseServiceRoleKey }),
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
    console.error('Faltan variables de Supabase.');
    return res.status(500).json({ ok: false, error: 'Almacenamiento no configurado.' });
  }
  return handler(req, res);
}
