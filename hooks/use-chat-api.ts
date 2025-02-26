import { useState, useRef } from 'react';
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
import { toast } from 'sonner';
import { useChatContext } from '@/contexts/chat-context';

interface UseChatApiProps {
  apiClient: ChatApiInterface;
  onUpdateMessages: (messages: Message[]) => void;
}

export interface PartialResponse {
  threadId: string;
  text: string;
}

export function useChatApi({ apiClient, onUpdateMessages }: UseChatApiProps) {
  const { currentSystemPrompt, currentThreadId, creativityLevel } = useChatContext();
  const [isPolling, setIsPolling] = useState(false);
  const [partialResponse, setPartialResponse] = useState<PartialResponse>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  const pollForResponse = async (conversationId: string, updatedTime: number, currentMessages: Message[]) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsPolling(true);
    try {
      const { status, latestResponse } = await apiClient.getLatestResponse(conversationId, updatedTime);

      if (latestResponse) {
        setPartialResponse({
          threadId: conversationId,
          text: latestResponse,
        });
      }

      if (status === 'PENDING') {
        timeoutRef.current = setTimeout(() => pollForResponse(conversationId, updatedTime, currentMessages), 100);
      } else if (status === 'COMPLETE') {
        const botResponse: Message = {
          text: latestResponse,
          sender: Roles.ASSISTANT,
        };

        const updatedMessages = [...currentMessages, botResponse];
        onUpdateMessages(updatedMessages);

        setPartialResponse(undefined);
        setIsPolling(false);
      }
    } catch (error) {
      // Show the error message directly from the API
      toast.error(String(error));
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
      text: '',
    });

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
        // Show the error message directly from the API
        toast.error(String(error));
        setIsPolling(false);
        setPartialResponse(undefined);
      },
      modelInferenceParams,
    );

    // Start polling for the response
    setTimeout(() => {
      pollForResponse(currentThreadId.toString(), conversationTime, updatedMessages);
    }, 1000);
  };

  const handleNewMessage = async (input: string, chatThread: ChatThread) => {
    const currentBranch = chatThread.branches.find((b) => b.id === chatThread.currentBranchId);
    if (!currentBranch) {
      toast.error('Could not find current branch');
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
      toast.error(String(error));
    }
  };

  /**
   * Handle the event when a message has been edited by the user
   * @param input new message
   * @param chatThread Chat thread
   * @param editIndex Position of the message to edit
   */
  const handleEditMessage = async (input: string, chatThread: ChatThread, editIndex: number) => {
    const currentBranch = chatThread.branches.find((b) => b.id === chatThread.currentBranchId);
    if (!currentBranch) {
      toast.error('Could not find current branch');
      return;
    }

    const originalMessage = currentBranch.messages[editIndex];
    const newMessage: Message = {
      ...originalMessage,
      text: input,
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
      toast.error(String(error));
    }
  };

  const handleRestartFromMessage = async (chatThread: ChatThread, restartIndex: number) => {
    const currentBranch = chatThread.branches.find((b) => b.id === chatThread.currentBranchId);
    if (!currentBranch) {
      toast.error('Could not find current branch');
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
        toast.error(String(error));
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
      toast.error(String(error));
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
  };
}
