import Dexie, { Table } from 'dexie';
import { ChatThread, SystemPrompt, ThreadSummary } from './types';

export class ChatDB extends Dexie {
  threads!: Table<ChatThread, string>;
  threadSummaries!: Table<ThreadSummary, string>;
  systemPrompts!: Table<SystemPrompt, string>;

  constructor() {
    super('ChatDB');
    // Define schema. Only the columns that are used in queries need to be defined for performance.
    this.version(1).stores({
      threads: 'id', // full conversation data
      threadSummaries: 'id, name, lastUpdated', // light sidebar data
      systemPrompts: 'id, name',
    });
  }
}

export const db = new ChatDB();
