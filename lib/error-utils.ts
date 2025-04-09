import { toast } from 'sonner';
import { toChatError } from './errors';
import { logError } from './console-utils';

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
    logs
  };

  toast.error(errorMessage, {
    duration: Infinity, // Toast stays until dismissed
    action: {
      label: 'Report',
      onClick: () => {
        navigator.clipboard.writeText(JSON.stringify(report, null, 2));
        toast.success('Error report copied to clipboard');
      },
    },
    closeButton: true, // Show explicit close button
  });
};