'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Edit,
  GitBranch,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  PanelLeftOpen,
  PanelLeftClose,
  Paperclip,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { ThemeToggle } from './theme-toggle';
import { Branch, ChatThread, Message } from '../lib/types';
import { SidePanel } from './side-panel';
import { BranchSelector } from './branch-selector';
import { useChatApi } from '@/app/hooks/use-chat-api';
import { useChat } from '@/app/contexts/chat-context';
import { useMessageInput } from '@/app/hooks/use-message-input';

export function ChatApp() {
  const { currentBranch, currentThread, setChatThreads, currentThreadId } = useChat();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { isPolling, partialResponse, handleNewMessage, handleEditMessage, handleRestartFromMessage, handleAbort } =
    useChatApi({
      currentThreadId,
      onUpdateMessages: (newMessages) => {
        updateBranch(currentThreadId, currentThread.currentBranchId, newMessages);
        scrollToBottom();
      },
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
          updateThread(currentThreadId, {
            ...currentThread,
            name: title,
          });
        }
        await handleNewMessage(input, currentBranch.messages);
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
    const newBranchId = Math.max(...currentThread.branches.map((b) => b.id)) + 1;
    const newBranchName = `Branch ${newBranchId}`;
    const newMessages = currentBranch.messages.slice(0, index + 1);
    const newBranch: Branch = {
      id: newBranchId,
      name: newBranchName,
      messages: newMessages,
      attachments: [...currentBranch.attachments],
      createdAt: new Date(),
      description: `Branched from message: "${newMessages[newMessages.length - 1].text.slice(0, 50)}..."`,
    };
    updateThread(currentThreadId, {
      ...currentThread,
      branches: [...currentThread.branches, newBranch],
      currentBranchId: newBranchId,
    });
  };

  const updateBranch = (threadId: number, branchId: number, newMessages: Message[]) => {
    setChatThreads((threads) =>
      threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              branches: thread.branches.map((branch) =>
                branch.id === branchId ? { ...branch, messages: newMessages } : branch,
              ),
            }
          : thread,
      ),
    );
    scrollToBottom();
  };

  const updateThread = (threadId: number, updatedThread: ChatThread) => {
    setChatThreads((threads) => threads.map((thread) => (thread.id === threadId ? updatedThread : thread)));
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
      setChatThreads((threads) =>
        threads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                branches: thread.branches.map((branch) =>
                  branch.id === thread.currentBranchId
                    ? { ...branch, attachments: [...branch.attachments, ...newAttachments] }
                    : branch,
                ),
              }
            : thread,
        ),
      );
    }
  };

  const removeAttachment = (fileName: string) => {
    setChatThreads((threads) =>
      threads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              branches: thread.branches.map((branch) =>
                branch.id === thread.currentBranchId
                  ? {
                      ...branch,
                      attachments: branch.attachments.filter((file) => file.name !== fileName),
                    }
                  : branch,
              ),
            }
          : thread,
      ),
    );
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
        <Card className="flex-grow overflow-hidden border-0">
          <CardHeader className="flex flex-row items-center justify-between p-2 md:p-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="ghost" size="icon" onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}>
                {isSidePanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
              <h2 className="text-lg md:text-2xl font-bold truncate">{currentThread.name}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <BranchSelector
                currentBranchId={currentThread.currentBranchId}
                branches={currentThread.branches}
                onBranchChange={(branchId) =>
                  updateThread(currentThreadId, { ...currentThread, currentBranchId: branchId })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
            {currentBranch.attachments.length > 0 && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Conversation Attachments:</h3>
                <div className="flex flex-wrap gap-2">
                  {currentBranch.attachments.map((file, index) => (
                    <div key={index} className="flex items-center bg-background rounded-full px-3 py-1">
                      <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(file.name)}
                        className="h-6 w-6 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {currentBranch.messages.map((message, index) => {
              const isAfterEditPoint = editingMessageId !== null ? index > editingMessageId : false;

              return (
                <ContextMenu key={index}>
                  <ContextMenuTrigger>
                    <div
                      className={`flex mb-4 ${message.sender === 'Human' ? 'justify-end' : 'justify-start'} 
                      ${isAfterEditPoint ? 'opacity-50' : ''}`}
                    >
                      <div
                        className={`flex items-start ${
                          message.sender === 'Human' ? 'space-x-reverse space-x-2 flex-row-reverse' : 'space-x-2'
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          {message.sender === 'Human' ? (
                            <AvatarFallback>
                              <UserAvatar />
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback>
                              <BotAvatar />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 ${
                            message.sender === 'Human' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleRestart(index)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart from here
                    </ContextMenuItem>
                    {message.sender === 'Human' && editingMessageId === null && (
                      <ContextMenuItem onClick={() => handleEdit(index)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit message
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => handleBranch(index)}>
                      <GitBranch className="mr-2 h-4 w-4" />
                      Branch from here
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
            {/* Show partial response if available */}
            {partialResponse && (
              <div className="flex justify-start mb-4 relative group">
                <div className="flex items-start space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <BotAvatar />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="whitespace-pre-wrap">{partialResponse}</p>
                    <div className="h-4 w-4 absolute bottom-2 right-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show typing indicator only when waiting and no partial response */}
            {isPolling && !partialResponse && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <BotAvatar />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
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
                  isPolling
                    ? 'Waiting for response...'
                    : editingMessageId
                    ? 'Edit your message...'
                    : 'Type your message...'
                }
                className="absolute inset-0 resize-none h-full p-4"
                disabled={isPolling}
              />
              {isPolling && (
                <div className="absolute right-2 top-2">
                  <svg
                    className="animate-spin h-5 w-5 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
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

        {/* Non-immersive input area */}
        {!isImmersive && (
          <div className="bg-background">
            <div className="container mx-auto p-2 md:p-4">
              <div className="relative flex">
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
                  placeholder={editingMessageId ? 'Edit your message...' : 'Type your message...'}
                  className="flex-grow resize-none pr-20 overflow-y-auto"
                  rows={1}
                  style={{ maxHeight: '20vh' }}
                  disabled={isPolling}
                />
                <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleImmersive} className="h-8 w-8">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
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
          </div>
        )}
      </div>
    </div>
  );
}

const BotAvatar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-full w-full">
    <circle cx="20" cy="20" r="20" fill="#7C3AED" />
    <path d="M10 15 L20 10 L30 15 L30 25 L20 30 L10 25Z" fill="#A78BFA" />
    <circle cx="20" cy="20" r="6" fill="#C4B5FD" />
    <path d="M17 18 L23 18 L20 22Z" fill="#7C3AED" />
    <circle cx="16" cy="17" r="2" fill="#EDE9FE" />
    <circle cx="24" cy="17" r="2" fill="#EDE9FE" />
    <path d="M15 24 Q20 28 25 24" stroke="#DDD6FE" fill="none" strokeWidth="1.5" />
  </svg>
);

const UserAvatar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-full w-full">
    <circle cx="20" cy="20" r="20" fill="#2DD4BF" />
    <polygon points="20,5 30,15 25,30 15,30 10,15" fill="#14B8A6" />
    <circle cx="20" cy="18" r="7" fill="#5EEAD4" />
    <rect x="15" y="16" width="10" height="4" rx="2" fill="#99F6E4" />
    <circle cx="15" cy="15" r="2" fill="#CCFBF1" />
    <circle cx="25" cy="15" r="2" fill="#CCFBF1" />
    <path d="M15 22 Q20 25 25 22" stroke="#F0FDFA" fill="none" strokeWidth="1.5" />
  </svg>
);
