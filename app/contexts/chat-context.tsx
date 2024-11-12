// contexts/ChatContext.tsx
import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Message, ChatThread, Branch } from '../../lib/types';
import { useHotkeys } from '../hooks/use-hotkeys';

interface ChatContextType {
  chatThreads: ChatThread[];
  currentThreadId: number;
  currentThread: ChatThread;
  currentBranch: Branch;
  actions: {
    createThread: () => void;
    deleteThread: (threadId: number) => void;
    updateThread: (threadId: number, updates: Partial<ChatThread>) => void;
    createBranch: (threadId: number, messages: Message[], attachments: File[]) => void;
    updateBranch: (threadId: number, branchId: number, updates: Partial<Branch>) => void;
    switchBranch: (threadId: number, branchId: number) => void;
    switchThread: (threadId: number) => void;
    addAttachments: (threadId: number, branchId: number, files: File[]) => void;
    removeAttachment: (threadId: number, branchId: number, fileName: string) => void;
  };
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([
    {
      id: 1,
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
    },
  ]);
  const [currentThreadId, setCurrentThreadId] = useState(1);

  useHotkeys('new-thread', {
    key: '/',
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
          const newThread = {
            id: Date.now(),
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
          setChatThreads((prev) => [...prev, newThread]);
          setCurrentThreadId(newThread.id);
        }
      },

      deleteThread: (threadId: number) => {
        if (chatThreads.length > 1) {
          const newThreads = chatThreads.filter((t) => t.id !== threadId);
          setChatThreads(newThreads);
          if (currentThreadId === threadId) {
            setCurrentThreadId(newThreads[0].id);
          }
        }
      },

      updateThread: (threadId: number, updates: Partial<ChatThread>) => {
        setChatThreads((threads) =>
          threads.map((thread) => (thread.id === threadId ? { ...thread, ...updates } : thread)),
        );
      },

      createBranch: (threadId: number, messages: Message[], attachments: File[]) => {
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

      updateBranch: (threadId: number, branchId: number, updates: Partial<Branch>) => {
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

      switchBranch: (threadId: number, branchId: number) => {
        setChatThreads((threads) =>
          threads.map((thread) => (thread.id === threadId ? { ...thread, currentBranchId: branchId } : thread)),
        );
      },

      switchThread: (threadId: number) => {
        setCurrentThreadId(threadId);
      },

      addAttachments: (threadId: number, branchId: number, files: File[]) => {
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

      removeAttachment: (threadId: number, branchId: number, fileName: string) => {
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
        actions,
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
