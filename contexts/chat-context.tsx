// contexts/ChatContext.tsx
import { createContext, useContext, useMemo, ReactNode, useState } from 'react';
import { SystemPrompt, CreativityLevel } from '../lib/types';
import { useHotkeys } from '../hooks/use-hotkeys';
import { useLocalStorage } from 'usehooks-ts';
import { UseThreadData, useThreadStorage } from '../hooks/use-thread-storage';

export interface ChatContextType extends Omit<UseThreadData, 'actions'> {
  settings: {
    cmdToSend: boolean;
    isIncognitoMode: boolean;
  };
  creativityLevel: CreativityLevel;
  actions: UseThreadData['actions'] & {
    updateSettings: (newSettings: Partial<{ cmdToSend: boolean; isIncognitoMode: boolean }>) => void;
  };
  setCreativityLevel: (level: CreativityLevel) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, prompts }: { children: ReactNode; prompts?: SystemPrompt[] }) {
  const {
    threadSummaries,
    currentThreadId,
    currentThread,
    currentBranch,
    systemPrompts,
    defaultSystemPromptId,
    currentSystemPrompt,
    actions: threadActions,
  } = useThreadStorage({ prompts });

  const [settings, setSettings] = useLocalStorage<{ cmdToSend: boolean; isIncognitoMode: boolean }>('settings', {
    cmdToSend: false,
    isIncognitoMode: false,
  });

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

  const actions = useMemo(
    () => ({
      ...threadActions,
      updateSettings: (newSettings: Partial<{ cmdToSend: boolean; isIncognitoMode: boolean }>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
      },
    }),
    [threadActions, setSettings],
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
