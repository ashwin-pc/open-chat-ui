import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Square, RotateCcw, AlertTriangle } from 'lucide-react';
import { Loading } from './loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createReactAppHtml } from './utils';

interface ReactAppPreviewProps {
  content: string;
  theme: 'light' | 'dark';
  onError: (error: string) => void;
}

const MemoizedContainer = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="h-full w-full flex flex-col">{children}</div>
));
MemoizedContainer.displayName = 'MemoizedContainer';

export function ReactAppPreview({ content, theme, onError }: ReactAppPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  const handleRun = useCallback(() => {
    if (!iframeRef.current) return;

    setLoading(true);
    setError(null);
    setConsoleOutput([]);
    setIsRunning(true);

    const sandboxHtml = createReactAppHtml(content, theme, {
      includeConsoleLogging: true,
      includePostMessage: true,
    });
    const blob = new Blob([sandboxHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    iframeRef.current.src = url;

    // Cleanup URL after a short delay to allow iframe to load
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }, [content, theme]);

  const handleStop = () => {
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
    setIsRunning(false);
    setError(null);
    setConsoleOutput([]);
  };

  const handleReset = () => {
    handleStop();
    setTimeout(() => {
      handleRun();
    }, 100);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const { type, message, level } = event.data;

      switch (type) {
        case 'ready':
          setLoading(false);
          setError(null);
          onError('');
          break;
        case 'error':
          setLoading(false);
          setError(message);
          onError(message);
          break;
        case 'console':
          setConsoleOutput((prev) => [...prev, `[${level}] ${message}`]);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

  useEffect(() => {
    // Auto-run on content change
    handleRun();
  }, [handleRun]);

  return (
    <div className="h-full w-full flex flex-col bg-background rounded-lg shadow-lg">
      <div className="p-2 border-b flex items-center gap-2">
        <button
          onClick={isRunning ? handleStop : handleRun}
          className="p-1.5 hover:bg-accent rounded-md flex items-center gap-1"
          title={isRunning ? 'Stop' : 'Run'}
        >
          {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="text-sm">{isRunning ? 'Stop' : 'Run'}</span>
        </button>
        <button onClick={handleReset} className="p-1.5 hover:bg-accent rounded-md" title="Reset">
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-6 w-px bg-border mx-2" />
        <span className="text-sm text-muted-foreground">{isRunning ? 'Running' : 'Stopped'}</span>
        {consoleOutput.length > 0 && (
          <>
            <div className="h-6 w-px bg-border mx-2" />
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {consoleOutput.length} console message{consoleOutput.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {loading && (
          <div className="p-4">
            <Loading />
          </div>
        )}

        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <MemoizedContainer>
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title="React App Preview"
            />
          </div>

          {consoleOutput.length > 0 && (
            <div className="h-32 border-t bg-muted/30 p-2 overflow-y-auto">
              <div className="text-xs font-mono space-y-1">
                {consoleOutput.map((output, index) => (
                  <div key={index} className="text-muted-foreground">
                    {output}
                  </div>
                ))}
              </div>
            </div>
          )}
        </MemoizedContainer>
      </div>
    </div>
  );
}
