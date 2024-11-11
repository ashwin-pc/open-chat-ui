import { X } from 'lucide-react';
import { Button } from './ui/button';

interface FileAttachmentListProps {
  files: File[];
  onRemove: (fileName: string) => void;
  className?: string;
}

export function FileAttachmentList({ files, onRemove, className = '' }: FileAttachmentListProps) {
  if (files.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {files.map((file, index) => (
        <div key={index} className="flex items-center bg-muted text-xs rounded-full px-2 py-0.5">
          <span className="truncate max-w-[100px]">{file.name}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(file.name)}
            className="h-4 w-4 ml-1 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
