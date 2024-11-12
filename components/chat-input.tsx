import { Minimize2, Paperclip, Maximize2, X, Edit, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileAttachmentList } from './file-attachment-list';
import { Branch, BedrockModelNames, BedrockModelDisplayNames } from '@/lib/types';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ChatInputProps {
  isImmersive: boolean;
  toggleImmersive: () => void;
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isPolling: boolean;
  handleAbort: () => void;
  editingMessageId: number | null;
  handleCancelEdit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentBranch: Branch;
  removeAttachment: (filename: string) => void;
  selectedModel: BedrockModelNames;
  onModelChange: (model: BedrockModelNames) => void;
}

export function ChatInput({
  isImmersive,
  toggleImmersive,
  input,
  setInput,
  handleSend,
  isPolling,
  handleAbort,
  editingMessageId,
  handleCancelEdit,
  textareaRef,
  fileInputRef,
  handleFileUpload,
  currentBranch,
  removeAttachment,
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  const containerClassName = isImmersive
    ? 'fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-300 opacity-100 z-50'
    : 'bg-background relative before:absolute before:inset-x-0 before:top-[-20px] before:h-[20px] before:bg-gradient-to-b before:from-transparent before:to-background before:z-10';

  useEffect(() => {
    const timeout = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, [textareaRef]);

  return (
    <div className={containerClassName}>
      <div className="container mx-auto p-2 md:p-4 h-full flex flex-col">
        {/* Top bar with minimize button */}
        {isImmersive && (
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="icon" onClick={toggleImmersive} className="h-8 w-8">
              <Minimize2 className="h-4 w-4" />
              <span className="sr-only">Minimize</span>
            </Button>
          </div>
        )}

        {/* Main content area */}
        <div className={`relative flex-grow flex flex-col`}>
          {/* File attachments area */}
          <FileAttachmentList files={currentBranch.attachments} onRemove={removeAttachment} className="mb-2" />

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isPolling) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isPolling
                ? 'Waiting for response...'
                : editingMessageId
                ? 'Edit your message...'
                : `Type your message${currentBranch.attachments.length > 0 ? ' with attachments' : ''}...`
            }
            className={`${
              isImmersive
                ? 'flex-grow resize-none p-4 mb-2 max-h-[calc(100vh-8rem)] overflow-y-auto'
                : 'flex-grow resize-none pr-20 overflow-y-auto'
            } min-h-[60px]`}
            rows={isImmersive ? undefined : 1}
            style={!isImmersive ? { maxHeight: '20vh' } : undefined}
            disabled={isPolling}
          />

          {/* Model selector and actions container */}
          <div className={`flex items-center justify-between ${isImmersive ? 'mt-2' : 'absolute right-2 bottom-2'}`}>
            <Select value={selectedModel} onValueChange={(value: BedrockModelNames) => onModelChange(value)}>
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Select model">{BedrockModelDisplayNames[selectedModel]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BedrockModelDisplayNames).map(([model, displayName]) => (
                  <SelectItem key={model} value={model}>
                    {displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                {currentBranch.attachments.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {currentBranch.attachments.length}
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />

              {!isImmersive && (
                <Button variant="ghost" size="icon" onClick={toggleImmersive} className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}

              {editingMessageId && (
                <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}

              <Button
                onClick={isPolling ? handleAbort : handleSend}
                size="icon"
                className="h-8 w-8"
                variant={isPolling ? 'destructive' : 'default'}
              >
                {isPolling ? (
                  <X className="h-4 w-4" />
                ) : editingMessageId ? (
                  <Edit className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
