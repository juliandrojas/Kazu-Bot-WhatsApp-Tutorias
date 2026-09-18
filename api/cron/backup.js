import { SupabaseConversationStore } from '../../src/supabase-store.js';

export default async function backup(req, res) {
  const authorization = req.headers?.authorization ?? '';
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ ok: false });
  try {
    const store = new SupabaseConversationStore({ url: process.env.SUPABASE_URL, serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
    return res.status(200).json({ ok: true, requests: await store.createBackup() });
  } catch (error) {
    console.error('Copia programada:', error.message);
    return res.status(500).json({ ok: false });
  }
}
