'use client';

import { ChatApp } from '@/components/chat-app';
import { ChatProvider } from './contexts/chat-context';

export default function Home() {
  return (
    <ChatProvider>
      <ChatApp />
    </ChatProvider>
  );
}
