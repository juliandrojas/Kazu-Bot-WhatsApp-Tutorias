import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConversationStore } from './store.js';
import { createEvolutionWebhook } from './webhook.js';

const required = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Faltan variables en .env: ${missing.join(', ')}. Copia .env.example como .env.`);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = new ConversationStore(path.join(__dirname, '../data/conversations.json'));
await store.load();
const settings = { price: process.env.TUTOR_PRICE ?? 'COP 45.000 por hora' };
const evolution = { baseUrl: process.env.EVOLUTION_API_URL, apiKey: process.env.EVOLUTION_API_KEY, instance: process.env.EVOLUTION_INSTANCE };

const app = express();
app.use(express.json({ limit: '10mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/webhook/evolution', createEvolutionWebhook({ store, evolution, settings }));

app.listen(process.env.PORT ?? 3000, () => console.log(`Bot listo en puerto ${process.env.PORT ?? 3000}`));
