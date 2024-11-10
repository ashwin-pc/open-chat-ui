'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Edit, GitBranch, Maximize2, Minimize2, RotateCcw, Send, Plus, Trash2, PanelLeftOpen, PanelLeftClose, Paperclip, X } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "./theme-toggle"

interface Message {
  id: number
  content: string
  sender: 'user' | 'bot'
}

interface Branch {
  id: number
  name: string
  messages: Message[]
  attachments: File[]
  createdAt: Date
  description?: string
}

interface ChatThread {
  id: number
  name: string
  branches: Branch[]
  currentBranchId: number
}

export function EnhancedChatThreadManagerComponent() {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([
    {
      id: 1,
      name: 'New Chat',
      branches: [
        {
          id: 1,
          name: 'Main',
          messages: [],
          attachments: [],
          createdAt: new Date(),
          description: 'Initial conversation branch'
        }
      ],
      currentBranchId: 1
    }
  ])
  const [currentThreadId, setCurrentThreadId] = useState(1)
  const [input, setInput] = useState('')
  const [isImmersive, setIsImmersive] = useState(false)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingInputBackup, setEditingInputBackup] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentThread = chatThreads.find(t => t.id === currentThreadId) || chatThreads[0]
  const currentBranch = currentThread.branches.find(b => b.id === currentThread.currentBranchId) || currentThread.branches[0]

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])
  
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  const handleSend = () => {
    if (input.trim()) {
      if (editingMessageId) {
        // This is an edit submission
        const editIndex = currentBranch.messages.findIndex(m => m.id === editingMessageId)
        const newMessage: Message = { 
          id: editingMessageId,
          content: input, 
          sender: 'user',
        }
        
        // Keep messages up to the edit point and add the edited message
        const updatedMessages = [
          ...currentBranch.messages.slice(0, editIndex),
          newMessage
        ]
        
        updateBranch(currentThreadId, currentThread.currentBranchId, updatedMessages)
        
        // Reset edit state
        setEditingMessageId(null)
        setEditingInputBackup('')
        
        // Get bot response for the edited message
        setTimeout(() => {
          const botResponse = { 
            id: updatedMessages.length + 1, 
            content: "I'm a mock response to your edited message.", 
            sender: 'bot' as const 
          }
          updateBranch(
            currentThreadId, 
            currentThread.currentBranchId, 
            [...updatedMessages, botResponse]
          )
          scrollToBottom()
        }, 1000)
      } else {
        // This is a new message
        const newMessage: Message = { 
          id: currentBranch.messages.length + 1, 
          content: input, 
          sender: 'user',
        }
        
        const updatedMessages = [...currentBranch.messages, newMessage]
        updateBranch(currentThreadId, currentThread.currentBranchId, updatedMessages)

        // Update thread name if this is the first message
        if (currentBranch.messages.length === 0) {
          const title = input.split('\n')[0].slice(0, 30) + (input.length > 30 ? '...' : '');
          updateThread(currentThreadId, {
            ...currentThread,
            name: title
          })
        }
        
        // Get bot response
        setTimeout(() => {
          const botResponse = { 
            id: updatedMessages.length + 1, 
            content: "I'm a mock response from the chatbot.", 
            sender: 'bot' as const 
          }
          updateBranch(
            currentThreadId, 
            currentThread.currentBranchId, 
            [...updatedMessages, botResponse]
          )
          scrollToBottom()
        }, 1000)
      }
      
      setInput('')
    }
  }

  const handleRestart = (messageId: number) => {
    const newMessages = currentBranch.messages.slice(0, currentBranch.messages.findIndex(m => m.id === messageId) + 1)
    updateBranch(currentThreadId, currentThread.currentBranchId, newMessages)
  }

  const handleEdit = (messageId: number) => {
    const messageToEdit = currentBranch.messages.find(m => m.id === messageId)
    if (messageToEdit && messageToEdit.sender === 'user') {
      // Store the current input as backup in case of cancel
      setEditingInputBackup(input)
      setInput(messageToEdit.content)
      setEditingMessageId(messageId)
      textareaRef.current?.focus()
    }
  }
  
  const handleCancelEdit = () => {
    setInput(editingInputBackup)
    setEditingInputBackup('')
    setEditingMessageId(null)
  }

  const handleBranch = (messageId: number) => {
    const newBranchId = Math.max(...currentThread.branches.map(b => b.id)) + 1
    const newBranchName = `Branch ${newBranchId}`
    const newMessages = currentBranch.messages.slice(0, currentBranch.messages.findIndex(m => m.id === messageId) + 1)
    const newBranch: Branch = { 
      id: newBranchId, 
      name: newBranchName, 
      messages: newMessages,
      attachments: [...currentBranch.attachments],
      createdAt: new Date(),
      description: `Branched from message: "${newMessages[newMessages.length - 1].content.slice(0, 50)}..."`
    }
    updateThread(currentThreadId, {
      ...currentThread,
      branches: [...currentThread.branches, newBranch],
      currentBranchId: newBranchId
    })
  }

  const updateBranch = (threadId: number, branchId: number, newMessages: Message[]) => {
    setChatThreads(threads => threads.map(thread => 
      thread.id === threadId 
        ? {
            ...thread,
            branches: thread.branches.map(branch => 
              branch.id === branchId ? { ...branch, messages: newMessages } : branch
            )
          }
        : thread
    ))
    scrollToBottom()
  }

  const updateThread = (threadId: number, updatedThread: ChatThread) => {
    setChatThreads(threads => threads.map(thread => 
      thread.id === threadId ? updatedThread : thread
    ))
  }

  const createNewThread = () => {
    const newThreadId = Math.max(...chatThreads.map(t => t.id)) + 1
    const newThread: ChatThread = {
      id: newThreadId,
      name: 'New Chat',  // Changed to generic name
      branches: [
        {
          id: 1,
          name: 'Main',
          messages: [], // Changed to empty array
          attachments: [],
          createdAt: new Date(),
          description: 'Initial conversation branch'
        }
      ],
      currentBranchId: 1
    }
    setChatThreads([...chatThreads, newThread])
    setCurrentThreadId(newThreadId)
  }

  const deleteThread = (threadId: number) => {
    setChatThreads(threads => threads.filter(t => t.id !== threadId))
    if (currentThreadId === threadId) {
      setCurrentThreadId(chatThreads[0].id)
    }
  }

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive)
    setTimeout(() => {
      textareaRef.current?.focus()
      adjustTextareaHeight()
    }, 0)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newAttachments = Array.from(event.target.files)
      setChatThreads(threads => threads.map(thread => 
        thread.id === currentThreadId 
          ? {
              ...thread,
              branches: thread.branches.map(branch => 
                branch.id === thread.currentBranchId 
                  ? { ...branch, attachments: [...branch.attachments, ...newAttachments] }
                  : branch
              )
            }
          : thread
      ))
    }
  }

  const removeAttachment = (fileName: string) => {
    setChatThreads(threads => threads.map(thread => 
      thread.id === currentThreadId 
        ? {
            ...thread,
            branches: thread.branches.map(branch => 
              branch.id === thread.currentBranchId 
                ? { 
                    ...branch, 
                    attachments: branch.attachments.filter(file => file.name !== fileName) 
                  }
                : branch
            )
          }
        : thread
    ))
  }

  useEffect(() => {
    adjustTextareaHeight()
    window.addEventListener('resize', adjustTextareaHeight)

    return () => {
      window.removeEventListener('resize', adjustTextareaHeight)
    }
  }, [input, adjustTextareaHeight])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setIsSidePanelOpen(window.innerWidth >= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      <div className={`
        ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'fixed inset-y-0 z-50' : 'relative'} 
        bg-background border-r w-[280px] transition-transform duration-300
      `}>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Chat Threads</h2>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {chatThreads.map((thread) => (
              <div key={thread.id} className="flex items-center justify-between mb-2">
                <button
                  className={`text-left truncate flex-grow ${currentThreadId === thread.id ? 'font-bold' : ''}`}
                  onClick={() => setCurrentThreadId(thread.id)}
                >
                  {thread.name}
                </button>
                {chatThreads.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteThread(thread.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </ScrollArea>
          <Button className="w-full mt-4" onClick={createNewThread}>
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </div>
      </div>

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
              <Select
                value={currentThread.currentBranchId.toString()}
                onValueChange={(value) => updateThread(currentThreadId, { ...currentThread, currentBranchId: Number(value) })}
              >
                <SelectTrigger className="w-[200px] md:w-[250px]">
                  <SelectValue>
                    <div className="flex items-center space-x-2">
                      <GitBranch className="h-4 w-4" />
                      <span className="truncate">
                        {currentBranch.name}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currentThread.branches.map((branch) => (
                    <SelectItem 
                      key={branch.id} 
                      value={branch.id.toString()}
                      className="py-2"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <GitBranch className="h-4 w-4" />
                            <span className="font-medium">{branch.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(branch.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {branch.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {branch.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {branch.messages.length} messages
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {currentBranch.messages.map((message) => {
              const isAfterEditPoint = editingMessageId ? message.id > editingMessageId : false
              
              return (
                <ContextMenu key={message.id}>
                  <ContextMenuTrigger>
                    <div className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} 
                      ${isAfterEditPoint ? 'opacity-50' : ''}`}>
                      <div className={`flex items-start ${message.sender === 'user' ? 'space-x-reverse space-x-2 flex-row-reverse' : 'space-x-2'}`}>
                        <Avatar className="h-8 w-8">
                          {message.sender === 'user' ? (
                            <AvatarFallback><UserAvatar /></AvatarFallback>
                          ) : (
                            <AvatarFallback><BotAvatar /></AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`rounded-lg p-3 ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleRestart(message.id)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart from here
                    </ContextMenuItem>
                    {message.sender === 'user' && !editingMessageId && (
                      <ContextMenuItem onClick={() => handleEdit(message.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit message
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => handleBranch(message.id)}>
                      <GitBranch className="mr-2 h-4 w-4" />
                      Branch from here
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )
            })}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
        <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-300 ${isImmersive ? 'opacity-100 z-50' : 'opacity-0 -z-10'}`}>
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
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={editingMessageId ? "Edit your message..." : "Type your message..."}
                className="absolute inset-0 resize-none h-full p-4"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8">
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
              {editingMessageId && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCancelEdit}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleSend} size="icon" className="h-8 w-8">
                {editingMessageId ? <Edit className="h-4 w-4" /> : <Send className="h-4 w-4" />}
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
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={editingMessageId ? "Edit your message..." : "Type your message..."}
                  className="flex-grow resize-none pr-20 overflow-y-auto"
                  rows={1}
                  style={{ maxHeight: '20vh' }}
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
                  <Button onClick={handleSend} size="icon" className="h-8 w-8">
                    {editingMessageId ? <Edit className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const BotAvatar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-full w-full">
    <circle cx="20" cy="20" r="20" fill="#7C3AED"/>
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
    <circle cx="20" cy="20" r="20" fill="#2DD4BF"/>
    <polygon points="20,5 30,15 25,30 15,30 10,15" fill="#14B8A6"/>
    <circle cx="20" cy="18" r="7" fill="#5EEAD4"/>
    <rect x="15" y="16" width="10" height="4" rx="2" fill="#99F6E4"/>
    <circle cx="15" cy="15" r="2" fill="#CCFBF1"/>
    <circle cx="25" cy="15" r="2" fill="#CCFBF1"/>
    <path d="M15 22 Q20 25 25 22" stroke="#F0FDFA" fill="none" strokeWidth="1.5"/>
  </svg>
);