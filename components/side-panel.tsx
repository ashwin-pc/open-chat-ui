import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageSquare, MoreHorizontal, SettingsIcon, Pencil } from 'lucide-react';
import { ChatContextType, useChatContext } from '@/contexts/chat-context';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  useSidebar,
  SidebarFooter,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { ThemeToggle } from './theme-toggle';
import { ShortcutsDialog } from './shortcuts-dialog';
import { SettingsDialog } from './settings-dialog';
import { ThreadGroup } from './thread-group';
import { format, isToday, isWithinInterval, subDays } from 'date-fns';
import { ChatThread } from '@/lib/types';
import { categorizeThreads } from '@/lib/utils/thread-utils';

export function SidePanel() {
  const { chatThreads, currentThreadId, actions } = useChatContext();
  const { toggleSidebar } = useSidebar();
  useHotkeys('toggle-sidebar', {
    key: 'cmd+\\',
    description: 'Toggle sidebar',
    scope: 'Global',
    callback: () => toggleSidebar(),
  });

  const handleRename = (threadId: string, currentName: string) => {
    const newName = window.prompt('Enter new thread name:', currentName);
    if (newName && newName.trim() !== '') {
      actions.renameThread(threadId, newName.trim());
    }
  };
  const categorized = categorizeThreads(chatThreads);
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <MessageSquare className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Chat Threads</span>
                <span className="text-xs text-muted-foreground">{chatThreads.length} conversations</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="space-y-2">
          <ThreadGroup
            title="Today"
            threads={categorized.today}
            currentThreadId={currentThreadId}
            actions={actions}
            handleRename={handleRename}
          />
          <ThreadGroup
            title="Last 7 Days"
            threads={categorized.lastWeek}
            currentThreadId={currentThreadId}
            actions={actions}
            handleRename={handleRename}
          />
          <ThreadGroup
            title="Last 30 Days"
            threads={categorized.lastMonth}
            currentThreadId={currentThreadId}
            actions={actions}
            handleRename={handleRename}
          />
          <ThreadGroup
            title="Older"
            threads={categorized.older}
            currentThreadId={currentThreadId}
            actions={actions}
            handleRename={handleRename}
          />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button className="w-full" variant="outline" onClick={actions.createThread}>
          <Plus className="h-4 w-4 mr-2" />
          New Thread
        </Button>

        <div className="grid grid-cols-3 gap-4 justify-items-center">
          <ShortcutsDialog />
          <ThemeToggle />
          <SettingsDialog />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
