/* eslint-disable @typescript-eslint/no-unused-vars */
// src/mockApi.ts

import { Message, BedrockModelNames, Roles } from './types';

// Simulated delay for API calls
const SIMULATED_DELAY = 3000;

// Mock conversation storage
let mockConversations: { [id: string]: Message[] } = {};

// Add a new map to store ongoing conversations and their state
const ongoingResponses = new Map<
  string,
  {
    fullResponse: string;
    currentPosition: number;
    chunkSize: number;
  }
>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendMessage = async (prompt: string, chatHistory: Array<Message>): Promise<any> => {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
  return { success: true };
};

export const getLatestResponse = async (
  conversationId: string,
  timestamp: number,
): Promise<{ status: 'PENDING' | 'COMPLETE'; latestResponse: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Reduced delay for smoother updates

  const conversation = ongoingResponses.get(conversationId);

  if (!conversation) {
    return { status: 'COMPLETE', latestResponse: '' };
  }

  const { fullResponse, currentPosition, chunkSize } = conversation;
  const newPosition = Math.min(currentPosition + chunkSize, fullResponse.length);
  const currentResponse = fullResponse.slice(0, newPosition);

  ongoingResponses.set(conversationId, {
    ...conversation,
    currentPosition: newPosition,
  });

  // Return PENDING status until we reach the end
  const status = newPosition >= fullResponse.length ? 'COMPLETE' : 'PENDING';

  if (status === 'COMPLETE') {
    ongoingResponses.delete(conversationId);
  }

  return { status, latestResponse: currentResponse };
};

export const abortConversation = async (conversationId: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
  // In a real implementation, you might want to mark the conversation as aborted
};

export const createConversation = (
  message: string,
  chatHistory: Array<Message>,
  id: string,
  updatedTime: number,
  model: BedrockModelNames,
  systemContext: string,
  onError: (error: string) => void,
): void => {
  debugger;
  // Add the user's message immediately
  mockConversations[id] = [...(mockConversations[id] || []), { sender: Roles.HUMAN, text: message }];

  // Add the assistant's response after the delay
  setTimeout(() => {
    const newMessage: Message = {
      sender: Roles.ASSISTANT,
      text: `Mock response to: ${message}`,
    };
    mockConversations[id] = [...mockConversations[id], newMessage];
  }, SIMULATED_DELAY);

  const mockResponse = `Here is a detailed response that will be streamed word by word. This is simulating how a real LLM would generate text token by token. The response will grow longer with each polling request until it's complete.`;

  ongoingResponses.set(id, {
    fullResponse: mockResponse,
    currentPosition: 0,
    chunkSize: 5, // Number of characters to reveal per poll
  });
};

// Helper function to get all conversations (for UI testing)
export const getAllConversations = (): { [id: string]: Message[] } => {
  return mockConversations;
};

// Helper function to clear all conversations (for testing reset)
export const clearAllConversations = (): void => {
  mockConversations = {};
};
