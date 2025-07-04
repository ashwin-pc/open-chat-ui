import { createContext, useContext, useMemo, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { SystemPrompt, CreativityLevel, Message, Attachment, Roles } from '@/lib/types';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { useLocalStorage } from 'usehooks-ts';
import { UseThreadData, useThreadStorage } from '@/hooks/use-thread-storage';
import { Artifact } from '@/components/artifacts/types';
import { record } from 'aws-amplify/analytics';
import { getTokenCount, formatAttachmentMessage } from '@/lib/utils/file';

type Settings = {
  cmdToSend: boolean;
  isIncognitoMode: boolean;
  largeTextPasteDetection: boolean;
  enableMaxChatWidth: boolean;
  useArtifacts: boolean;
  showTokenCounter: boolean;
};

type TokenCounts = {
  conversationTokens: number;
  currentInputTokens: number;
  totalTokens: number;
};

export interface ChatContextType extends Omit<UseThreadData, 'actions'> {
  settings: Settings;
  creativityLevel: CreativityLevel;
  currentArtifact: Artifact | null;
  tokenCounts: TokenCounts;
  actions: UseThreadData['actions'] & {
    updateSettings: (newSettings: Partial<Settings>) => void;
    setCurrentArtifact: (artifact: Artifact | null) => void;
    calculateTokens: (currentInput?: string, currentAttachments?: Attachment[]) => TokenCounts;
  };
  setCreativityLevel: (level: CreativityLevel) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  prompts,
  threadId,
}: {
  children: ReactNode;
  prompts?: SystemPrompt[];
  threadId?: string | null;
}) {
  const [settings, setSettings] = useLocalStorage<Settings>('settings', {
    cmdToSend: false,
    isIncognitoMode: false,
    largeTextPasteDetection: false,
    enableMaxChatWidth: true,
    useArtifacts: false,
    showTokenCounter: false,
  });

  // Right panel artifact
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);

  // Token counting state
  const [tokenCounts, setTokenCounts] = useState<TokenCounts>({
    conversationTokens: 0,
    currentInputTokens: 0,
    totalTokens: 0,
  });

  // Cache for conversation tokens to avoid recalculating
  const conversationTokenCacheRef = useRef<{
    branchId: number | undefined;
    messageCount: number;
    tokens: number;
  }>({ branchId: undefined, messageCount: 0, tokens: 0 });

  const {
    threadSummaries,
    currentThreadId,
    currentThread,
    currentBranch,
    systemPrompts,
    defaultSystemPromptId,
    currentSystemPrompt,
    actions: threadActions,
  } = useThreadStorage({ prompts, isIncognito: settings.isIncognitoMode, threadId });

  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>(CreativityLevel.PRECISE);

  // Define updateSettings with useCallback to ensure stable reference
  const updateSettings = useCallback(
    (newSettings: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [setSettings],
  );

  // Token calculation function with caching
  const calculateTokens = useCallback(
    (currentInput = '', currentAttachments: Attachment[] = []): TokenCounts => {
      // Calculate tokens from all conversation messages with caching
      let conversationTokens = 0;
      const currentBranchId = currentBranch?.id;
      const messageCount = currentBranch?.messages?.length || 0;

      // Check if we can use cached conversation tokens
      if (
        conversationTokenCacheRef.current.branchId === currentBranchId &&
        conversationTokenCacheRef.current.messageCount === messageCount &&
        messageCount > 0
      ) {
        conversationTokens = conversationTokenCacheRef.current.tokens;
      } else {
        // Recalculate and cache conversation tokens
        if (currentBranch?.messages) {
          conversationTokens = currentBranch.messages.reduce((total, message) => {
            const messageContent = formatAttachmentMessage(message);
            return total + getTokenCount(messageContent);
          }, 0);
        }

        // Update cache
        conversationTokenCacheRef.current = {
          branchId: currentBranchId,
          messageCount,
          tokens: conversationTokens,
        };
      }

      // Calculate tokens from current input and attachments
      const currentInputContent =
        currentAttachments.length > 0
          ? formatAttachmentMessage({ text: currentInput, sender: Roles.HUMAN, attachments: currentAttachments })
          : currentInput;
      const currentInputTokens = getTokenCount(currentInputContent);

      const totalTokens = conversationTokens + currentInputTokens;

      const newTokenCounts = {
        conversationTokens,
        currentInputTokens,
        totalTokens,
      };

      setTokenCounts(newTokenCounts);
      return newTokenCounts;
    },
    [currentBranch?.messages, currentBranch?.id],
  );

  // Side effect to react to incognito mode changes
  useEffect(() => {
    if (!settings.isIncognitoMode) {
      // When turning off incognito, delete all incognito threads
      threadSummaries
        .filter((summary) => summary.isIncognitoThread)
        .forEach((thread) => threadActions.deleteThread(thread.id));
    }
    // We only want to run this effect when isIncognitoMode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.isIncognitoMode]);

  // Record page load event
  useEffect(() => {
    record({ name: 'WebPageLoad', attributes: { page: 'New UI' } });
  }, []);

  useHotkeys('new-thread', {
    key: 'ctrl+n',
    description: 'Create new thread',
    scope: 'Global',
    callback: () => {
      setCurrentArtifact(null);
      threadActions.createThread();
    },
  });

  useHotkeys('next-thread', {
    key: 'cmd+]',
    description: 'Next thread',
    scope: 'Global',
    callback: () => {
      const currentIndex = threadSummaries.findIndex((t) => t.id === currentThreadId);
      const nextIndex = (currentIndex + 1) % threadSummaries.length;
      setCurrentArtifact(null);
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
      setCurrentArtifact(null);
      actions.switchThread(threadSummaries[prevIndex].id);
    },
  });

  const actions = useMemo(
    () => ({
      ...threadActions,
      updateSettings,
      setCurrentArtifact,
      calculateTokens,
    }),
    [threadActions, updateSettings, calculateTokens],
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
        currentArtifact,
        tokenCounts,
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
