'use client';

import { ChatApp } from '@/components/chat-app';
import { ChatProvider } from './contexts/chat-context';
import { ThemeProvider } from './contexts/theme-context';

export default function Home() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <ChatApp />
      </ChatProvider>
    </ThemeProvider>
  );
}
