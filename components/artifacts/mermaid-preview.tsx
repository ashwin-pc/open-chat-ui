import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import svgPanZoom from 'svg-pan-zoom';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Loading } from './loading';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { showErrorToast } from '../../lib/error-utils';
import { FileError } from '../../lib/errors';

interface MermaidPreviewProps {
  code: string;
  theme: 'light' | 'dark';
  onError: (error: string) => void;
}

const MemoizedContainer = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="h-full w-full flex items-center justify-center">{children}</div>
));
MemoizedContainer.displayName = 'MemoizedContainer';

export const downloadMermaidSvg = async (code: string, threadId: string) => {
  try {
    const { svg: svgString } = await mermaid.render('mermaid-download-' + Date.now(), code);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Diagram downloaded successfully');
  } catch (error) {
    showErrorToast(
      new FileError('Failed to download diagram'),
      threadId
    );
  }
};

export function MermaidPreview({ code, theme, onError }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomInstanceRef = useRef<SvgPanZoom.Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        diagramPadding: 8,
      },
    });
  }, [theme]);

  const handleZoomIn = () => {
    panZoomInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    panZoomInstanceRef.current?.zoomOut();
  };

  const handleReset = () => {
    panZoomInstanceRef.current?.reset();
  };

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code.trim()) return;

      try {
        setLoading(true);
        setError(null);
        const id = 'mermaid-diagram-' + Date.now();
        const { svg } = await mermaid.render(id, code);

        if (!containerRef.current) return;
        containerRef.current.innerHTML = svg;

        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.maxHeight = 'calc(100vh - 200px)';
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

          if (panZoomInstanceRef.current) {
            panZoomInstanceRef.current.destroy();
          }

          panZoomInstanceRef.current = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.1,
            maxZoom: 10,
            zoomScaleSensitivity: 0.3,
          });
        }

        onError('');
      } catch (err) {
        const error = new FileError(err instanceof Error ? err.message : 'Failed to render diagram');
        setError(error.message);
        onError(error.message);

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } finally {
        setLoading(false);
      }
    };

    renderDiagram();

    return () => {
      if (panZoomInstanceRef.current) {
        panZoomInstanceRef.current.destroy();
        panZoomInstanceRef.current = null;
      }
    };
  }, [code, onError]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-background rounded-lg shadow-lg">
      <div className="p-2 border-b flex items-center gap-2">
        <button onClick={handleZoomIn} className="p-1.5 hover:bg-accent rounded-md" title="Zoom in">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={handleZoomOut} className="p-1.5 hover:bg-accent rounded-md" title="Zoom out">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={handleReset} className="p-1.5 hover:bg-accent rounded-md" title="Reset zoom">
          <RotateCcw className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-border mx-2" />
        <span className="text-sm text-muted-foreground">
          {Math.round((panZoomInstanceRef.current?.getZoom() || 1) * 100)}%
        </span>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        {loading && <Loading />}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <MemoizedContainer>
          <div ref={containerRef} className="h-full w-full" />
        </MemoizedContainer>
      </div>
    </div>
  );
}
