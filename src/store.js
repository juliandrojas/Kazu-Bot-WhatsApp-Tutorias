import fs from 'node:fs/promises';
import path from 'node:path';

export class ConversationStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.records = new Map();
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.records = new Map(Object.entries(JSON.parse(raw)));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  get(contact) { return this.records.get(contact); }

  async set(contact, conversation) {
    this.records.set(contact, conversation);
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(Object.fromEntries(this.records), null, 2));
  }
}
