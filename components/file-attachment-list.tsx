import { X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { Progress } from './ui/progress';
import { getTokenCount } from '@/lib/utils/file';
import { Attachment } from '@/lib/types';

interface FileAttachmentListProps {
  attachments: Attachment[];
  onRemove: (fileName: string) => void;
  className?: string;
  onClear?: () => void;
}

interface AttachmentWithTokens extends Attachment {
  tokenCount?: number;
  progress?: number;
}

export function FileAttachmentList({ attachments, onRemove, className = '' }: FileAttachmentListProps) {
  const [attachmentsWithTokens, setAttachmentsWithTokens] = useState<AttachmentWithTokens[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    const processFiles = async () => {
      const processed = attachments.map((attachment) => {
        const attachmentWithTokens: AttachmentWithTokens = attachment;
        try {
          attachmentWithTokens.tokenCount = getTokenCount(attachment.content);
        } catch (error) {
          console.error(`Error processing file ${attachment.name}:`, error);
          attachmentWithTokens.tokenCount = 0;
        }
        return attachmentWithTokens;
      });

      setAttachmentsWithTokens(processed);
      setTotalTokens(processed.reduce((sum, file) => sum + (file.tokenCount || 0), 0));
    };

    processFiles();
  }, [attachments]);

  if (attachments.length === 0) return null;

  return (
    <div className={className}>
      <div className={`flex flex-wrap gap-2 mb-2`}>
        {attachmentsWithTokens.map((file, index) => (
          <div key={index} className="flex flex-col bg-muted rounded-lg p-2 text-sm w-[200px]">
            <div className="flex items-center justify-between">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(file.name)}
                className="h-6 w-6 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tokens: {file.tokenCount?.toLocaleString() || '...'}
            </div>
            {file.progress !== undefined && file.progress < 100 && (
              <Progress value={file.progress} className="h-1 mt-2" />
            )}
          </div>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        Total Tokens: {totalTokens.toLocaleString()}/160,000
        {totalTokens > 160000 && <span className="text-destructive ml-2">Token limit exceeded!</span>}
      </div>
    </div>
  );
}
