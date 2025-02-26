import React from 'react';
import { Trash2, EyeOff, Download, Upload, Repeat } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useChatContext } from '@/contexts/chat-context';
import { runMigration } from '@/lib/migration-utils';
import { db } from '@/lib/db';
import { ChatThread, SystemPrompt, ThreadSummary } from '@/lib/types';

export function ChatManagement() {
  const { settings, actions } = useChatContext();

  const handleExportChats = async () => {
    try {
      // Export IndexedDB data
      const threads = await db.threads.toArray();
      const threadSummaries = await db.threadSummaries.toArray();
      const systemPrompts = await db.systemPrompts.toArray();

      // Get legacy data from localStorage for migration purposes
      const legacyData = {
        chatThreads: localStorage.getItem('chatThreads'),
        DIYA_CONVERSATIONS: localStorage.getItem('DIYA_CONVERSATIONS'),
        chatThreads_backup: localStorage.getItem('chatThreads_backup'),
        DIYA_CONVERSATIONS_backup: localStorage.getItem('DIYA_CONVERSATIONS_backup'),
      };

      const exportData = {
        version: 1,
        indexedDB: {
          threads,
          threadSummaries,
          systemPrompts,
        },
        legacyData,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chats:', error);
      alert('Failed to export chats. Please try again.');
    }
  };

  const handleImportChats = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);

        // Version check and data validation
        if (!content.version || !content.indexedDB) {
          throw new Error('Invalid backup file format');
        }

        // Merge imported data with existing data
        if (content.indexedDB.threads) {
          await Promise.all(
            content.indexedDB.threads.map(async (thread: ChatThread) => {
              const existing = await db.threads.get(thread.id);
              if (!existing) {
                await db.threads.put(thread);
              }
            }),
          );
        }

        if (content.indexedDB.threadSummaries) {
          await Promise.all(
            content.indexedDB.threadSummaries.map(async (summary: ThreadSummary) => {
              const existing = await db.threadSummaries.get(summary.id);
              if (!existing) {
                // Ensure lastUpdated is a Date object
                summary.lastUpdated = new Date(summary.lastUpdated);
                await db.threadSummaries.put(summary);
              }
            }),
          );
        }

        if (content.indexedDB.systemPrompts) {
          await Promise.all(
            content.indexedDB.systemPrompts.map(async (prompt: SystemPrompt) => {
              const existing = await db.systemPrompts.get(prompt.id);
              if (!existing) {
                await db.systemPrompts.put(prompt);
              }
            }),
          );
        }

        // Handle legacy data if present
        if (content.legacyData) {
          const { chatThreads, DIYA_CONVERSATIONS, chatThreads_backup, DIYA_CONVERSATIONS_backup } = content.legacyData;

          if (chatThreads) localStorage.setItem('chatThreads', chatThreads);
          if (DIYA_CONVERSATIONS) localStorage.setItem('DIYA_CONVERSATIONS', DIYA_CONVERSATIONS);
          if (chatThreads_backup) localStorage.setItem('chatThreads_backup', chatThreads_backup);
          if (DIYA_CONVERSATIONS_backup) localStorage.setItem('DIYA_CONVERSATIONS_backup', DIYA_CONVERSATIONS_backup);

          // Reset migration flag and run migration for legacy data
          localStorage.removeItem('migrationDone');
          await runMigration();
        }

        // Refresh the page to load the new data
        window.location.reload();
      } catch (error) {
        console.error('Failed to import chats:', error);
        alert('Failed to import chats. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleRemigrate = async () => {
    try {
      localStorage.removeItem('migrationDone');
      await runMigration();
      window.location.reload();
    } catch (error) {
      console.error('Failed to remigrate:', error);
      alert('Failed to remigrate chats. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Chat Management</h2>
      {settings.isIncognitoMode && (
        <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md flex items-center gap-2 text-sm">
          <EyeOff className="w-4 h-4" />
          <span>You are in incognito mode. Chat history will be deleted when you leave.</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-incognito" className="flex flex-col space-y-1">
            <span>Enable Incognito Mode</span>
            <span className="text-sm text-muted-foreground">
              When enabled, a new incognito chat will be created that won&apos;t be saved to history
            </span>
          </Label>
          <Switch
            id="enable-incognito"
            checked={settings.isIncognitoMode}
            onCheckedChange={(checked: boolean) => {
              actions.updateSettings({ isIncognitoMode: checked });
            }}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Backup & Restore</h3>

        <div className="flex items-center justify-between">
          <Label className="flex flex-col space-y-1">
            <span>Export Chat History</span>
            <span className="text-sm text-muted-foreground">Download all your chat history as a backup file</span>
          </Label>
          <Button onClick={handleExportChats}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Label className="flex flex-col space-y-1">
            <span>Import Chat History</span>
            <span className="text-sm text-muted-foreground">Restore chat history from a backup file</span>
          </Label>
          <Button onClick={() => document.getElementById('import-chats')?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import
            <input id="import-chats" type="file" accept=".json" onChange={handleImportChats} className="hidden" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Label className="flex flex-col space-y-1">
            <span>Re-run Migration</span>
            <span className="text-sm text-muted-foreground">
              Try this if your chat history isn&apos;t showing up correctly
            </span>
          </Label>
          <Button onClick={handleRemigrate}>
            <Repeat className="mr-2 h-4 w-4" /> Remigrate
          </Button>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Label className="flex flex-col space-y-1">
            <span>Delete entire history</span>
            <span className="text-sm text-muted-foreground">This action cannot be undone.</span>
          </Label>
          <Button variant="destructive" onClick={() => actions.deleteEntireChatHistory()}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete All
          </Button>
        </div>
      </div>
    </div>
  );
}
