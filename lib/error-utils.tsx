import { toast } from 'sonner';
import { APIError, ChatError, NetworkError, toChatError } from './errors';
import { logError } from './console-utils';
import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

interface ErrorReport {
  conversationId: string;
  timestamp: string;
  error: string;
  errorType: string;
  errorCode?: string;
  stack?: string;
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
}

export const showErrorToast = (error: unknown, conversationId: string) => {
  const chatError = toChatError(error);
  const timestamp = new Date().toISOString();

  // Log error to console and get logs
  const { errorMessage, stack, logs } = logError(chatError, conversationId);

  const report: ErrorReport = {
    conversationId,
    timestamp,
    error: errorMessage,
    errorType: chatError.name,
    errorCode: chatError.code,
    stack,
    logs,
  };

  const shouldPersist =
    chatError instanceof NetworkError || chatError instanceof APIError || chatError instanceof ChatError;

  // Get actions from the error object - using any due to dynamic error types
  const errorActions: ErrorAction[] = (error as any)?.actions || [];

  // Use JSX for custom toast layout
  toast.custom((t) => (
    <div className="flex flex-col rounded-lg border bg-background shadow-lg relative">
      {/* Close button (X) in the top right corner */}
      <button 
        className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted" 
        onClick={() => toast.dismiss(t)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Error icon and title */}
      <div className="flex items-center gap-2 p-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <h3 className="text-base font-semibold">{chatError.name || 'Error'}</h3>
      </div>
      
      {/* Error message with proper formatting */}
      <div className="whitespace-pre-line text-sm p-2 text-muted-foreground bg-secondary">
        {errorMessage}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end gap-2 p-2">
        {/* Render all action buttons */}
        {errorActions.map((action, index) => {
          // Determine button style based on variant
          const buttonClass = action.variant === 'default' ? 
              "rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90" :
            action.variant === 'secondary' ? 
              "rounded-md bg-muted px-4 py-2 text-sm hover:bg-muted/80" :
            action.variant === 'ghost' ?
              "rounded-md px-4 py-2 text-sm hover:bg-muted" :
            // Default to outline variant
              "rounded-md border px-4 py-2 text-sm hover:bg-muted";
              
          return (
            <button
              key={`action-${index}`}
              className={buttonClass}
              onClick={() => {
                action.action();
                toast.dismiss(t);
              }}
            >
              {action.label}
            </button>
          );
        })}
        
        {/* Report button is always present */}
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(report, null, 2));
            toast.success('Error report copied to clipboard');
          }}
        >
          Report
        </button>
      </div>
    </div>
  ), {
    duration: shouldPersist ? Infinity : 2000,
  });
};
