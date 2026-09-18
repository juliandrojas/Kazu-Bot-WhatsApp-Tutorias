import 'dotenv/config';
import express from 'express';
import { SupabaseConversationStore } from './supabase-store.js';
import { createEvolutionWebhook } from './webhook.js';

const required = [
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'EVOLUTION_INSTANCE',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Faltan variables en .env: ${missing.join(', ')}. Copia .env.example como .env.`);

const store = new SupabaseConversationStore({
  url: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});
const settings = {
  price: process.env.TUTOR_PRICE ?? 'COP 45.000 por hora',
  tutorNumber: process.env.TUTOR_NOTIFY_NUMBER,
  startHour: Number(process.env.TUTOR_START_HOUR ?? 7),
  endHour: Number(process.env.TUTOR_END_HOUR ?? 21)
};
const evolution = { baseUrl: process.env.EVOLUTION_API_URL, apiKey: process.env.EVOLUTION_API_KEY, instance: process.env.EVOLUTION_INSTANCE };

const app = express();
app.use(express.json({ limit: '10mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/webhook/evolution', createEvolutionWebhook({ store, evolution, settings }));

app.listen(process.env.PORT ?? 3000, () => console.log(`Bot listo en puerto ${process.env.PORT ?? 3000}`));
