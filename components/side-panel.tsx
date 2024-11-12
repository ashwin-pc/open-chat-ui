import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { useChat } from '@/app/contexts/chat-context';

interface SidePanelProps {
  isSidePanelOpen: boolean;
  isMobile: boolean;
}

export function SidePanel({ isSidePanelOpen, isMobile }: SidePanelProps) {
  const { chatThreads, currentThreadId, actions } = useChat();

  return (
    <div
      className={`
      ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isMobile ? 'fixed inset-y-0 z-50' : 'relative'} 
      bg-background border-r w-[280px] transition-transform duration-300
    `}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Chat Threads</h2>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {chatThreads.map((thread) => (
            <div key={thread.id} className="flex items-center justify-between mb-2">
              <button
                className={`text-left truncate flex-grow ${currentThreadId === thread.id ? 'font-bold' : ''}`}
                onClick={() => actions.switchThread(thread.id)}
              >
                {thread.name}
              </button>
              {chatThreads.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => actions.deleteThread(thread.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </ScrollArea>
        <Button className="w-full mt-4" onClick={actions.createThread}>
          <Plus className="h-4 w-4 mr-2" />
          New Thread
        </Button>
      </div>
    </div>
  );
}
