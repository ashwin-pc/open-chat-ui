import { ChatContextType } from '@/contexts/chat-context';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from '@/components/ui/sidebar';
import { MessageCircleDashed, MoreHorizontal, Pencil, Trash2, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThreadSummary } from '@/lib/types';
import { createShareUrl, isThreadShareable } from '@/lib/share-utils';
import { toast } from 'sonner';
import { db } from '@/lib/db';

interface ThreadGroupProps {
  title: string;
  threads: ThreadSummary[];
  currentThreadId: string;
  actions: ChatContextType['actions'];
  handleRename: (threadId: string, currentName: string) => void;
}

export function ThreadGroup({ title, threads, currentThreadId, actions, handleRename }: ThreadGroupProps) {
  if (threads.length === 0) return null;

  const handleShare = async (threadId: string) => {
    try {
      const thread = await db.threads.get(threadId);
      if (!thread) return;

      if (!isThreadShareable(thread)) {
        toast.error('This thread is too large to share via URL. Please export and share as a file instead.', {
          duration: 5000,
        });
        return;
      }

      const shareUrl = createShareUrl(thread);
      navigator.clipboard.writeText(shareUrl);
      toast.success('Thread link copied to clipboard');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          duration: 5000,
        });
      } else {
        toast.error('Failed to share thread', {
          duration: 5000,
        });
      }
    }
  };

  return (
    <div className="space-y-1">
      <div className="px-2 py-1.5">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
      </div>
      <SidebarMenu>
        {threads.map((thread) => (
          <SidebarMenuItem key={thread.id}>
            <SidebarMenuButton
              isActive={currentThreadId === thread.id}
              onClick={() => actions.switchThread(thread.id)}
            >
              {thread.isIncognitoThread ? <MessageCircleDashed /> : ''}
              <span>{thread.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction>
                  <MoreHorizontal />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(thread.id, thread.name);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span>Rename Thread</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(thread.id);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Thread</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.deleteThread(thread.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Thread</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
