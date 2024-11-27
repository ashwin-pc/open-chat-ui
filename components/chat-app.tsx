'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ThemeToggle } from './theme-toggle';
import { SidePanel } from './side-panel';
import { BranchSelector } from './branch-selector';
import { ChatLoading } from './chat-loading';
import { useChatApi } from '@/hooks/use-chat-api';
import { useChat } from '@/contexts/chat-context';
import { useMessageInput } from '@/hooks/use-message-input';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { ShortcutsDialog } from './shortcuts-dialog';
import { BedrockModelNames, ChatApiInterface, Roles } from '@/lib/types';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { ThemeProvider } from '@/contexts/theme-context';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { MAX_FILE_SIZE, MAX_TOKENS_PER_FILE, parseFile, getTokenCount } from '@/lib/utils/file';
import { Menu, SettingsIcon } from 'lucide-react';
import { Button } from './ui/button';
import { MobileMenu } from './moble-menu';

interface ChatAppProps {
  apiClient: ChatApiInterface;
}

export function ChatApp({ apiClient }: ChatAppProps) {
  const [loaded, setLoaded] = useState(false);
  const { currentBranch, currentThread, actions, currentThreadId } = useChat();
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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    currentThreadId,
    apiClient, // Pass the API client to the hook
    onUpdateMessages: (newMessages) => {
      actions.updateBranch(currentThreadId, currentThread.currentBranchId, {
        messages: newMessages,
      });
    },
  });

  useHotkeys('shortcuts-dialog', {
    key: 'cmd+/',
    description: 'Toggle shortcuts dialog',
    scope: 'Global',
    callback: () => setIsShortcutsOpen((prev) => !prev),
  });

  useHotkeys('send-message', {
    key: 'cmd+enter',
    description: 'Send message',
    scope: 'Chat',
    callback: () => {
      if (input?.trim() && !isPolling) {
        handleSend();
      }
    },
  });

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
  }, []);

  const handleSend = async () => {
    if (input.trim()) {
      if (editingMessageId !== null) {
        await handleEditMessage(input, currentBranch.messages, editingMessageId);
        setEditingMessageId(null);
        setEditingInputBackup('');
      } else {
        if (currentBranch.messages.length === 0) {
          const title = input.split('\n')[0].slice(0, 30) + (input.length > 30 ? '...' : '');
          actions.updateThread(currentThreadId, {
            name: title,
          });
        }
        await handleNewMessage(
          input,
          currentBranch.messages,
          currentBranch.model || BedrockModelNames.CLAUDE_V3_5_SONNET_V2,
        );
      }
      setInput('');
    }
  };

  const handleRestart = async (index: number) => {
    handleRestartFromMessage(currentBranch.messages, index);
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
        totalTokens += getTokenCount(attachment.content);
      } catch (error) {
        console.error(`Error processing existing file ${attachment.name}:`, error);
      }
    }

    for (const file of newFiles) {
      try {
        // Size check
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }

        const content = await parseFile(file);

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
        setPendingAttachments((prev) => [...prev, { name: file.name, content }]);
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

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const openSettings = () => {}; // TODO

  useEffect(() => {
    adjustTextareaHeight();
    window.addEventListener('resize', adjustTextareaHeight);

    return () => {
      window.removeEventListener('resize', adjustTextareaHeight);
    };
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    setLoaded(true);
    return () => {};
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
              <div className="flex h-screen flex-col">
                {/* Main Chat Area */}
                <header className="flex items-center justify-between p-2 md:p-4 shrink-0">
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <SidebarTrigger />
                    <h2 className="text-lg md:text-2xl font-bold truncate">{currentThread.name}</h2>
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Mobile view */}
                    <div className="flex md:hidden">
                      <Button variant="ghost" size="icon" onClick={openMobileMenu}>
                        <Menu className="w-6 h-6" />
                      </Button>
                    </div>
                    {/* Desktop view */}
                    <div className="hidden md:flex items-center space-x-2 md:space-x-4">
                      <BranchSelector
                        currentBranchId={currentThread.currentBranchId}
                        branches={currentThread.branches}
                        onBranchChange={(branchId) => actions.switchBranch(currentThreadId, branchId)}
                      />
                      <ShortcutsDialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
                      <ThemeToggle />
                      <Button variant="ghost" size="icon" onClick={openSettings}>
                        <SettingsIcon className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                </header>
                {/* Mobile menu */}
                <MobileMenu
                  isOpen={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                  currentThread={currentThread}
                  currentThreadId={currentThreadId}
                  actions={actions}
                  setIsShortcutsOpen={setIsShortcutsOpen}
                  openSettings={openSettings}
                />
                <div className="flex-grow flex flex-col p-2 md:p-4">
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
                </div>
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
              <Toaster />
            </SidebarInset>
          </>
        )}
      </SidebarProvider>
    </ThemeProvider>
  );
}
