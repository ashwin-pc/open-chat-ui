import { useEffect, useState, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db';
import { useLocalStorage } from 'usehooks-ts';
import { ChatThread, ThreadSummary, Branch, Message, BedrockModelNames, SystemPrompt } from '../lib/types';
import { runMigration } from '../lib/migration-utils';
import { useLiveQuery } from 'dexie-react-hooks';

// Move outside actions so it's available in hook scope
const initializeEmptyThread = (): ChatThread => ({
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
});

const DEFAULT_SYSTEM_PROMPT: SystemPrompt = {
  id: 'default',
  name: 'Default Prompt',
  text: 'You are a helpful assistant.',
};

export function useThreadStorage({
  prompts,
  isIncognito = false,
}: {
  prompts?: SystemPrompt[];
  isIncognito?: boolean;
}) {
  const [defaultSystemPromptId, setDefaultSystemPromptId] = useLocalStorage<string>(
    'defaultSystemPromptId',
    DEFAULT_SYSTEM_PROMPT.id,
  );

  const [currentThreadId, setCurrentThreadId] = useState<string>('');
  const isCreatingThreadRef = useRef(false);

  const threadSummaries = useLiveQuery(() => db.threadSummaries.toArray(), [], [] as ThreadSummary[]);

  // Modify the currentThread hook to avoid returning an unsaved empty thread
  const currentThread = useLiveQuery(
    async () => {
      if (!currentThreadId) return undefined;
      const thread = await db.threads.get(currentThreadId);
      return thread;
    },
    [currentThreadId],
    undefined,
  );

  const systemPrompts = useLiveQuery(() => db.systemPrompts.toArray(), [], [] as SystemPrompt[]);

  const currentBranch = useMemo(() => {
    if (!currentThread) return initializeEmptyThread().branches[0];
    const branch = currentThread.branches.find((b) => b.id === currentThread.currentBranchId);
    return branch || currentThread.branches[0];
  }, [currentThread]);

  const currentSystemPrompt = useMemo(() => {
    const systemPrompt =
      systemPrompts.find((p) => p.id === currentThread?.systemPromptId) ||
      systemPrompts.find((p) => p.id === defaultSystemPromptId) ||
      DEFAULT_SYSTEM_PROMPT;
    const formattedDate = new Date().toLocaleDateString(navigator.language || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    return {
      ...systemPrompt,
      text: systemPrompt.text.replace('{{currentDateTime}}', formattedDate),
    };
  }, [systemPrompts, currentThread?.systemPromptId, defaultSystemPromptId]);

  const actions = useMemo(
    () => ({
      // Thread operations
      createThread: async (): Promise<void> => {
        if (isCreatingThreadRef.current) {
          return; // Skip if already creating
        }

        try {
          isCreatingThreadRef.current = true;
          let summaries = await db.threadSummaries.toArray();
          for (const s of summaries.filter((s) => s.name === 'New Chat' && s.isIncognitoThread !== isIncognito)) {
            await db.threads.delete(s.id);
            await db.threadSummaries.delete(s.id);
          }
          summaries = await db.threadSummaries.toArray();
          const existingEmptyThreadSummary = summaries.find(
            (s) => s.name === 'New Chat' && s.isIncognitoThread === isIncognito,
          );

          if (existingEmptyThreadSummary) {
            const existingThread = await db.threads.get(existingEmptyThreadSummary.id);
            if (
              existingThread &&
              existingThread.branches[0].messages.length === 0 &&
              existingThread.branches[0].attachments.length === 0
            ) {
              setCurrentThreadId(existingThread.id);
              return;
            }
          }
          const thread = initializeEmptyThread();
          await db.threads.put(thread);
          const summary: ThreadSummary = {
            id: thread.id,
            name: thread.name,
            lastUpdated: new Date(), // updated to current time
            isIncognitoThread: isIncognito,
          };
          await db.threadSummaries.put(summary);
          setCurrentThreadId(thread.id);
        } finally {
          isCreatingThreadRef.current = false;
        }
      },

      updateThread: async (threadUpdate: Partial<ChatThread> & { id: string }): Promise<void> => {
        const latest = await db.threads.get(threadUpdate.id);
        if (!latest) return;

        const currentSummary = await db.threadSummaries.get(threadUpdate.id);

        const mergedThread: ChatThread = {
          ...latest,
          ...threadUpdate,
          branches: threadUpdate.branches || latest.branches,
          currentBranchId: threadUpdate.currentBranchId ?? latest.currentBranchId,
        };

        await db.threads.put(mergedThread);
        const summary: ThreadSummary = {
          id: mergedThread.id,
          name: mergedThread.name,
          lastUpdated: new Date(), // updated to current time
          isIncognitoThread: currentSummary?.isIncognitoThread,
        };
        await db.threadSummaries.put(summary);

        // Update currentThreadId if the merged thread id differs from current state
        if (mergedThread.id !== threadUpdate.id) {
          setCurrentThreadId(mergedThread.id);
        }
      },

      deleteThread: async (id: string): Promise<void> => {
        await db.threads.delete(id);
        await db.threadSummaries.delete(id);
        const threadLength = await db.threadSummaries.count();
        if (currentThreadId === id && threadLength > 1) {
          const newId = threadSummaries.find((s) => s.id !== id)?.id || '';
          setCurrentThreadId(newId);
        } else if (threadLength === 0) {
          await actions.createThread();
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

      deleteEntireChatHistory: async (): Promise<void> => {
        await db.threads.clear();
        await db.threadSummaries.clear();
        await actions.createThread();
      },

      switchThread: async (threadId: string): Promise<void> => {
        setCurrentThreadId(threadId);
      },

      // System prompt operations
      addSystemPrompt: async (prompt: SystemPrompt): Promise<void> => {
        await db.systemPrompts.put(prompt);
      },

      updateSystemPrompt: async (promptId: string, updates: Partial<SystemPrompt>): Promise<void> => {
        const prompt = await db.systemPrompts.get(promptId);
        if (!prompt) return;
        const updatedPrompt = { ...prompt, ...updates };
        await db.systemPrompts.put(updatedPrompt);
      },

      deleteSystemPrompt: async (promptId: string): Promise<void> => {
        if (promptId === DEFAULT_SYSTEM_PROMPT.id) return;
        await db.systemPrompts.delete(promptId);
      },

      setDefaultSystemPrompt: (promptId: string): void => {
        setDefaultSystemPromptId(promptId);
      },

      selectSystemPrompt: async (promptId: string): Promise<void> => {
        if (currentThread) {
          await actions.updateThread({
            id: currentThread.id,
            systemPromptId: promptId,
          });
        }
      },
    }),
    [currentThread, currentThreadId, threadSummaries, setDefaultSystemPromptId, isIncognito],
  );

  // Single initialization effect
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await runMigration();

        const promptsFromDB = await db.systemPrompts.toArray();
        if (promptsFromDB.length === 0) {
          if (prompts && prompts.length > 0) {
            await Promise.all(prompts.map((prompt) => db.systemPrompts.put(prompt)));
          } else {
            await db.systemPrompts.put(DEFAULT_SYSTEM_PROMPT);
          }
        }

        if (!mounted) return;

        if ((await db.threadSummaries.count()) === 0) {
          await actions.createThread();
        }
      } catch (error) {
        console.error('Failed to initialize thread storage:', error);
      }
    }

    initialize();

    return () => {
      mounted = false;
      // Cleanup lock on unmount
      isCreatingThreadRef.current = false;
    };
    // Only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new effect to select an existing thread if currentThreadId is empty
  useEffect(() => {
    if (!currentThreadId && threadSummaries && threadSummaries.length > 0) {
      setCurrentThreadId(threadSummaries[0].id);
    }
  }, [currentThreadId, threadSummaries]);

  return {
    threadSummaries: threadSummaries || [],
    currentThreadId: currentThread?.id || '',
    // Provide a fallback for UI if currentThread is undefined
    currentThread: currentThread || initializeEmptyThread(),
    currentBranch,
    systemPrompts: systemPrompts || [],
    defaultSystemPromptId,
    currentSystemPrompt,
    actions,
  };
}

export type UseThreadData = ReturnType<typeof useThreadStorage>;
