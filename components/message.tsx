import { Copy, Edit, GitBranch, RotateCcw } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { toast } from 'sonner';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { Attachment, Roles } from '@/lib/types';
import { CodeBlock } from './code-block';
import { ArtifactButton } from '@/components/artifact-button';
import { cleanStreamingTextAsMessage, parseArtifact } from '@/components/artifacts/artifact-parser';
import { Artifact } from '@/components/artifacts/types';
import { useSidebar } from '@/components/ui/sidebar';
import { useChatContext } from '@/contexts/chat-context';
import { TextFilePreview } from '@/components/text-file-preview';
import { isFileImage } from '@/lib/utils/file';

const components: Partial<Components> = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const content = String(children).replace(/\n$/, '');

    const isCodeBlock = match || content.includes('\n');

    if (!isCodeBlock) {
      return <code className={className}>{content}</code>;
    }

    return <CodeBlock language={match?.[1] || 'text'} value={content} />;
  },
  pre({ children }) {
    return <>{children}</>;
  },
};

// Memoized markdown component
const MemoizedMarkdown = memo(function MemoizedMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>
      {text}
    </ReactMarkdown>
  );
});

interface MessageProps {
  message: {
    text: string;
    sender: string;
    attachments?: Attachment[];
  };
  index: number;
  editingMessageId: number | null;
  onRestart: (index: number) => void;
  onEdit: (index: number) => void;
  onBranch: (index: number) => void;
  isPartial?: boolean;
}

// Memoized action buttons component
const ActionButtons = memo(function ActionButtons({
  isHuman,
  onEdit,
  onRestart,
  onBranch,
  copyToClipboard,
  index,
}: {
  isHuman: boolean;
  onEdit: (index: number) => void;
  onRestart: (index: number) => void;
  onBranch: (index: number) => void;
  copyToClipboard: () => void;
  index: number;
}) {
  return (
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
});

export const Message = memo(function Message({
  message,
  index,
  editingMessageId,
  onRestart,
  onEdit,
  onBranch,
  isPartial,
}: MessageProps) {
  const { actions } = useChatContext();
  const { setOpen } = useSidebar();
  const handleShowArtifact = (artifact: Artifact) => {
    actions.setCurrentArtifact(artifact);
    setOpen(false);
  };

  const displayText = cleanStreamingTextAsMessage(message.text);
  const parsedArtifact = parseArtifact(message.text);
  const isAfterEditPoint = editingMessageId !== null && index > editingMessageId;
  const isHuman = message.sender === Roles.HUMAN;

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(message.text);
    toast.success('Copied to clipboard');
  }, [message.text]);

  const handleEdit = useCallback(() => onEdit(index), [onEdit, index]);
  const handleRestart = useCallback(() => onRestart(index), [onRestart, index]);
  const handleBranch = useCallback(() => onBranch(index), [onBranch, index]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <article
          className={`flex mb-4 ${isHuman ? 'justify-end' : 'justify-start'}
            ${isAfterEditPoint ? 'opacity-50' : ''}`}
          data-role-type={isHuman ? 'human' : 'bot'}
        >
          <div
            className={`flex flex-col max-w-full items-${isHuman ? 'end' : 'start'} relative group
              ${isHuman ? 'sm:items-end' : 'sm:items-start'}`}
          >
            <Avatar
              className={`h-6 w-6 sm:h-8 sm:w-8 mb-2
              ${isHuman ? 'self-end' : 'self-start'}`}
            >
              <AvatarFallback>{isHuman ? <UserAvatar /> : <BotAvatar />}</AvatarFallback>
            </Avatar>
            {!!message?.attachments?.length && (
              <div className={`flex flex-wrap gap-2 mb-2`}>
                {message?.attachments?.map((attachment) => {
                  if (isFileImage(attachment.name)) {
                    return (
                      <img
                        className="max-h-[200px] object-cover rounded-lg shadow-sm"
                        key={attachment.name}
                        src={attachment.content}
                        alt={attachment.name}
                        style={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e9ecef',
                        }}
                      />
                    );
                  }
                  return <TextFilePreview key={attachment.name} filename={attachment.name} />;
                })}
              </div>
            )}
            <div className={`rounded-lg max-w-full ${isHuman ? 'bg-muted p-3' : 'bg-accentuated p-3'}`}>
              <div
                className={`
                  prose max-w-full break-words break-all
                  prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-semibold
                  prose-p:my-1 prose-p:leading-relaxed
                  prose-a:text-primary hover:prose-a:opacity-80
                  prose-ul:my-1 prose-ol:my-1 prose-li:my-0
                  prose-img:rounded-lg
                  dark:prose-invert`}
              >
                <MemoizedMarkdown text={displayText} />
                {isPartial && (
                  <div className="h-4 w-4 absolute top-2 left-2" data-testid="typing-indicator">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
            <ActionButtons
              isHuman={isHuman}
              onEdit={handleEdit}
              onRestart={handleRestart}
              onBranch={handleBranch}
              copyToClipboard={copyToClipboard}
              index={index}
            />
          </div>
        </article>
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
      {parsedArtifact.artifacts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {parsedArtifact.artifacts.map((artifact, idx) => (
            <ArtifactButton key={idx} artifact={artifact} onShowArtifact={handleShowArtifact} />
          ))}
        </div>
      )}
    </ContextMenu>
  );
});

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
