import { SupabaseConversationStore } from '../../src/supabase-store.js';
import { requireAdmin } from '../../src/security.js';

export default async function backup(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  if (!requireAdmin(req, res, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)) return;
  try {
    const store = new SupabaseConversationStore({ url: process.env.SUPABASE_URL, serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
    return res.status(200).json({ ok: true, requests: await store.createBackup() });
  } catch (error) {
    console.error('Copia:', error.message);
    return res.status(500).json({ ok: false, error: 'No se pudo crear la copia.' });
  }
}
