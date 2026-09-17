/**
 * Almacenamiento compatible con Upstash Redis y Vercel KV (REST).
 * No requiere SDK: Vercel inyecta las variables KV_* al conectar el store.
 */
export class RedisConversationStore {
  constructor({ url, token, prefix = 'conversation:' }) {
    if (!url || !token) {
      throw new Error('Faltan KV_REST_API_URL/KV_REST_API_TOKEN (o UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).');
    }
    this.url = url.replace(/\/$/, '');
    this.token = token;
    this.prefix = prefix;
  }

  key(contact) {
    return `${this.prefix}${contact}`;
  }

  async command(command, key, value) {
    const parts = [command, encodeURIComponent(key)];
    if (value !== undefined) parts.push(encodeURIComponent(value));
    const response = await fetch(`${this.url}/${parts.join('/')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` }
    });
    if (!response.ok) throw new Error(`Redis respondió ${response.status}: ${await response.text()}`);
    return response.json();
  }

  async get(contact) {
    const { result } = await this.command('get', this.key(contact));
    return result ? JSON.parse(result) : undefined;
  }

  async set(contact, conversation) {
    await this.command('set', this.key(contact), JSON.stringify(conversation));
  }
}
