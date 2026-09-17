/** Almacenamiento persistente de conversaciones mediante la API REST de Supabase. */
export class SupabaseConversationStore {
  constructor({ url, serviceRoleKey }) {
    if (!url || !serviceRoleKey) {
      throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
    }
    this.url = url.replace(/\/$/, '');
    this.serviceRoleKey = serviceRoleKey;
  }

  headers(extra = {}) {
    return {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      ...extra
    };
  }

  async get(contact) {
    const response = await fetch(
      `${this.url}/rest/v1/conversations?contact=eq.${encodeURIComponent(contact)}&select=conversation`,
      { headers: this.headers() }
    );
    if (!response.ok) throw new Error(`Supabase respondió ${response.status}: ${await response.text()}`);
    const records = await response.json();
    return records[0]?.conversation;
  }

  async set(contact, conversation) {
    const response = await fetch(`${this.url}/rest/v1/conversations?on_conflict=contact`, {
      method: 'POST',
      headers: this.headers({
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify({ contact, conversation, updated_at: new Date().toISOString() })
    });
    if (!response.ok) throw new Error(`Supabase respondió ${response.status}: ${await response.text()}`);
  }
}
