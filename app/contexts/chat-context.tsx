// contexts/ChatContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Message, ChatThread, Branch } from '../../lib/types';

interface ChatContextType {
  chatThreads: ChatThread[];
  currentThreadId: number;
  currentThread: ChatThread;
  currentBranch: Branch;
  updateBranch: (threadId: number, branchId: number, messages: Message[]) => void;
  setCurrentThreadId: React.Dispatch<React.SetStateAction<number>>;
  setChatThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
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

  const currentThread = chatThreads.find((t) => t.id === currentThreadId) || chatThreads[0];
  const currentBranch =
    currentThread.branches.find((b) => b.id === currentThread.currentBranchId) || currentThread.branches[0];

  const updateBranch = (threadId: number, branchId: number, messages: Message[]) => {
    setChatThreads((threads) =>
      threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              branches: thread.branches.map((branch) => (branch.id === branchId ? { ...branch, messages } : branch)),
            }
          : thread,
      ),
    );
  };

  return (
    <ChatContext.Provider
      value={{
        chatThreads,
        currentThreadId,
        currentThread,
        currentBranch,
        updateBranch,
        setCurrentThreadId,
        setChatThreads,
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
