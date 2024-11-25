import { Minimize2, Paperclip, Maximize2, X, Edit, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileAttachmentList } from './file-attachment-list';
import { Branch, BedrockModelNames, BedrockModelDisplayNames } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface ChatInputProps {
  isImmersive: boolean;
  toggleImmersive: () => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
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

  // Add constant for text length threshold (e.g., 5000 characters)
  const TEXT_LENGTH_THRESHOLD = 5000;

  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [fileName, setFileName] = useState('pasted-content.txt');

  // Handle paste event
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');

    if (pastedText.length > TEXT_LENGTH_THRESHOLD) {
      e.preventDefault();
      setPastedContent(pastedText);
      setShowPasteDialog(true);
    }
  };

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
              onPaste={handlePaste}
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
      <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Large Text Detected</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Would you like to paste this as text or save it as a file? ({(pastedContent.length / 1000).toFixed(1)}KB)
            </p>
            <p className="text-sm text-muted-foreground ">
              It will be added to the begining of this message in the conversation with the file name like <br />
              <pre className="">
                {`<file name="`}
                {fileName}
                {`">
  {content}
</file>`}
              </pre>
            </p>
            <div className="space-y-2">
              <Input placeholder="File name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setInput((prev) => prev + pastedContent);
                setShowPasteDialog(false);
                toast.success('Content pasted as text');
              }}
            >
              Paste as Text
            </Button>
            <Button
              onClick={() => {
                const file = new File([pastedContent], fileName, {
                  type: 'text/plain',
                });
                const fakeEvent = {
                  target: { files: [file] },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileUpload(fakeEvent);
                setShowPasteDialog(false);
                toast.success('File created successfully');
              }}
            >
              Save as File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
