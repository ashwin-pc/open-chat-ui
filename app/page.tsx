'use client';

import { ChatApp } from '@/components/chat-app';
import { ChatProvider } from '../contexts/chat-context';
import * as apiClient from '@/lib/api';

export default function Home() {
  return (
    <ChatProvider>
      <ChatApp apiClient={apiClient} />
    </ChatProvider>
  );
}
