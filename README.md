# Chat UI Component Library

A React-based chat interface component library with support for threaded conversations, file attachments, and AI model integration.

## Features

- Threaded conversations with branching support
- File attachments
- Real-time responses
- Immersive mode
- Keyboard shortcuts
- Multiple AI model support
- Dark/Light theme
- Responsive design

## Installation

```bash
npm install open-chat
```

## Usage

```tsx
import { ChatApp, ChatProvider, ThemeProvider } from 'open-chat-ui';
import 'open-chat-ui/style.css';

function App() {
  return (
      <ChatProvider>
        <ChatApp />
      </ChatProvider>
  );
}
```

## Development

This repository contains both the component library and a Next.js development environment for testing.

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build the library:
```bash
npm run build-lib
```

### Local Testing

You can use the included Next.js app to test the component library:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the chat interface in action.

## Component API

### ChatApp
Main component that renders the chat interface.

```tsx
interface ChatAppProps {
  apiClient?: ChatApiInterface;
}
```

### ChatProvider
Context provider for chat functionality.

### ThemeProvider
Theme context provider for styling.

## Models

Supported AI models:
```typescript
enum BedrockModelNames {
  CLAUDE_V3_5_SONNET_V2
  CLAUDE_V3_5_SONNET
  CLAUDE_V3_5_HAIKU
  CLAUDE_V3_OPUS
  CLAUDE_V3_SONNET
  CLAUDE_V3_HAIKU
}
```

## Publishing

To publish a new version:

1. Update version in 

package.json


2. Build the library:
```bash
npm run build-lib
```
3. Publish to npm: (also builds, but is useful to keep them seapare for now)
```bash
npm publish
```

## Tech Stack

- React 18+
- TypeScript
- Radix UI Components
- Tailwind CSS
- Lucide Icons

## License

This project is licensed under the MIT License.

## Contributing

We welcome all contributions!
