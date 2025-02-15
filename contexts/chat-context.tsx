// contexts/ChatContext.tsx
import { createContext, useContext, useMemo, ReactNode, useState } from 'react';
import { SystemPrompt, CreativityLevel } from '../lib/types';
import { useHotkeys } from '../hooks/use-hotkeys';
import { useLocalStorage } from 'usehooks-ts';
import { UseThreadData, useThreadStorage } from '../hooks/use-thread-storage';

export interface ChatContextType extends Omit<UseThreadData, 'actions | setCurrentThreadId'> {
  // UI specific state and actions
  systemPrompts: SystemPrompt[];
  defaultSystemPromptId: string;
  currentSystemPrompt: SystemPrompt;
  settings: {
    cmdToSend: boolean;
    isIncognitoMode: boolean;
  };
  creativityLevel: CreativityLevel;
  // UI specific actions
  actions: UseThreadData['actions'] & {
    addSystemPrompt: (prompt: SystemPrompt) => void;
    updateSystemPrompt: (promptId: string, updates: Partial<SystemPrompt>) => void;
    deleteSystemPrompt: (promptId: string) => void;
    setDefaultSystemPrompt: (promptId: string) => void;
    selectSystemPrompt: (promptId: string) => void;
    updateSettings: (newSettings: Partial<{ cmdToSend: boolean; isIncognitoMode: boolean }>) => void;
  };
  setCreativityLevel: (level: CreativityLevel) => void;
}

const DEFAULT_SYSTEM_PROMPT: SystemPrompt = {
  id: 'default',
  name: 'Default Prompt',
  text: 'You are a helpful assistant. The current date is {{currentDateTime}}',
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, prompts }: { children: ReactNode; prompts?: SystemPrompt[] }) {
  const { threadSummaries, currentThreadId, currentThread, currentBranch, actions: threadActions } = useThreadStorage();

  // UI specific state
  const [settings, setSettings] = useLocalStorage<{ cmdToSend: boolean; isIncognitoMode: boolean }>('settings', {
    cmdToSend: false,
    isIncognitoMode: false,
  });

  const [systemPrompts, setSystemPrompts] = useLocalStorage<SystemPrompt[]>(
    'systemPrompts',
    prompts ?? [DEFAULT_SYSTEM_PROMPT],
  );

  const [defaultSystemPromptId, setDefaultSystemPromptId] = useLocalStorage<string>(
    'defaultSystemPromptId',
    systemPrompts[0].id,
  );

  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>(CreativityLevel.PRECISE);

  useHotkeys('new-thread', {
    key: 'ctrl+n',
    description: 'Create new thread',
    scope: 'Global',
    callback: () => {
      threadActions.createThread({ isIncognitoThread: settings.isIncognitoMode });
    },
  });

  useHotkeys('next-thread', {
    key: 'cmd+]',
    description: 'Next thread',
    scope: 'Global',
    callback: () => {
      const currentIndex = threadSummaries.findIndex((t) => t.id === currentThreadId);
      const nextIndex = (currentIndex + 1) % threadSummaries.length;
      actions.switchThread(threadSummaries[nextIndex].id);
    },
  });

  useHotkeys('previous-thread', {
    key: 'cmd+[',
    description: 'Previous thread',
    scope: 'Global',
    callback: () => {
      const currentIndex = threadSummaries.findIndex((t) => t.id === currentThreadId);
      const prevIndex = (currentIndex - 1 + threadSummaries.length) % threadSummaries.length;
      actions.switchThread(threadSummaries[prevIndex].id);
    },
  });

  const currentSystemPrompt = useMemo(() => {
    return systemPrompts.find((p) => p.id === currentThread?.systemPromptId) || DEFAULT_SYSTEM_PROMPT;
  }, [systemPrompts, currentThread]);

  const currentThread = chatThreads.find((t) => t.id === currentThreadId) || chatThreads[0];
  const currentBranch =
    currentThread.branches.find((b) => b.id === currentThread.currentBranchId) || currentThread.branches[0];

  const formattedDate = new Date().toLocaleDateString(navigator.language || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
  const currentSystemPrompt = (systemPrompts.find((p) => p.id === currentThread.systemPromptId) || DEFAULT_SYSTEM_PROMPT);
  currentSystemPrompt.text = currentSystemPrompt.text.replace("{{currentDateTime}}", formattedDate);

  const actions = useMemo(
    () => ({
      // Thread/branch actions from storage
      ...threadActions,

      // System prompt actions
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
      setDefaultSystemPrompt: setDefaultSystemPromptId,
      selectSystemPrompt: (promptId: string) => {
        if (currentThread) {
          threadActions.updateThread({
            ...currentThread,
            systemPromptId: promptId,
          });
        }
      },

      // Settings actions
      updateSettings: (newSettings: Partial<{ cmdToSend: boolean; isIncognitoMode: boolean }>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
      },
    }),
    [threadActions, setDefaultSystemPromptId, setSystemPrompts, currentThread, setSettings],
  );

  return (
    <ChatContext.Provider
      value={{
        threadSummaries,
        currentThreadId,
        currentThread,
        currentBranch,
        systemPrompts,
        defaultSystemPromptId,
        currentSystemPrompt,
        actions,
        settings,
        creativityLevel,
        setCreativityLevel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChatContext must be used within ChatProvider');
  return context;
};
