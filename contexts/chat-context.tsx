// contexts/ChatContext.tsx
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatThread, Branch, BedrockModelNames, SystemPrompt } from '../lib/types';
import { useHotkeys } from '../hooks/use-hotkeys';
import { useLocalStorage } from 'usehooks-ts';

export interface ChatContextType {
  chatThreads: ChatThread[];
  currentThreadId: string;
  currentThread: ChatThread;
  currentBranch: Branch;
  systemPrompts: SystemPrompt[];
  defaultSystemPromptId: string;
  currentSystemPrompt: SystemPrompt;
  actions: {
    createThread: () => void;
    deleteThread: (threadId: string) => void;
    updateThread: (threadId: string, updates: Partial<ChatThread>) => void;
    createBranch: (threadId: string, messages: Message[], attachments: File[]) => void;
    updateBranch: (threadId: string, branchId: number, updates: Partial<Branch>) => void;
    switchBranch: (threadId: string, branchId: number) => void;
    switchThread: (threadId: string) => void;
    addAttachments: (threadId: string, branchId: number, files: File[]) => void;
    removeAttachment: (threadId: string, branchId: number, fileName: string) => void;
    updateBranchModel: (threadId: string, branchId: number, model: BedrockModelNames) => void;
    addSystemPrompt: (prompt: SystemPrompt) => void;
    updateSystemPrompt: (promptId: string, updates: Partial<SystemPrompt>) => void;
    deleteSystemPrompt: (promptId: string) => void;
    setDefaultSystemPrompt: (promptId: string) => void;
    selectSystemPrompt: (promptId: string) => void;
  };
  settings: {
      useCmdEnterToSend: boolean;
  };
  updateSettings: (newSettings: Partial<{ useCmdEnterToSend: boolean }>) => void;
}

