import { Copy, Edit, GitBranch, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { toast } from 'sonner';
import ReactMarkdown, { Components } from 'react-markdown';
import { Roles } from '@/lib/types';
import { CodeBlock } from './code-block';

const components: Partial<Components> = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
};

interface MessageProps {
  message: {
    text: string;
    sender: string;
    attachments?: { name: string }[];
  };
  index: number;
  editingMessageId: number | null;
  onRestart: (index: number) => void;
  onEdit: (index: number) => void;
  onBranch: (index: number) => void;
}

export function Message({ message, index, editingMessageId, onRestart, onEdit, onBranch }: MessageProps) {
  const isAfterEditPoint = editingMessageId !== null && index > editingMessageId;
  const isHuman = message.sender === Roles.HUMAN;

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(message.text);
    toast.success('Copied to clipboard');
  }, [message.text]);

  const ActionButtons = () => (
    <div className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex bg-background/95 rounded-lg shadow-sm border border-border/50">
        {isHuman ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none hover:bg-accent first:rounded-l-lg last:rounded-r-lg"
              onClick={() => onEdit(index)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <div className="w-[1px] bg-border/50" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none hover:bg-accent first:rounded-l-lg last:rounded-r-lg"
              onClick={() => onRestart(index)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none hover:bg-accent first:rounded-l-lg last:rounded-r-lg"
              onClick={() => onBranch(index)}
            >
              <GitBranch className="h-4 w-4" />
            </Button>
            <div className="w-[1px] bg-border/50" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none hover:bg-accent first:rounded-l-lg last:rounded-r-lg"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`flex mb-4 ${isHuman ? 'justify-end' : 'justify-start'} 
            ${isAfterEditPoint ? 'opacity-50' : ''}`}
        >
          <div
            className={`flex flex-col items-${isHuman ? 'end' : 'start'} relative group 
              ${isHuman ? 'sm:items-end' : 'sm:items-start'}`}
          >
            <Avatar
              className={`h-6 w-6 sm:h-8 sm:w-8 mb-2 
              ${isHuman ? 'self-end' : 'self-start'}`}
            >
              <AvatarFallback>{isHuman ? <UserAvatar /> : <BotAvatar />}</AvatarFallback>
            </Avatar>
            <div className={`rounded-lg ${isHuman ? 'bg-muted p-3' : 'bg-transparent pl-3'}`}>
              <div
                className={`
                  prose max-w-none
                  prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-semibold
                  prose-p:my-1 prose-p:leading-relaxed
                  prose-a:text-primary hover:prose-a:opacity-80
                  prose-ul:my-1 prose-ol:my-1 prose-li:my-0
                  prose-img:rounded-lg
                  dark:prose-invert`}
              >
                <ReactMarkdown components={components}>{message.text}</ReactMarkdown>
              </div>
              {message.attachments && message.attachments.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center mt-1 text-xs text-muted-foreground cursor-pointer">
                      <Paperclip className="h-3 w-3 mr-1" />
                      <span>
                        {message.attachments.length} attachment
                        {message.attachments.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <ul className="text-xs">
                      {message.attachments.map((attachment, idx) => (
                        <li key={idx}>{attachment.name}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <ActionButtons />
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {isHuman ? (
          <>
            <ContextMenuItem onClick={() => onEdit(index)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit message
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRestart(index)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart from here
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onClick={() => onBranch(index)}>
              <GitBranch className="mr-2 h-4 w-4" />
              Branch from here
            </ContextMenuItem>
            <ContextMenuItem onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy to clipboard
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const BotAvatar = () => (
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
