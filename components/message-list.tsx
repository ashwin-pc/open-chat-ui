import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu';
import { Edit, GitBranch, RotateCcw } from 'lucide-react';
import { Message } from '@/lib/types';
import React, { Suspense, useEffect, useRef } from 'react';
import { PartialResponse } from '@/hooks/use-chat-api';

// Lazy load the EmptyAnimation component
const EmptyAnimation = React.lazy(() => import('./empty-animation'));

// Simple loading fallback
const LoadingFallback = () => (
  <div className="w-full h-full min-h-[200px] bg-background/50 backdrop-blur-sm animate-pulse" />
);

interface MessageListProps {
  messages: Message[];
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
      <h2 className="text-2xl font-semibold tracking-tight">Welcome to Diya</h2>
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll when messages change or partial response updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, partialResponse?.text]);

  return (
    <>
      {messages.length === 0 && !partialResponse && !isPolling ? (
        <Welcome />
      ) : (
        <>
          {messages.map((message, index) => {
            const isAfterEditPoint = editingMessageId !== null ? index > editingMessageId : false;
            return (
              <ContextMenu key={index}>
                <ContextMenuTrigger>
                  <div
                    className={`flex mb-4 ${message.sender === 'Human' ? 'justify-end' : 'justify-start'} 
                ${isAfterEditPoint ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`flex items-start ${
                        message.sender === 'Human' ? 'space-x-reverse space-x-2 flex-row-reverse' : 'space-x-2'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{message.sender === 'Human' ? <UserAvatar /> : <BotAvatar />}</AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === 'Human' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onRestart(index)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restart from here
                  </ContextMenuItem>
                  {message.sender === 'Human' && editingMessageId === null && (
                    <ContextMenuItem onClick={() => onEdit(index)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit message
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem onClick={() => onBranch(index)}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Branch from here
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </>
      )}

      {/* Only show partial response if this is the current thread */}
      {partialResponse?.threadId === threadId && (
        <div className="flex justify-start mb-4 relative group">
          <div className="flex items-start space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <BotAvatar />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3">
              <p className="whitespace-pre-wrap">{partialResponse.text}</p>
              <div className="h-4 w-4 absolute bottom-2 right-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show loading indicator if this is the current thread */}
      {partialResponse?.threadId === threadId && isPolling && partialResponse.text === '' && (
        <div className="flex justify-start mb-4">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <BotAvatar />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );
}

const BotAvatar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-full w-full">
    <circle cx="20" cy="20" r="20" fill="#7C3AED" />
    <path d="M10 15 L20 10 L30 15 L30 25 L20 30 L10 25Z" fill="#A78BFA" />
    <circle cx="20" cy="20" r="6" fill="#C4B5FD" />
    <path d="M17 18 L23 18 L20 22Z" fill="#7C3AED" />
    <circle cx="16" cy="17" r="2" fill="#EDE9FE" />
    <circle cx="24" cy="17" r="2" fill="#EDE9FE" />
    <path d="M15 24 Q20 28 25 24" stroke="#DDD6FE" fill="none" strokeWidth="1.5" />
  </svg>
);

const UserAvatar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-full w-full">
    <circle cx="20" cy="20" r="20" fill="#2DD4BF" />
    <polygon points="20,5 30,15 25,30 15,30 10,15" fill="#14B8A6" />
    <circle cx="20" cy="18" r="7" fill="#5EEAD4" />
    <rect x="15" y="16" width="10" height="4" rx="2" fill="#99F6E4" />
    <circle cx="15" cy="15" r="2" fill="#CCFBF1" />
    <circle cx="25" cy="15" r="2" fill="#CCFBF1" />
    <path d="M15 22 Q20 25 25 22" stroke="#F0FDFA" fill="none" strokeWidth="1.5" />
  </svg>
);
