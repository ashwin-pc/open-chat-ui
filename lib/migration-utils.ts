import { db } from './db';
import { ChatThread, ThreadSummary } from '../lib/types';
import { exportChatBackup } from './chat-backup-utils';

export async function runMigration(): Promise<void> {
  try {
    // Check if we already have data in IndexedDB
    const existingThreads = await db.threads.count();
    if (existingThreads > 0) {
      return; // Nothing to migrate if we already have data
    }

    // Check for old data to migrate
    const storedData = localStorage.getItem('chatThreads');
    if (!storedData) {
      return; // No old data to migrate
    }

    // Create backup before migration
    const backupData = exportChatBackup();
    localStorage.setItem('chatThreads_backup', backupData);

    // Parse and migrate data
    const threads: ChatThread[] = JSON.parse(storedData);

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

    // Verify migration
    const migratedThreads = await db.threads.toArray();
    const migratedSummaries = await db.threadSummaries.toArray();

    // Check if all threads were migrated
    let allThreadsMigrated = true;
    threads.forEach((thread) => {
      if (!migratedThreads.find((t) => t.id === thread.id) || !migratedSummaries.find((s) => s.id === thread.id)) {
        allThreadsMigrated = false;
      }
    });

    if (allThreadsMigrated) {
      // Only remove old data if verification passes
      localStorage.removeItem('chatThreads');
    } else {
      throw new Error('Migration verification failed: Data mismatch');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    // Keep old data for retry
  }
}
// ...existing code...
