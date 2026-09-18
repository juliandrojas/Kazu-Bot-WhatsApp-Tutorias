import { SupabaseConversationStore } from '../../src/supabase-store.js';
import { createEvolutionWebhook } from '../../src/webhook.js';

const required = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE', 'WEBHOOK_SECRET'];
const missing = required.filter((key) => !process.env[key]);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configurationError = missing.length
  ? `Faltan variables de Evolution API: ${missing.join(', ')}.`
  : null;

const handler = !configurationError && supabaseUrl && supabaseServiceRoleKey
  ? createEvolutionWebhook({
      store: new SupabaseConversationStore({ url: supabaseUrl, serviceRoleKey: supabaseServiceRoleKey }),
      settings: {
        price: process.env.TUTOR_PRICE ?? 'COP 45.000 por hora',
        tutorNumber: process.env.TUTOR_NOTIFY_NUMBER,
        startHour: Number(process.env.TUTOR_START_HOUR ?? 7),
        endHour: Number(process.env.TUTOR_END_HOUR ?? 21)
      },
      evolution: {
        baseUrl: process.env.EVOLUTION_API_URL,
        apiKey: process.env.EVOLUTION_API_KEY,
        instance: process.env.EVOLUTION_INSTANCE
      },
      webhookSecret: process.env.WEBHOOK_SECRET,
      calendar: { calendarId: process.env.GOOGLE_CALENDAR_ID, accessToken: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN, clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, refreshToken: process.env.GOOGLE_REFRESH_TOKEN }
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
