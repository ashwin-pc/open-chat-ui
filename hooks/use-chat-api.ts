import { useState, useRef } from 'react';
import { Attachment, BedrockModelNames, ChatApiInterface, Message, Roles } from '@/lib/types';
import { formatAttachmentMessage, formatAttachments } from '@/lib/utils/file';

interface UseChatApiProps {
  currentThreadId: string;
  apiClient: ChatApiInterface;
  onUpdateMessages: (messages: Message[]) => void;
}

export interface PartialResponse {
  threadId: string;
  text: string;
}

export function useChatApi({ currentThreadId, apiClient, onUpdateMessages }: UseChatApiProps) {
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
  };

  const handleNewMessage = async (input: string, currentMessages: Message[], model: BedrockModelNames) => {
    const userMessage: Message = {
      text: input,
      sender: Roles.HUMAN,
      attachments: pendingAttachments, // Store serialized attachments
    };

    // Prepare message to send to the API
    let messageToSend = input;
    if (pendingAttachments.length > 0) {
      const attachmentContent = formatAttachments(pendingAttachments);
      messageToSend = attachmentContent + input;
    }

    const messageHistoryToSend = currentMessages.map((message) => {
      return {
        text: formatAttachmentMessage(message),
        sender: message.sender,
      };
    });

    // Send the message to the API
    apiClient.createConversation(
      messageToSend,
      messageHistoryToSend,
      currentThreadId.toString(),
      Date.now(),
      model,
      '',
      (error) => console.error(error),
    );

    const updatedMessages = [...currentMessages, userMessage];
    onUpdateMessages(updatedMessages);

    // Clear pending files after sending
    setPendingAttachments([]);

    // Start polling for the response
    setTimeout(() => {
      pollForResponse(currentThreadId.toString(), Date.now(), updatedMessages);
    }, 1000);
  };

  /**
   * Handle the event when a message has been edited by the user
   * @param input new message
   * @param currentMessages Current messages
   * @param editIndex Position of the message to edit
   */
  const handleEditMessage = async (input: string, currentMessages: Message[], editIndex: number) => {
    debugger;
    // When editing, restore files from the original message
    const originalMessage = currentMessages[editIndex];

    const newMessage: Message = {
      ...originalMessage,
      text: input,
    };

    // Formsat attachments
    const messageToSend = formatAttachmentMessage(newMessage);
    const messageHistoryToSend = currentMessages.map((message) => {
      return {
        text: formatAttachmentMessage(message),
        sender: message.sender,
      };
    });

    // Keep messages up to the edit point and add the edited message
    const updatedMessages = [...currentMessages.slice(0, editIndex), newMessage];
    onUpdateMessages(updatedMessages);

    // Clear pending files after sending
    setPendingAttachments([]);

    // Get bot response for the edited message
    const botResponse = await apiClient.sendMessage(messageToSend, messageHistoryToSend);
    const newBotMessage: Message = {
      text: botResponse.latestResponse || "I'm a mock response to your edited message.",
      sender: Roles.ASSISTANT,
    };
    onUpdateMessages([...updatedMessages, newBotMessage]);
  };

  const handleRestartFromMessage = async (currentMessages: Message[], restartIndex: number) => {
    const newMessages = currentMessages.slice(0, restartIndex + 1);
    onUpdateMessages(newMessages);

    const lastMessage = newMessages[newMessages.length - 1];
    if (lastMessage.sender === Roles.HUMAN) {
      apiClient.createConversation(
        lastMessage.text,
        newMessages,
        currentThreadId.toString(),
        Date.now(),
        BedrockModelNames.CLAUDE_V3_5_SONNET,
        '',
        (error) => console.error(error),
      );
      pollForResponse(currentThreadId.toString(), Date.now(), newMessages);
    }
  };

  const handleAbort = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await apiClient.abortConversation(currentThreadId.toString());
    setIsPolling(false);
    setPartialResponse(undefined);
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
