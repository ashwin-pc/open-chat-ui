import React, { useEffect, useRef, useState } from 'react';
import svgPanZoom from 'svg-pan-zoom';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Loading } from './loading';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SvgPreviewProps {
  content: string;
  theme: 'light' | 'dark';
  onError: (error: string) => void;
}

const MemoizedContainer = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="h-full w-full flex items-center justify-center">{children}</div>
));
MemoizedContainer.displayName = 'MemoizedContainer';

export function SvgPreview({ content, theme, onError }: SvgPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomInstanceRef = useRef<SvgPanZoom.Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const renderSvg = async () => {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // Check if content is valid SVG
        if (!content.trim().startsWith('<svg') && !content.includes('<svg')) {
          throw new Error('Invalid SVG content');
        }

        containerRef.current.innerHTML = content;

        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) {
          throw new Error('No SVG element found');
        }

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

        onError('');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to render SVG';
        setError(errorMessage);
        onError(errorMessage);

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } finally {
        setLoading(false);
      }
    };

    renderSvg();

    return () => {
      if (panZoomInstanceRef.current) {
        panZoomInstanceRef.current.destroy();
        panZoomInstanceRef.current = null;
      }
    };
  }, [content, onError]);

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
