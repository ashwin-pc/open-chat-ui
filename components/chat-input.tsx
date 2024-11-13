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
        {/* Hidden file input */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />

        {/* Controls - always visible */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
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
          </div>
          <Button variant="ghost" size="icon" onClick={toggleImmersive} className="h-8 w-8">
            {isImmersive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="sr-only">{isImmersive ? 'Minimize' : 'Maximize'}</span>
          </Button>
        </div>

        {/* Main content area */}
        <div className="relative flex-grow flex flex-col min-h-0">
          {/* File attachments area */}
          <FileAttachmentList files={currentBranch.attachments} onRemove={removeAttachment} className="mb-2" />

          {/* Textarea container */}
          <div className={`relative ${isImmersive ? 'flex-grow flex flex-col min-h-0' : 'flex-grow'}`}>
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
                isImmersive ? 'flex-grow resize-none p-4 h-full' : 'flex-grow resize-none pr-12'
              } min-h-[60px] overflow-y-auto`}
              rows={isImmersive ? undefined : 1}
              style={!isImmersive ? { maxHeight: '20vh' } : undefined}
              disabled={isPolling}
            />

            {/* Send/Edit/Abort button */}
            <div className="absolute right-2 bottom-2 flex space-x-2">
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
