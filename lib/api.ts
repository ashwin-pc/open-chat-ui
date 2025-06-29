/* eslint-disable @typescript-eslint/no-unused-vars */
// src/mockApi.ts

import { Message, BedrockModelNames, Roles } from './types';

// Simulated delay for API calls
const SIMULATED_DELAY = 500;

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

  // Special handling for title generation conversations
  if (id.startsWith('title-')) {
    const mockTitle = 'Generated Mock Title';
    ongoingResponses.set(id, {
      fullResponse: mockTitle,
      currentPosition: 0,
      chunkSize: 5, // Smaller chunks for title
    });
  } else {
    // Generate artifact-based responses for testing
    const mockResponse = generateMockResponse(message);

    ongoingResponses.set(id, {
      fullResponse: mockResponse,
      currentPosition: 0,
      chunkSize: 500, // Larger chunks to ensure artifact tags are delivered complete
    });
  }
};

// Helper function to get all conversations (for UI testing)
export const getAllConversations = (): { [id: string]: Message[] } => {
  return mockConversations;
};

// Helper function to clear all conversations (for testing reset)
export const clearAllConversations = (): void => {
  mockConversations = {};
};

// Helper function to generate mock responses with artifacts for testing
function generateMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Use explicit artifact type detection with specific, non-overlapping keywords
  
  // Python artifacts - specific language keyword
  if (lowerMessage.includes('python')) {
    return `Here's a Python function for you:

<antArtifact identifier="python-function" type="application/vnd.ant.code" language="python" title="Python Function">
def find_primes(n):
    primes = []
    for num in range(2, n + 1):
        is_prime = True
        for i in range(2, int(num ** 0.5) + 1):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(num)
    return primes

# Example usage
print(find_primes(20))  # Output: [2, 3, 5, 7, 11, 13, 17, 19]
</antArtifact>

This function finds all prime numbers up to n.`;
  }
  
  // JavaScript artifacts - specific language keywords only
  if (lowerMessage.includes('javascript') || lowerMessage.includes(' js ')) {
    return `I'll create a JavaScript function for you:

<antArtifact identifier="js-function" type="application/vnd.ant.code" language="javascript" title="JavaScript Function">
function addNumbers(a, b) {
  return a + b;
}

// Example usage
console.log(addNumbers(5, 3)); // Output: 8
</antArtifact>

This function takes two parameters and returns their sum.`;
  }
  
  // Mermaid artifacts - specific tool name
  if (lowerMessage.includes('mermaid')) {
    return `I'll create a flowchart diagram for you:

<antArtifact identifier="flowchart-diagram" type="application/vnd.ant.mermaid" title="Decision Process">
flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
</antArtifact>

This flowchart shows a simple decision process with branching logic.`;
  }
  
  // Markdown artifacts - specific format keywords
  if (lowerMessage.includes('markdown') || lowerMessage.includes(' md ')) {
    return `I'll create a markdown guide for you:

<antArtifact identifier="api-guide" type="text/markdown" title="REST API Guide">
# REST API Guide

## Overview
REST (Representational State Transfer) is an architectural style for designing web services.

## HTTP Methods
- **GET**: Retrieve data
- **POST**: Create new resource
- **PUT**: Update existing resource
- **DELETE**: Remove resource

## Example Usage
\`\`\`javascript
// GET request
fetch('/api/users')
  .then(response => response.json())
  .then(data => console.log(data));
\`\`\`

## Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |
</antArtifact>

This guide covers the basics of REST API design and usage.`;
  }
  
  // Animated SVG artifacts - check for animation keywords first
  if (lowerMessage.includes('animated') && lowerMessage.includes('svg')) {
    return `I'll create an animated SVG logo for you:

<antArtifact identifier="animated-logo" type="image/svg+xml" title="Animated Logo">
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Rotating circle -->
  <circle cx="100" cy="100" r="40" fill="#FF6B6B">
    <animate attributeName="fill" values="#FF6B6B;#4ECDC4;#45B7D1;#FF6B6B" dur="3s" repeatCount="indefinite"/>
  </circle>
  
  <!-- Rotating star -->
  <g transform-origin="100 100">
    <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 100 100" to="360 100 100" dur="4s" repeatCount="indefinite"/>
    <polygon points="100,60 110,85 135,85 116,102 125,127 100,115 75,127 84,102 65,85 90,85" fill="#FFD93D">
      <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
    </polygon>
  </g>
  
  <!-- Pulsing text -->
  <text x="100" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#333">
    <animate attributeName="font-size" values="16;20;16" dur="1.5s" repeatCount="indefinite"/>
    LOGO
  </text>
</svg>
</antArtifact>

This animated SVG features rotating elements, color transitions, and pulsing effects.`;
  }
  
  // Static SVG artifacts - specific format keyword
  if (lowerMessage.includes('svg')) {
    return `I'll create an SVG illustration for you:

<antArtifact identifier="house-svg" type="image/svg+xml" title="House Illustration">
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- House base -->
  <rect x="50" y="100" width="100" height="80" fill="#8B4513" stroke="#654321" stroke-width="2"/>
  
  <!-- Roof -->
  <polygon points="40,100 100,50 160,100" fill="#DC143C" stroke="#B22222" stroke-width="2"/>
  
  <!-- Door -->
  <rect x="85" y="140" width="30" height="40" fill="#654321" stroke="#4A4A4A" stroke-width="1"/>
  <circle cx="108" cy="160" r="2" fill="#FFD700"/>
  
  <!-- Windows -->
  <rect x="65" y="120" width="15" height="15" fill="#87CEEB" stroke="#4A4A4A" stroke-width="1"/>
  <rect x="120" y="120" width="15" height="15" fill="#87CEEB" stroke="#4A4A4A" stroke-width="1"/>
</svg>
</antArtifact>

This SVG shows a simple house with a door, windows, and a red roof.`;
  }
  
  // React artifacts - specific framework keyword
  if (lowerMessage.includes('react')) {
    return `I'll create a React counter app for you:

<antArtifact identifier="counter-app" type="application/vnd.ant.react-app" title="Counter App">
function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-4">Counter: {count}</h1>
      <div className="flex justify-center space-x-4">
        <button 
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          -
        </button>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          +
        </button>
        <button 
          onClick={() => setCount(0)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
</antArtifact>

This React app includes increment, decrement, and reset functionality.`;
  }
  
  // Default response without artifacts
  return `Here is a detailed response that will be streamed word by word. This is simulating how a real LLM would generate text token by token. The response will grow longer with each polling request until it's complete.`;
}
