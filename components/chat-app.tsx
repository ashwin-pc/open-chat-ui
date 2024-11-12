'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ThemeToggle } from './theme-toggle';
import { SidePanel } from './side-panel';
import { BranchSelector } from './branch-selector';
import { useChatApi } from '@/app/hooks/use-chat-api';
import { useChat } from '@/app/contexts/chat-context';
import { useMessageInput } from '@/app/hooks/use-message-input';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';
import { useHotkeys } from '@/app/hooks/use-hotkeys';
import { ShortcutsDialog } from './shortcuts-dialog';
import { BedrockModelNames } from '@/lib/types';

export function ChatApp() {
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
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { isPolling, partialResponse, handleNewMessage, handleEditMessage, handleRestartFromMessage, handleAbort } =
    useChatApi({
      currentThreadId,
      onUpdateMessages: (newMessages) => {
        actions.updateBranch(currentThreadId, currentThread.currentBranchId, {
          messages: newMessages,
        });
        scrollToBottom();
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
    if (messageToEdit && messageToEdit.sender === 'Human') {
      // Store the current input as backup in case of cancel
      setEditingInputBackup(input);
      setInput(messageToEdit.text);
      setEditingMessageId(index);
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
  };

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive);
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    }, 0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newAttachments = Array.from(event.target.files);
      actions.addAttachments(currentThreadId, currentThread.currentBranchId, newAttachments);
    }
  };

  const handleRemoveAttachment = (fileName: string) => {
    actions.removeAttachment(currentThreadId, currentThread.currentBranchId, fileName);
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSidePanelOpen(window.innerWidth >= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen">
      {/* Mobile Overlay */}
      {isMobile && isSidePanelOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsSidePanelOpen(false)}
        />
      )}

      {/* Side Panel */}
      <SidePanel isSidePanelOpen={isSidePanelOpen} isMobile={isMobile} />

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col">
        <Card className="flex-grow overflow-hidden border-0 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-2 md:p-4 shrink-0">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="ghost" size="icon" onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}>
                {isSidePanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
              <h2 className="text-lg md:text-2xl font-bold truncate">{currentThread.name}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <ShortcutsDialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
              <ThemeToggle />
              <BranchSelector
                currentBranchId={currentThread.currentBranchId}
                branches={currentThread.branches}
                onBranchChange={(branchId) => actions.switchBranch(currentThreadId, branchId)}
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto grow">
            <MessageList
              messages={currentBranch.messages}
              editingMessageId={editingMessageId}
              partialResponse={partialResponse}
              isPolling={isPolling}
              onRestart={handleRestart}
              onEdit={handleEdit}
              onBranch={handleBranch}
              messagesEndRef={messagesEndRef}
              threadId={currentThread.id}
            />
          </CardContent>
        </Card>
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
          currentBranch={currentBranch}
          removeAttachment={handleRemoveAttachment}
          selectedModel={currentBranch.model || BedrockModelNames.CLAUDE_V3_5_SONNET_V2}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );
}
