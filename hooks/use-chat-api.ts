import { useState, useRef, useCallback } from 'react';
import {
  Attachment,
  BedrockModelNames,
  ChatApiInterface,
  ChatThread,
  Message,
  Roles,
  CreativityLevel,
  CREATIVITY_PARAMETERS,
} from '@/lib/types';
import { formatAttachmentMessage, formatAttachments } from '@/lib/utils/file';
import { useChatContext } from '@/contexts/chat-context';
import { anthropicDefaultArtifactPrompt } from '../../prompts/anthropic-default-artifact-prompt';
import { systemPrompts } from '../../prompts';
import { db } from '../lib/db';
import { generateConversationTitle } from '../../utils/title-generation';
import { showErrorToast, TokenInfo } from '../lib/error-utils';
import { NetworkError, APIError } from '../lib/errors';
import { extractThinking, extractRealAnswer, hasThinkTag } from '../../utils/thinkingUtil';
import { toast } from 'sonner';

interface UseChatApiProps {
  apiClient: ChatApiInterface;
  onUpdateMessages: (messages: Message[]) => void;
}

export interface PartialResponse {
  threadId: string;
  text: string;
  thinking?: string;
}

export function useChatApi({ apiClient, onUpdateMessages }: UseChatApiProps) {
  const { currentSystemPrompt, currentThreadId, creativityLevel, actions, settings, tokenCounts } = useChatContext();
  const [isPolling, setIsPolling] = useState(false);
  const [partialResponse, setPartialResponse] = useState<PartialResponse>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  const handleError = useCallback(
    (error: unknown) => {
      // Get conversation tokens from current context - no need to recalculate
      const conversationTokens = tokenCounts.conversationTokens;

      // Simple token breakdown for error report
      const tokenBreakdown = `## Token Usage Report

**Conversation Tokens**: ${conversationTokens.toLocaleString()}
- All messages in this thread (including attachments and images)

*Note: This shows tokens used in the conversation when the error occurred.*`;

      const tokenInfo: TokenInfo = {
        conversationTokens,
        currentInputTokens: 0, // Not relevant for error context
        totalTokens: conversationTokens,
        tokenBreakdown,
      };

      showErrorToast(error, currentThreadId, tokenInfo);
    },
    [currentThreadId, tokenCounts.conversationTokens],
  );

  const pollForResponse = async (conversationId: string, updatedTime: number, currentMessages: Message[]) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsPolling(true);
    try {
      const response = await apiClient.getLatestResponse(conversationId, updatedTime);
      if (!response) {
        throw new APIError('Failed to get response from server');
      }

      const { status, latestResponse } = response;

      if (latestResponse !== undefined) {
        let partialText = latestResponse === '' ? 'Generating...' : latestResponse;
        let partialThinking = undefined;

        if (hasThinkTag(partialText)) {
          partialThinking = extractThinking(partialText);
          partialText = extractRealAnswer(partialText);
        }

        setPartialResponse({
          threadId: conversationId,
          text: partialText,
          thinking: partialThinking, // Add thinking to partial response
        });
      }

      if (status === 'PENDING') {
        timeoutRef.current = setTimeout(() => pollForResponse(conversationId, updatedTime, currentMessages), 1000);
      } else if (status === 'COMPLETE') {
        let responseText = latestResponse || '';
        let thinking = undefined;

        // Process thinking tags if present
        if (hasThinkTag(responseText)) {
          thinking = extractThinking(responseText);
          responseText = extractRealAnswer(responseText);
        }

        const botResponse: Message = {
          text: responseText,
          sender: Roles.ASSISTANT,
          thinking: thinking,
        };

        const updatedMessages = [...currentMessages, botResponse];
        onUpdateMessages(updatedMessages);

        // Generate title only after we have the complete assistant response
        // Check if this is the first message in the thread (messageHistory.length was 0)
        if (currentMessages.length === 1 && currentMessages[0].sender === Roles.HUMAN && latestResponse !== '') {
          generateThreadTitle(
            currentMessages[0].text,
            latestResponse,
            conversationId,
            BedrockModelNames.CLAUDE_V3_5_HAIKU,
          );
        }

        setPartialResponse(undefined);
        setIsPolling(false);
      }
    } catch (error) {
      // Create a new error with actions
      const errorWithActions = error instanceof Error ? new NetworkError(error.message) : error;

      // Add actions array with multiple options
      (errorWithActions as any).actions = [
        {
          label: 'Keep checking',
          action: () => {
            // Restart polling with the same parameters
            setIsPolling(true);
            setPartialResponse({
              threadId: conversationId,
              text: 'Retrying...',
            });
            setTimeout(() => pollForResponse(conversationId, updatedTime, currentMessages), 1000);
          },
          variant: 'secondary', // Use secondary styling
        },
        {
          label: 'Abort',
          action: async () => {
            try {
              setIsPolling(false);
              setPartialResponse(undefined);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              await apiClient.abortConversation(conversationId);
              toast.success('Conversation aborted. You can now retry sending your message.');
            } catch (abortError) {
              toast.error('Failed to abort conversation. Please try again.');
            }
          },
          variant: 'outline', // Use outline styling
        },
      ];

      handleError(errorWithActions);
      setPartialResponse(undefined);
      setIsPolling(false);
    }
  };

  const createConversationAndPoll = (
    messageToSend: string,
    messageHistory: Message[],
    updatedMessages: Message[],
    model: BedrockModelNames = BedrockModelNames.CLAUDE_V3_5_SONNET,
    systemContext: string = currentSystemPrompt.text,
  ) => {
    const conversationTime = Date.now();
    const modelInferenceParams =
      CREATIVITY_PARAMETERS[creativityLevel] || CREATIVITY_PARAMETERS[CreativityLevel.PRECISE];

    setIsPolling(true);
    setPartialResponse({
      threadId: currentThreadId.toString(),
      text: '🤔 Thinking...',
    });
    const artifactPrompt =
      systemPrompts.find((prompt) => prompt.name === 'anthropic-artifact-default') || anthropicDefaultArtifactPrompt;

    if (settings.useArtifacts) {
      systemContext = artifactPrompt.text + systemContext;
    }

    apiClient.createConversation(
      messageToSend,
      messageHistory.map((message) => ({
        text: formatAttachmentMessage(message),
        sender: message.sender,
      })),
      currentThreadId.toString(),
      conversationTime,
      model,
      systemContext,
      (error) => {
        handleError(error);

        setPartialResponse({
          threadId: currentThreadId,
          text: 'I will keep thinking, but you can abort this conversation.',
        });
      },
      modelInferenceParams,
    );

    // Start polling for the response
    setTimeout(() => {
      pollForResponse(currentThreadId.toString(), conversationTime, updatedMessages);
    }, 1000);
  };

  const generateThreadTitle = async (
    userMessage: string,
    assistantMessage: string,
    threadId: string,
    model: BedrockModelNames,
  ) => {
    try {
      const generatedTitle = await generateConversationTitle(apiClient, userMessage, assistantMessage);

      // Update the thread summary with the new title
      const summary = await db.threadSummaries.get(threadId);
      if (summary) {
        summary.name = generatedTitle;
        summary.lastUpdated = new Date();
        await db.threadSummaries.put(summary);

        actions.renameThread(threadId, generatedTitle);
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
      // No need to show an error toast here as it's not critical
    }
  };

  const handleNewMessage = async (input: string, chatThread: ChatThread) => {
    const currentBranch = chatThread.branches.find((b) => b.id === chatThread.currentBranchId);
    if (!currentBranch) {
      handleError('Could not find current branch');
      return;
    }

    const userMessage: Message = {
      text: input,
      sender: Roles.HUMAN,
      attachments: pendingAttachments,
    };

    let messageToSend = input;
    if (pendingAttachments.length > 0) {
      const attachmentContent = formatAttachments(pendingAttachments);
      messageToSend = attachmentContent + input;
    }

    const updatedMessages = [...currentBranch.messages, userMessage];
    onUpdateMessages(updatedMessages);
    setPendingAttachments([]);

    try {
      createConversationAndPoll(
        messageToSend,
        currentBranch.messages,
        updatedMessages,
        currentBranch.model || BedrockModelNames.CLAUDE_V3_5_SONNET_V2,
      );
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Handle the event when a message has been edited by the user
   * @param input new message
   * @param chatThread Chat thread
   * @param editIndex Position of the message to edit
   * @param attachments Current attachments to save with the message
   */
  const handleEditMessage = async (
    input: string,
    chatThread: ChatThread,
    editIndex: number,
    attachments: Attachment[],
  ) => {
    const currentBranch = chatThread.branches.find((b) => b.id === chatThread.currentBranchId);
    if (!currentBranch) {
      handleError('Could not find current branch');
      return;
    }

    const originalMessage = currentBranch.messages[editIndex];
    const newMessage: Message = {
      ...originalMessage,
      text: input,
      attachments: attachments,
    };

    const updatedMessages = [...currentBranch.messages.slice(0, editIndex), newMessage];
    onUpdateMessages(updatedMessages);

    // Clear pending files after sending
    setPendingAttachments([]);

    try {
      const messageToSend = formatAttachmentMessage(newMessage);
      createConversationAndPoll(
        messageToSend,
        updatedMessages.slice(0, -1),
        updatedMessages,
        currentBranch.model || BedrockModelNames.CLAUDE_V3_5_SONNET_V2,
      );
    } catch (error) {
      handleError(error);
    }
  };

  const handleRestartFromMessage = async (chatThread: ChatThread, restartIndex: number) => {
    const currentBranch = chatThread.branches.find((b) => b.id === chatThread.currentBranchId);
    if (!currentBranch) {
      handleError('Could not find current branch');
      return;
    }

    const newMessages = currentBranch.messages.slice(0, restartIndex + 1);
    onUpdateMessages(newMessages);

    const lastMessage = newMessages[newMessages.length - 1];
    if (lastMessage.sender === Roles.HUMAN) {
      try {
        const messageToSend = formatAttachmentMessage(lastMessage);
        createConversationAndPoll(
          messageToSend,
          newMessages.slice(0, -1),
          newMessages,
          currentBranch.model || BedrockModelNames.CLAUDE_V3_5_SONNET_V2,
        );
      } catch (error) {
        handleError(error);
      }
    }
  };

  const handleAbort = async () => {
    setIsPolling(false);
    setPartialResponse(undefined);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      await apiClient.abortConversation(currentThreadId.toString());
    } catch (error) {
      handleError(error);
    }
  };

  return {
    isPolling,
    partialResponse,
    handleNewMessage,
    handleEditMessage,
    handleRestartFromMessage,
    handleAbort,
    pendingAttachments,
    setPendingAttachments,
    generateThreadTitle,
  };
}
