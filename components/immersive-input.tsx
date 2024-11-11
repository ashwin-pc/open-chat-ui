// components/ImmersiveInput.tsx
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Minimize2, Paperclip, X, Edit, Send } from 'lucide-react';
import { RefObject } from 'react';

interface ImmersiveInputProps {
  isImmersive: boolean;
  toggleImmersive: () => void;
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isPolling: boolean;
  handleAbort: () => void;
  editingMessageId: number | null;
  handleCancelEdit: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImmersiveInput({
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
}: ImmersiveInputProps) {
  return (
    <div
      className={`fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-300 ${
        isImmersive ? 'opacity-100 z-50' : 'opacity-0 -z-10'
      }`}
    >
      <div className="container mx-auto p-2 md:p-4 h-full flex flex-col">
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="icon" onClick={toggleImmersive} className="h-8 w-8">
            <Minimize2 className="h-4 w-4" />
            <span className="sr-only">Minimize</span>
          </Button>
        </div>
        <div className="relative flex-grow">
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
              isPolling ? 'Waiting for response...' : editingMessageId ? 'Edit your message...' : 'Type your message...'
            }
            className="absolute inset-0 resize-none h-full p-4"
            disabled={isPolling}
          />
          {isPolling && (
            <div className="absolute right-2 top-2">
              <LoadingSpinner />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-2">
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8">
            <Paperclip className="h-4 w-4" />
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
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
  );
}

// Extracted loading spinner component
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