const DEFAULT_SYSTEM_PROMPT: SystemPrompt = {
  id: 'default',
  name: 'Default Prompt',
  text: 'You are a helpful assistant.',
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, prompts }: { children: ReactNode; prompts?: SystemPrompt[] }) {
  const initialThread = {
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
  };

  const [chatThreads, setChatThreads] = useLocalStorage<ChatThread[]>('chatThreads', [initialThread], {
    initializeWithValue: false,
  });
  const [currentThreadId, setCurrentThreadId] = useLocalStorage<string>('currentThreadId', initialThread.id, {
    initializeWithValue: false,
  });

  const [systemPrompts, setSystemPrompts] = useLocalStorage<SystemPrompt[]>(
    'systemPrompts',
    prompts ?? [DEFAULT_SYSTEM_PROMPT],
  );

  const [defaultSystemPromptId, setDefaultSystemPromptId] = useLocalStorage<string>(
    'defaultSystemPromptId',
    systemPrompts[0].id,
  );

  const [settings, setSettings] = useLocalStorage<{ useCmdEnterToSend: boolean }>('settings', {
      useCmdEnterToSend: false,
  });

  useHotkeys('new-thread', {
    key: 'ctrl+n',
    description: 'Create new thread',
    scope: 'Global',
    callback: () => {
      actions.createThread();
    },
  });

  useHotkeys('next-thread', {
    key: 'cmd+]',
    description: 'Next thread',
    scope: 'Global',
    callback: () => {
      const currentIndex = chatThreads.findIndex((t) => t.id === currentThreadId);
      const nextIndex = (currentIndex + 1) % chatThreads.length;
      setCurrentThreadId(chatThreads[nextIndex].id);
    },
  });

  useHotkeys('previous-thread', {
    key: 'cmd+[',
    description: 'Previous thread',
    scope: 'Global',
    callback: () => {
      const currentIndex = chatThreads.findIndex((t) => t.id === currentThreadId);
      const prevIndex = (currentIndex - 1 + chatThreads.length) % chatThreads.length;
      setCurrentThreadId(chatThreads[prevIndex].id);
    },
  });

  const currentThread = chatThreads.find((t) => t.id === currentThreadId) || chatThreads[0];
  const currentBranch =
    currentThread.branches.find((b) => b.id === currentThread.currentBranchId) || currentThread.branches[0];
  const currentSystemPrompt = systemPrompts.find((p) => p.id === currentThread.systemPromptId) || DEFAULT_SYSTEM_PROMPT;

  const actions = useMemo(
    () => ({
      // Update the createThread action in chat-context.tsx
      createThread: () => {
        // Find first empty thread (thread with no messages in its first branch)
        const emptyThread = chatThreads.find((thread) => thread.branches[0]?.messages.length === 0);

        if (emptyThread) {
          // Switch to existing empty thread
          setCurrentThreadId(emptyThread.id);
        } else {
          // Create new thread only if no empty thread exists
          const newThread: ChatThread = {
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
            systemPromptId: defaultSystemPromptId,
          };
          setChatThreads((prev) => [...prev, newThread]);
          setCurrentThreadId(newThread.id);
        }
      },

      deleteThread: (threadId: string) => {
        if (chatThreads.length > 1) {
          const newThreads = chatThreads.filter((t) => t.id !== threadId);
          setChatThreads(newThreads);
          if (currentThreadId === threadId) {
            setCurrentThreadId(newThreads[0].id);
          }
        }
      },

      updateThread: (threadId: string, updates: Partial<ChatThread>) => {
        setChatThreads((threads) =>
          threads.map((thread) => (thread.id === threadId ? { ...thread, ...updates } : thread)),
        );
      },

      createBranch: (threadId: string, messages: Message[], attachments: File[]) => {
        const thread = chatThreads.find((t) => t.id === threadId);
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

        setChatThreads((threads) =>
          threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  branches: [...t.branches, newBranch],
                  currentBranchId: newBranchId,
                }
              : t,
          ),
        );
      },

      updateBranch: (threadId: string, branchId: number, updates: Partial<Branch>) => {
        setChatThreads((threads) =>
          threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  branches: thread.branches.map((branch) =>
                    branch.id === branchId ? { ...branch, ...updates } : branch,
                  ),
                }
              : thread,
          ),
        );
      },

      switchBranch: (threadId: string, branchId: number) => {
        setChatThreads((threads) =>
          threads.map((thread) => (thread.id === threadId ? { ...thread, currentBranchId: branchId } : thread)),
        );
      },

      switchThread: (threadId: string) => {
        setCurrentThreadId(threadId);
      },

      addAttachments: (threadId: string, branchId: number, files: File[]) => {
        setChatThreads((threads) =>
          threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  branches: thread.branches.map((branch) =>
                    branch.id === branchId ? { ...branch, attachments: [...branch.attachments, ...files] } : branch,
                  ),
                }
              : thread,
          ),
        );
      },

      removeAttachment: (threadId: string, branchId: number, fileName: string) => {
        setChatThreads((threads) =>
          threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  branches: thread.branches.map((branch) =>
                    branch.id === branchId
                      ? {
                          ...branch,
                          attachments: branch.attachments.filter((file) => file.name !== fileName),
                        }
                      : branch,
                  ),
                }
              : thread,
          ),
        );
      },

      updateBranchModel: (threadId: string, branchId: number, model: BedrockModelNames) => {
        setChatThreads((threads) =>
          threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  branches: thread.branches.map((branch) => (branch.id === branchId ? { ...branch, model } : branch)),
                }
              : thread,
          ),
        );
      },

      addSystemPrompt: (prompt: SystemPrompt) => {
        setSystemPrompts((prompts) => [...prompts, prompt]);
      },
      updateSystemPrompt: (promptId: string, updates: Partial<SystemPrompt>) => {
        setSystemPrompts((prompts) =>
          prompts.map((prompt) => (prompt.id === promptId ? { ...prompt, ...updates } : prompt)),
        );
      },
      deleteSystemPrompt: (promptId: string) => {
        setSystemPrompts((prompts) => prompts.filter((prompt) => prompt.id !== promptId));
      },
      setDefaultSystemPrompt: (promptId: string) => {
        setDefaultSystemPromptId(promptId);
      },
      selectSystemPrompt: (promptId: string) => {
        setChatThreads((threads) =>
          threads.map((thread) =>
            thread.id === currentThreadId
              ? {
                  ...thread,
                  systemPromptId: promptId,
                }
              : thread,
          ),
        );
      },
      updateSettings: (newSettings: Partial<{ useCmdEnterToSend: boolean }>) => {
          setSettings(prev => ({
              ...prev,
              ...newSettings,
          }));
      },
    }),
    [chatThreads, currentThreadId],
  );

  return (
    <ChatContext.Provider
      value={{
        chatThreads,
        currentThreadId,
        currentThread,
        currentBranch,
        systemPrompts,
        defaultSystemPromptId,
        currentSystemPrompt,
        actions,
        settings, // Add settings to the context value
        updateSettings: actions.updateSettings, // Add updateSettings to the context value
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
