'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { downloadMermaidSvg, MermaidPreview } from './mermaid-preview';
import { Loading } from './loading';
import { ErrorBoundary } from './error-boundary';
import { ArtifactsProps, ARTIFACT_TYPES, ViewType } from './types';
import { X, Copy, Download, Code, Eye, AlertCircle } from 'lucide-react';
import { MarkdownPreview } from '@/components/artifacts/markdown-preview';
import { SvgPreview } from './svg-preview';
import { useTheme } from '@/contexts/theme-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { downloadTextFile, getLanguageExtension, sanitizeFilename } from '@/components/artifacts/utils';
import { useChatContext } from '@/contexts/chat-context';
import { showErrorToast } from '../../lib/error-utils';
import { FileError } from '../../lib/errors';
import type { editor } from 'monaco-editor';

export function Artifacts({ artifact, onChange }: ArtifactsProps) {
  const { actions, currentThreadId } = useChatContext();
  const { content, artifactType, title, codeLanguage } = artifact;
  const hasPreview =
    artifactType === ARTIFACT_TYPES.MERMAID ||
    artifactType === ARTIFACT_TYPES.MARKDOWN ||
    artifactType === ARTIFACT_TYPES.SVG;

  const [view, setView] = useState<ViewType>('code');
  const [currentCode, setCurrentCode] = useState<string>(content);
  const [error, setError] = useState<string>('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setCurrentCode(content);
    setView('code');
  }, [content]);

  useEffect(() => {
    // Cleanup function
    const ref = alertTimeoutRef; // Store ref in variable
    return () => {
      const timeout = ref.current;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

  const handleCodeChange = (value = '') => {
    setCurrentCode(value);
    onChange?.(value);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      toast.success('Code copied to clipboard');
    } catch (error) {
      showErrorToast(new FileError('Failed to copy code to clipboard'), currentThreadId);
    }
  };

  const handleDownload = () => {
    try {
      // For Mermaid in preview mode, use existing SVG download functionality
      if (view === 'preview' && artifactType === ARTIFACT_TYPES.MERMAID) {
        downloadMermaidSvg(currentCode, currentThreadId).then();
        return;
      }

      let fileExtension = 'txt'; // default extension

      if (artifactType === ARTIFACT_TYPES.MARKDOWN) {
        fileExtension = 'md';
      } else if (artifactType === ARTIFACT_TYPES.MERMAID && view === 'code') {
        fileExtension = 'mmd';
      } else if (artifactType === ARTIFACT_TYPES.SVG) {
        fileExtension = 'svg';
      } else if (artifactType === ARTIFACT_TYPES.CODE && codeLanguage) {
        fileExtension = getLanguageExtension(codeLanguage);
      }

      const safeFilename = sanitizeFilename(title || 'code');
      downloadTextFile(currentCode, safeFilename, fileExtension);
      toast.success('File downloaded successfully');
    } catch (error) {
      showErrorToast(new FileError('Failed to download file'), currentThreadId);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full relative">
        <div className="flex items-center justify-between p-2 border-b">
          <div className="font-medium truncate">{title || 'Untitled'}</div>

          <div className="flex items-center gap-2">
            {hasPreview && (
              <div className="flex rounded-full border p-0.5 gap-0.5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('preview')}
                  className={cn(
                    'h-7 rounded-full text-sm transition-all duration-200',
                    view === 'preview' ? 'bg-muted shadow-sm scale-105' : 'hover:bg-muted/50',
                  )}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('code')}
                  className={cn(
                    'h-7 rounded-full text-sm transition-all duration-200',
                    view === 'code' ? 'bg-muted shadow-sm scale-105' : 'hover:bg-muted/50',
                  )}
                >
                  <Code className="h-3.5 w-3.5 mr-1" />
                  Code
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => actions.setCurrentArtifact(null)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mx-2 mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 relative">
          {view === 'code' && (
            <>
              {!isEditorReady && <Loading />}
              <Editor
                height="100%"
                defaultLanguage={codeLanguage || 'text'}
                value={currentCode}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  renderValidationDecorations: 'off',
                }}
              />
            </>
          )}

          {view === 'preview' && artifactType === ARTIFACT_TYPES.MERMAID && (
            <MermaidPreview code={currentCode} theme={theme} onError={setError} />
          )}

          {view === 'preview' && artifactType === ARTIFACT_TYPES.MARKDOWN && (
            <MarkdownPreview code={currentCode} theme={theme} />
          )}

          {view === 'preview' && artifactType === ARTIFACT_TYPES.SVG && (
            <SvgPreview content={currentCode} theme={theme} onError={setError} />
          )}

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2 rounded-full border shadow-lg">
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="h-4 w-4 mr-1" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
