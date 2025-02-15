import Dexie, { Table } from 'dexie';
import { ChatThread, SystemPrompt } from './types';

export interface ThreadSummary {
  id: string;
  name: string;
  lastUpdated: Date;
}

export class DiyaChatDB extends Dexie {
  threads!: Table<ChatThread, string>;
  threadSummaries!: Table<ThreadSummary, string>;
  systemPrompts!: Table<SystemPrompt, string>;

  constructor() {
    super('DiyaChatDB');
    this.version(1).stores({
      threads: 'id', // full conversation data
      threadSummaries: 'id, name, lastUpdated', // light sidebar data
      systemPrompts: 'id, name',
    });
  }
}

export const db = new DiyaChatDB();
