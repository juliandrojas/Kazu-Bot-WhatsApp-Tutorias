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
      body: JSON.stringify({
        contact,
        name: conversation.data?.name ?? null,
        need: conversation.data?.need ?? null,
        material: conversation.data?.material ?? null,
        materials: conversation.data?.materials ?? [],
        availability: conversation.data?.availability ?? null,
        scheduled_at: conversation.data?.scheduledAt ?? null,
        confirmed: conversation.step === 'completed',
        confirmed_at: conversation.data?.confirmedAt ?? null,
        conversation,
        updated_at: new Date().toISOString()
      })
    });
    if (!response.ok) throw new Error(`Supabase respondió ${response.status}: ${await response.text()}`);
  }

  /**
   * Registra un evento una sola vez. Un conflicto de clave primaria indica que
   * Evolution API está reintentando exactamente el mismo mensaje.
   */
  async claimMessage(messageId) {
    const response = await fetch(`${this.url}/rest/v1/processed_messages?on_conflict=message_id`, {
      method: 'POST',
      headers: this.headers({
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=representation'
      }),
      body: JSON.stringify({ message_id: messageId })
    });
    if (!response.ok) throw new Error(`Supabase respondió ${response.status}: ${await response.text()}`);
    const records = await response.json();
    return records.length > 0;
  }

  async releaseMessage(messageId) {
    const response = await fetch(
      `${this.url}/rest/v1/processed_messages?message_id=eq.${encodeURIComponent(messageId)}`,
      { method: 'DELETE', headers: this.headers() }
    );
    if (!response.ok) throw new Error(`Supabase respondió ${response.status}: ${await response.text()}`);
  }
}
