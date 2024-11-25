import { useState, useRef } from 'react';
import { BedrockModelNames, ChatApiInterface, Message, Roles } from '@/lib/types';

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
    };

    const timestamp = Date.now();
    const updatedMessages = [...currentMessages, userMessage];
    onUpdateMessages(updatedMessages);

    apiClient.createConversation(input, updatedMessages, currentThreadId.toString(), timestamp, model, '', (error) =>
      console.error(error),
    );

    // Wait for 1 second before starting to poll
    setTimeout(() => {
      pollForResponse(currentThreadId.toString(), timestamp, updatedMessages);
    }, 1000);
  };

  const handleEditMessage = async (input: string, currentMessages: Message[], editIndex: number) => {
    const newMessage: Message = {
      text: input,
      sender: Roles.HUMAN,
    };

    // Keep messages up to the edit point and add the edited message
    const updatedMessages = [...currentMessages.slice(0, editIndex), newMessage];
    onUpdateMessages(updatedMessages);

    // Get bot response for the edited message
    const botResponse = await apiClient.sendMessage(input, currentMessages);
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
  };
}
