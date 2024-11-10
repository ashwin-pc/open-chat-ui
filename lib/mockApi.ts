/* eslint-disable @typescript-eslint/no-unused-vars */
// src/mockApi.ts

import { Message, BedrockModelNames } from './types';

// Simulated delay for API calls
const SIMULATED_DELAY = 3000;

// Mock conversation storage
let mockConversations: { [id: string]: Message[] } = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendMessage = async (prompt: string, chatHistory: Array<Message>): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  return { success: true };
};

export const getLatestResponse = async (
  conversationId: string,
  updatedTime: number
): Promise<{
  status: string;
  latestResponse: string;
}> => {
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  
  const conversation = mockConversations[conversationId] || [];
  const lastMessage = conversation[conversation.length - 1];
  
  if (lastMessage && lastMessage.sender === 'Assistant') {
    return { status: 'COMPLETE', latestResponse: lastMessage.text };
  } else {
    return { status: 'PENDING', latestResponse: 'Thinking...' };
  }
};

export const abortConversation = async (conversationId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  // In a real implementation, you might want to mark the conversation as aborted
};

export const createConversation = (
  message: string,
  chatHistory: Array<Message>,
  id: string,
  updatedTime: number,
  model: BedrockModelNames,
  systemContext: string,
  onError: (error: string) => void
): void => {
  // Add the user's message immediately
  mockConversations[id] = [...(mockConversations[id] || []), { sender: 'Human', text: message }];

  // Add the assistant's response after the delay
  setTimeout(() => {
    const newMessage: Message = {
      sender: 'Assistant',
      text: `Mock response to: ${message}`
    };
    mockConversations[id] = [...mockConversations[id], newMessage];
  }, SIMULATED_DELAY);
};

// Helper function to get all conversations (for UI testing)
export const getAllConversations = (): { [id: string]: Message[] } => {
  return mockConversations;
};

// Helper function to clear all conversations (for testing reset)
export const clearAllConversations = (): void => {
  mockConversations = {};
};