'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SidePanel } from './side-panel';
import { BranchSelector } from './branch-selector';
import { ChatLoading } from './chat-loading';
import { useChatApi } from '@/hooks/use-chat-api';
import { useChatContext } from '@/contexts/chat-context';
import { useMessageInput } from '@/hooks/use-message-input';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { BedrockModelNames, ChatApiInterface, Roles, SystemPrompt, ThreadSummary } from '@/lib/types';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { ThemeProvider } from '@/contexts/theme-context';
import { Toaster } from './ui/sonner';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import {
  MAX_FILE_SIZE,
  MAX_TOKENS_PER_FILE,
  parseFile,
  getTokenCount,
  isFileImage,
  MAX_IMAGE_SIZE,
} from '@/lib/utils/file';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizeable';
import { Artifacts } from '@/components/artifacts';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { DropOverlay } from './drop-overlay';

interface ChatAppProps {
  apiClient: ChatApiInterface;
  prompts?: SystemPrompt[];
}

export function ChatApp({ apiClient, prompts }: ChatAppProps) {
  const { settings, actions, threadSummaries, currentBranch, currentThread, currentThreadId, currentArtifact } =
    useChatContext();
  const [loaded, setLoaded] = useState(false);
  const {
    input,
    setInput,
    editingMessageId,
    setEditingMessageId,
    editingInputBackup,
    setEditingInputBackup,
    textareaRef,
  } = useMessageInput();
  const [isImmersive, setIsImmersive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isPolling,
    partialResponse,
    handleNewMessage,
    handleEditMessage,
    handleRestartFromMessage,
    handleAbort,
    pendingAttachments,
    setPendingAttachments,
  } = useChatApi({
    apiClient, // Pass the API client to the hook
    onUpdateMessages: (newMessages) => {
      actions.updateBranch(currentThreadId, currentThread.currentBranchId, {
        messages: newMessages,
      });
    },
  });

  const { isDragging, handleDragOver, handleDragEnter, handleDragLeave, handleDrop } = useDragDrop();

  const onFileDrop = async (files: FileList) => {
    const fileEvent = {
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await handleFileUpload(fileEvent);
  };

  useHotkeys('cancel-edit', {
    key: 'esc',
    description: 'Cancel edit',
    scope: 'Chat',
    callback: () => {
      if (editingMessageId) {
        handleCancelEdit();
      }
    },
  });

  useHotkeys('new-branch', {
    key: 'cmd+b',
    description: 'Create new branch',
    scope: 'Chat',
    callback: () => handleBranch(currentBranch.messages.length - 1),
  });

  useHotkeys('toggle-immersive', {
    key: 'cmd+i',
    description: 'Toggle immersive mode',
    scope: 'Chat',
    callback: () => setIsImmersive((prev) => !prev),
  });

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textareaRef]);

  const handleSend = async () => {
    if (input.trim()) {
      if (editingMessageId !== null) {
        await handleEditMessage(input, currentThread, editingMessageId);
        setEditingMessageId(null);
        setEditingInputBackup('');
      } else {
        if (currentBranch.messages.length === 0) {
          const title = input.split('\n')[0].slice(0, 25) + (input.length > 25 ? '...' : '');
          await actions.renameThread(currentThreadId, title);
        }
        await handleNewMessage(input, currentThread);
      }
      setInput('');
    }
  };

  const handleRestart = async (index: number) => {
    handleRestartFromMessage(currentThread, index);
  };

  const handleEdit = (index: number) => {
    const messageToEdit = currentBranch.messages[index];
    if (messageToEdit && messageToEdit.sender === Roles.HUMAN) {
      // Store the current input as backup in case of cancel
      setEditingInputBackup(input);
      setInput(messageToEdit.text);
      setEditingMessageId(index);
      setPendingAttachments(messageToEdit.attachments || []);
      textareaRef.current?.focus();
    }
  };

  const handleCancelEdit = () => {
    setInput(editingInputBackup);
    setEditingInputBackup('');
    setEditingMessageId(null);
  };

  const handleBranch = (index: number) => {
    const newMessages = currentBranch.messages.slice(0, index + 1);
    actions.createBranch(currentThreadId, newMessages, currentBranch.attachments);
    toast.success('Branch created');
  };

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive);
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    }, 0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const newFiles = Array.from(event.target.files);

    // Track total tokens across all files
    let totalTokens = 0;
    for (const attachment of pendingAttachments) {
      try {
        if (isFileImage(attachment.name)) {
          totalTokens += getTokenCount(attachment.content);
        }
      } catch (error) {
        console.error(`Error processing existing file ${attachment.name}:`, error);
      }
    }

    for (const file of newFiles) {
      try {
        const isImage = isFileImage(file.name);
        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

        if (file.size > maxSize) {
          toast.error(`${file.name} exceeds ${isImage ? '30' : '5'}MB limit`);
          return false;
        }

        const content = await parseFile(file);

        if (!isImage) {
          // Token check for individual file
          const fileTokens = getTokenCount(content);
          if (fileTokens > MAX_TOKENS_PER_FILE) {
            toast.error(`${file.name} exceeds token limit`);
            continue;
          }

          // Check combined token count
          if (totalTokens + fileTokens > MAX_TOKENS_PER_FILE) {
            toast.error('Adding this file would exceed total token limit');
            continue;
          }

          totalTokens += fileTokens;
        }

        setPendingAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            content,
          },
        ]);
        toast.success(`${file.name} added successfully`);
      } catch (error) {
        toast.error(`Error processing ${file.name}: ${error}`);
      }
    }
  };

  const handleRemoveAttachment = (fileName: string) => {
    setPendingAttachments((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleModelChange = (model: BedrockModelNames) => {
    actions.updateBranchModel(currentThreadId, currentThread.currentBranchId, model);
  };

  useEffect(() => {
    adjustTextareaHeight();
    window.addEventListener('resize', adjustTextareaHeight);

    return () => {
      window.removeEventListener('resize', adjustTextareaHeight);
    };
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (settings.isIncognitoMode) {
        const incognitoThreads = threadSummaries.filter((summary: ThreadSummary) => summary.isIncognitoThread);
        incognitoThreads.forEach((thread: ThreadSummary) => {
          actions.deleteThread(thread.id);
        });
        // Show closing confirmation only in incognito mode
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [actions, settings.isIncognitoMode, threadSummaries]);

  useEffect(() => {
    // Add this effect to handle ResizeObserver errors
    const resizeErrorHandler = (e: ErrorEvent) => {
      if (e.message.includes('ResizeObserver loop')) {
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', resizeErrorHandler);
    return () => window.removeEventListener('error', resizeErrorHandler);
  }, []);

  return (
    <ThemeProvider>
      <SidebarProvider>
        {!loaded ? (
          <ChatLoading />
        ) : (
          <>
            <SidePanel />
            <SidebarInset>
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel>
                  <div
                    data-testid="chat-container" // added selector for e2e tests
                    style={{
                      maxWidth: settings.enableMaxChatWidth ? '100%' : '800px',
                      margin: settings.enableMaxChatWidth ? undefined : '0 auto',
                      position: 'relative', // Add position relative for the overlay
                    }}
                    className="flex h-screen flex-col"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, onFileDrop)}
                  >
                    {/* Render drop overlay when dragging */}
                    {isDragging && <DropOverlay />}
                    <header className="flex items-center justify-between p-2 md:p-4 shrink-0">
                      <div className="flex items-center space-x-2 md:space-x-4">
                        <SidebarTrigger />
                        <h2 className="text-lg md:text-2xl font-bold truncate">{currentThread.name}</h2>
                      </div>
                      <div className="flex items-center space-x-2 md:space-x-4">
                        <BranchSelector
                          currentBranchId={currentThread.currentBranchId}
                          branches={currentThread.branches}
                          onBranchChange={(branchId) => actions.switchBranch(currentThreadId, branchId)}
                        />
                      </div>
                    </header>
                    <ScrollArea className="flex-grow flex flex-col p-2 md:p-4">
                      <MessageList
                        messages={currentBranch.messages}
                        editingMessageId={editingMessageId}
                        partialResponse={partialResponse}
                        isPolling={isPolling}
                        onRestart={handleRestart}
                        onEdit={handleEdit}
                        onBranch={handleBranch}
                        threadId={currentThread.id}
                      />
                    </ScrollArea>
                    <div className="flex flex-col">
                      <ChatInput
                        isImmersive={isImmersive}
                        toggleImmersive={toggleImmersive}
                        input={input}
                        setInput={setInput}
                        handleSend={handleSend}
                        isPolling={isPolling}
                        handleAbort={handleAbort}
                        editingMessageId={editingMessageId}
                        handleCancelEdit={handleCancelEdit}
                        textareaRef={textareaRef}
                        fileInputRef={fileInputRef}
                        handleFileUpload={handleFileUpload}
                        attachments={pendingAttachments}
                        removeAttachment={handleRemoveAttachment}
                        selectedModel={currentBranch.model || BedrockModelNames.CLAUDE_V3_5_SONNET_V2}
                        onModelChange={handleModelChange}
                      />
                    </div>
                  </div>
                </ResizablePanel>
                {currentArtifact && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel>
                      <Artifacts artifact={currentArtifact} />
                    </ResizablePanel>
                  </>
                )}
                {/* Enable the code below when artifacts are active */}
                {/* <ResizableHandle />
                <ResizablePanel>Placeholder for artifacts panel</ResizablePanel> */}
              </ResizablePanelGroup>
              <Toaster />
            </SidebarInset>
          </>
        )}
      </SidebarProvider>
    </ThemeProvider>
  );
}
