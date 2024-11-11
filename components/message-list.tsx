import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu';
import { Edit, GitBranch, RotateCcw } from 'lucide-react';
import { Message } from '@/lib/types';

interface MessageListProps {
  messages: Message[];
  editingMessageId: number | null;
  partialResponse: string;
  isPolling: boolean;
  onRestart: (index: number) => void;
  onEdit: (index: number) => void;
  onBranch: (index: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  BotAvatar: React.FC;
  UserAvatar: React.FC;
}

export function MessageList({
  messages,
  editingMessageId,
  partialResponse,
  isPolling,
  onRestart,
  onEdit,
  onBranch,
  messagesEndRef,
  BotAvatar,
  UserAvatar,
}: MessageListProps) {
  return (
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

      {/* Partial response */}
      {partialResponse && (
        <div className="flex justify-start mb-4 relative group">
          <div className="flex items-start space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <BotAvatar />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3">
              <p className="whitespace-pre-wrap">{partialResponse}</p>
              <div className="h-4 w-4 absolute bottom-2 right-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isPolling && !partialResponse && (
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
