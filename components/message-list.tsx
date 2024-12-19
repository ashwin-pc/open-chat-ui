import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Message as MessageType, Roles } from '@/lib/types';
import React, { Suspense, useEffect, useRef } from 'react';
import { PartialResponse } from '@/hooks/use-chat-api';
import { BotAvatar, Message } from './message';

// Lazy load the EmptyAnimation component
const EmptyAnimation = React.lazy(() => import('./empty-animation'));

// Simple loading fallback
const LoadingFallback = () => (
  <div className="w-full h-full min-h-[200px] bg-background/50 backdrop-blur-sm animate-pulse" />
);

interface MessageListProps {
  messages: MessageType[];
  editingMessageId: number | null;
  partialResponse?: PartialResponse;
  isPolling: boolean;
  threadId: string;
  onRestart: (index: number) => void;
  onEdit: (index: number) => void;
  onBranch: (index: number) => void;
}

function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center animate-fade-in">
      <Suspense fallback={<LoadingFallback />}>
        <EmptyAnimation />
      </Suspense>
      <h2 className="text-2xl font-semibold tracking-tight">Hi there!</h2>
      <p className="text-muted-foreground max-w-sm">
        Start a conversation by typing a message below. Press{' '}
        <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">⌘+Enter</kbd> or{' '}
        <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+Enter</kbd> to send your message. You can
        also attach files to enhance your discussion. Press{' '}
        <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">⌘/</kbd> or{' '}
        <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+/</kbd> to view all shortcuts.
      </p>
    </div>
  );
}

export function MessageList({
  messages,
  editingMessageId,
  partialResponse,
  isPolling,
  threadId,
  onRestart,
  onEdit,
  onBranch,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Scroll only when:
    // 1. A new message is added (messages.length changes)
    // 2. Partial response completes (partialResponse becomes null after being present)
    // 3. First message starts streaming (partialResponse begins)
    if (
      messages.length > 0 &&
      (lastMessageRef.current !== messages[messages.length - 1]?.text ||
        (!partialResponse && isPolling) ||
        (messages.length === 0 && partialResponse?.text))
    ) {
      scrollToBottom();
    }

    // Update last message reference
    if (messages.length > 0) {
      lastMessageRef.current = messages[messages.length - 1].text;
    }
  }, [messages, partialResponse, isPolling]);

  return (
    <>
      {messages.length === 0 && !partialResponse && !isPolling ? (
        <Welcome />
      ) : (
        <>
          {messages.map((message, index) => {
            return (
              <Message
                key={index}
                message={message}
                index={index}
                editingMessageId={editingMessageId}
                onRestart={onRestart}
                onEdit={onEdit}
                onBranch={onBranch}
              />
            );
          })}
        </>
      )}

      {/* Only show partial response if this is the current thread */}
      {partialResponse?.threadId === threadId && (
        <Message
          message={{
            text: partialResponse.text,
            sender: Roles.ASSISTANT,
            attachments: [],
          }}
          index={messages.length}
          editingMessageId={null}
          onRestart={onRestart}
          onEdit={onEdit}
          onBranch={onBranch}
          isPartial={true}
        />
      )}

      <div ref={messagesEndRef} />
    </>
  );
}
