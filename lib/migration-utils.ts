import { db } from './db';
import { ChatThread, ThreadSummary, Message, BedrockModelNames } from '../lib/types';

interface LegacyConversation {
  id: string;
  title: string;
  messages: Message[];
}

function convertLegacyToNewFormat(legacy: LegacyConversation): ChatThread {
  return {
    id: legacy.id,
    name: legacy.title,
    branches: [
      {
        id: 1,
        name: 'Main',
        messages: legacy.messages,
        attachments: [],
        createdAt: new Date(),
        description: 'Migrated from legacy conversation',
        model: BedrockModelNames.CLAUDE_V3_5_SONNET_V2, // Default to latest model
      },
    ],
    currentBranchId: 1,
  };
}

export async function runMigration(): Promise<void> {
  try {
    if (localStorage.getItem('migrationDone') === 'true') {
      // Check if migration was done already
      console.log('Migration already completed');
      return;
    }

    // Try to migrate from both legacy sources
    const chatThreadsData = localStorage.getItem('chatThreads');
    const legacyDiyaData = localStorage.getItem('DIYA_CONVERSATIONS');

    if (!chatThreadsData && !legacyDiyaData) {
      return; // No old data to migrate
    }

    // Create backup before migration
    if (chatThreadsData) {
      localStorage.setItem('chatThreads_backup', chatThreadsData);
    }
    // Uncomment this line to create a backup of the legacy data if you are deleting it later in the migration
    // if (legacyDiyaData) {
    //   localStorage.setItem('DIYA_CONVERSATIONS_backup', legacyDiyaData);
    // }

    // Get existing thread IDs from database
    const existingThreadIds = new Set((await db.threads.toArray()).map((t) => t.id));

    // Filter and migrate only new threads
    if (chatThreadsData) {
      const threads: ChatThread[] = JSON.parse(chatThreadsData);
      const newThreads = threads.filter((t) => !existingThreadIds.has(t.id));
      if (newThreads.length > 0) {
        await migrateThreads(newThreads);
      }
    }

    // Filter and migrate only new legacy conversations
    if (legacyDiyaData) {
      const legacyConversations: LegacyConversation[] = JSON.parse(legacyDiyaData);
      const newLegacyConversations = legacyConversations.filter((c) => !existingThreadIds.has(c.id));
      if (newLegacyConversations.length > 0) {
        const convertedThreads = newLegacyConversations.map(convertLegacyToNewFormat);
        await migrateThreads(convertedThreads);
      }
    }

    // Verify migration only for newly migrated threads
    const migratedThreads = await db.threads.toArray();
    const migratedSummaries = await db.threadSummaries.toArray();
    const expectedThreadIds = new Set<string>();

    if (chatThreadsData) {
      const threads: ChatThread[] = JSON.parse(chatThreadsData);
      threads.filter((t) => !existingThreadIds.has(t.id)).forEach((thread) => expectedThreadIds.add(thread.id));
    }
    if (legacyDiyaData) {
      const legacyConversations: LegacyConversation[] = JSON.parse(legacyDiyaData);
      legacyConversations.filter((c) => !existingThreadIds.has(c.id)).forEach((conv) => expectedThreadIds.add(conv.id));
    }

    let allThreadsMigrated = true;
    expectedThreadIds.forEach((id) => {
      if (!migratedThreads.find((t) => t.id === id) || !migratedSummaries.find((s) => s.id === id)) {
        allThreadsMigrated = false;
      }
    });

    if (allThreadsMigrated && expectedThreadIds.size > 0) {
      // Only remove old data if verification passes and we actually migrated something
      localStorage.removeItem('chatThreads');
      // localStorage.removeItem('DIYA_CONVERSATIONS'); // Dont delete legacy data yet
      localStorage.setItem('migrationDone', 'true'); // Store migration complete flag
    } else if (!allThreadsMigrated) {
      throw new Error('Migration verification failed: Data mismatch');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    // Keep old data for retry
  }
}

async function migrateThreads(threads: ChatThread[]): Promise<void> {
  await Promise.all(
    threads.map(async (thread) => {
      await db.threads.put(thread);
      const summary: ThreadSummary = {
        id: thread.id,
        name: thread.name,
        lastUpdated: new Date(thread.branches[0]?.createdAt || Date.now()),
      };
      await db.threadSummaries.put(summary);
    }),
  );
}
