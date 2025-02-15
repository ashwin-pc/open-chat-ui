import { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db';
import { useLocalStorage } from 'usehooks-ts';
import { ChatThread, ThreadSummary, Branch, Message, BedrockModelNames, SystemPrompt } from '../lib/types';
import { runMigration } from '../lib/migration-utils';

// Move outside actions so it's available in hook scope
const createNewThread = (options: { isIncognitoThread?: boolean } = {}): ChatThread => ({
  id: uuidv4(),
  name: 'New Chat',
  branches: [
    {
      id: 1,
      name: 'Main',
      messages: [],
      attachments: [],
      createdAt: new Date(),
      description: 'Initial conversation branch',
    },
  ],
  currentBranchId: 1,
  ...options,
});

const DEFAULT_SYSTEM_PROMPT: SystemPrompt = {
  id: 'default',
  name: 'Default Prompt',
  text: 'You are a helpful assistant.',
};

export function useThreadStorage({ prompts }: { prompts?: SystemPrompt[] }) {
  const [threadSummaries, setThreadSummaries] = useState<ThreadSummary[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [defaultSystemPromptId, setDefaultSystemPromptId] = useLocalStorage<string>(
    'defaultSystemPromptId',
    DEFAULT_SYSTEM_PROMPT.id,
  );
  const [currentThreadId, setCurrentThreadId] = useState<string>('');
  const [currentThread, setCurrentThread] = useState<ChatThread>(() => createNewThread());
  const [currentBranch, setCurrentBranch] = useState<Branch>(() => currentThread.branches[0]);

  // Single initialization effect
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Wait for migration to complete first
        await runMigration();

        // Only then load threads
        const summaries = await db.threadSummaries.toArray();

        // Only proceed if component is still mounted
        if (!mounted) return;

        if (summaries.length === 0) {
          // Only create new thread if DB is actually empty
          const newThread = createNewThread();
          await actions.createThread(newThread);
        } else {
          setThreadSummaries(summaries);
          setCurrentThreadId(summaries[0].id);
        }
      } catch (error) {
        console.error('Failed to initialize thread storage:', error);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Separate effect for loading full thread
  useEffect(() => {
    if (!currentThreadId) return;

    let mounted = true;
    async function loadFullThread() {
      const fullThread = await db.threads.get(currentThreadId);
      if (mounted && fullThread) {
        setCurrentThread(fullThread);
      }
    }

    loadFullThread();

    return () => {
      mounted = false;
    };
  }, [currentThreadId]);

  useEffect(() => {
    const branch = currentThread.branches.find((b) => b.id === currentThread.currentBranchId);
    setCurrentBranch(branch || currentThread.branches[0]);
  }, [currentThread]);

  // Add system prompts loading
  useEffect(() => {
    async function loadSystemPrompts() {
      const promptsFromDB = await db.systemPrompts.toArray();
      if (promptsFromDB.length === 0) {
        if (prompts && prompts.length > 0) {
          for (const prompt of prompts) {
            await db.systemPrompts.put(prompt);
          }
          setSystemPrompts(prompts);
        } else {
          await db.systemPrompts.put(DEFAULT_SYSTEM_PROMPT);
          setSystemPrompts([DEFAULT_SYSTEM_PROMPT]);
        }
      } else {
        setSystemPrompts(promptsFromDB);
      }
    }
    loadSystemPrompts();
  }, []);

  const currentSystemPrompt = useMemo(() => {
    const systemPrompt = systemPrompts.find((p) => p.id === currentThread?.systemPromptId) || DEFAULT_SYSTEM_PROMPT;
    const formattedDate = new Date().toLocaleDateString(navigator.language || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    systemPrompt.text = systemPrompt.text.replace('{{currentDateTime}}', formattedDate);
    return systemPrompt;
  }, [systemPrompts, currentThread]);

  const actions = useMemo(
    () => ({
      createNewThread,
      // Thread operations
      createThread: async (options: { isIncognitoThread?: boolean } = {}): Promise<void> => {
        const thread = createNewThread(options);
        await db.threads.put(thread);
        const summary: ThreadSummary = {
          id: thread.id,
          name: thread.name,
          lastUpdated: new Date(thread.branches[0]?.createdAt || Date.now()),
        };
        await db.threadSummaries.put(summary);
        setThreadSummaries((prev) => [...prev, summary]);
        setCurrentThreadId(thread.id);
        setCurrentThread(thread);
      },

      updateThread: async (threadUpdate: Partial<ChatThread> & { id: string }): Promise<void> => {
        // Fetch the latest version to merge changes
        const latest = await db.threads.get(threadUpdate.id);
        if (!latest) return;

        // Merge updates with latest version
        const mergedThread: ChatThread = {
          ...latest,
          ...threadUpdate,
          // If branches or currentBranchId are provided, use them, otherwise keep existing
          branches: threadUpdate.branches || latest.branches,
          currentBranchId: threadUpdate.currentBranchId ?? latest.currentBranchId,
        };

        await db.threads.put(mergedThread);
        const summary: ThreadSummary = {
          id: mergedThread.id,
          name: mergedThread.name,
          lastUpdated: new Date(mergedThread.branches[0]?.createdAt || Date.now()),
        };
        await db.threadSummaries.put(summary);
        setThreadSummaries((prev) => prev.map((s) => (s.id === mergedThread.id ? summary : s)));
        if (mergedThread.id === currentThreadId) {
          setCurrentThread(mergedThread);
        }
      },

      deleteThread: async (id: string): Promise<void> => {
        await db.threads.delete(id);
        await db.threadSummaries.delete(id);
        setThreadSummaries((prev) => prev.filter((s) => s.id !== id));
        if (currentThreadId === id && threadSummaries.length > 1) {
          const newId = threadSummaries.find((s) => s.id !== id)?.id || '';
          setCurrentThreadId(newId);
        }
      },

      renameThread: async (id: string, newName: string): Promise<void> => {
        await actions.updateThread({
          id,
          name: newName,
        });
      },

      // Branch operations
      createBranch: async (id: string, messages: Message[], attachments: File[]): Promise<void> => {
        const thread = await db.threads.get(id);
        if (!thread) return;
        const newBranchId = Math.max(...thread.branches.map((b) => b.id)) + 1;
        const newBranch: Branch = {
          id: newBranchId,
          name: `Branch ${newBranchId}`,
          messages,
          attachments,
          createdAt: new Date(),
          description: `Branched from message: "${messages[messages.length - 1]?.text.slice(0, 50)}..."`,
        };
        await actions.updateThread({
          id,
          branches: [...thread.branches, newBranch],
          currentBranchId: newBranchId,
        });
      },

      updateBranch: async (threadId: string, branchId: number, updates: Partial<Branch>): Promise<void> => {
        const thread = await db.threads.get(threadId);
        if (!thread) return;
        const updatedBranches = thread.branches.map((branch) =>
          branch.id === branchId ? { ...branch, ...updates } : branch,
        );
        await actions.updateThread({
          id: threadId,
          branches: updatedBranches,
        });
      },

      switchBranch: async (threadId: string, branchId: number): Promise<void> => {
        await actions.updateThread({
          id: threadId,
          currentBranchId: branchId,
        });
      },

      addAttachments: async (threadId: string, branchId: number, files: File[]): Promise<void> => {
        const thread = await db.threads.get(threadId);
        if (!thread) return;
        const updatedBranches = thread.branches.map((branch) =>
          branch.id === branchId ? { ...branch, attachments: [...branch.attachments, ...files] } : branch,
        );
        await actions.updateThread({
          id: threadId,
          branches: updatedBranches,
        });
      },

      removeAttachment: async (threadId: string, branchId: number, fileName: string): Promise<void> => {
        const thread = await db.threads.get(threadId);
        if (!thread) return;
        const updatedBranches = thread.branches.map((branch) =>
          branch.id === branchId
            ? { ...branch, attachments: branch.attachments.filter((file) => file.name !== fileName) }
            : branch,
        );
        await actions.updateThread({
          id: threadId,
          branches: updatedBranches,
        });
      },

      updateBranchModel: async (threadId: string, branchId: number, model: BedrockModelNames): Promise<void> => {
        const thread = await db.threads.get(threadId);
        if (!thread) return;
        const updatedBranches = thread.branches.map((branch) =>
          branch.id === branchId ? { ...branch, model } : branch,
        );
        await actions.updateThread({
          id: threadId,
          branches: updatedBranches,
        });
      },

      deleteEntireChatHistory: async (options: { isIncognitoThread?: boolean } = {}): Promise<void> => {
        // Delete all threads from DB
        await db.threads.clear();
        await db.threadSummaries.clear();

        // Add new thread using existing createThread action
        await actions.createThread(options);
      },

      switchThread: async (threadId: string): Promise<void> => {
        setCurrentThreadId(threadId);
      },

      // System prompt operations
      addSystemPrompt: async (prompt: SystemPrompt): Promise<void> => {
        await db.systemPrompts.put(prompt);
        setSystemPrompts((prev) => [...prev, prompt]);
      },

      updateSystemPrompt: async (promptId: string, updates: Partial<SystemPrompt>): Promise<void> => {
        const prompt = await db.systemPrompts.get(promptId);
        if (!prompt) return;
        const updatedPrompt = { ...prompt, ...updates };
        await db.systemPrompts.put(updatedPrompt);
        setSystemPrompts((prev) => prev.map((p) => (p.id === promptId ? updatedPrompt : p)));
      },

      deleteSystemPrompt: async (promptId: string): Promise<void> => {
        if (promptId === DEFAULT_SYSTEM_PROMPT.id) return; // Prevent deleting default prompt
        await db.systemPrompts.delete(promptId);
        setSystemPrompts((prev) => prev.filter((p) => p.id !== promptId));
      },

      setDefaultSystemPrompt: (promptId: string): void => {
        setDefaultSystemPromptId(promptId);
      },

      selectSystemPrompt: async (promptId: string): Promise<void> => {
        if (currentThread) {
          await actions.updateThread({
            ...currentThread,
            systemPromptId: promptId,
          });
        }
      },
    }),
    [currentThread, currentThreadId, threadSummaries, setDefaultSystemPromptId],
  );

  return {
    threadSummaries,
    currentThreadId,
    currentThread,
    currentBranch,
    systemPrompts,
    defaultSystemPromptId,
    currentSystemPrompt,
    actions,
  };
}

export type UseThreadData = ReturnType<typeof useThreadStorage>;
