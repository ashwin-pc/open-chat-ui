import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageSquare, MoreHorizontal, SettingsIcon } from 'lucide-react';
import { useChat } from '@/contexts/chat-context';
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

export function SidePanel() {
  const { chatThreads, currentThreadId, actions } = useChat();
  const { toggleSidebar } = useSidebar();
  useHotkeys('toggle-sidebar', {
    key: 'cmd+\\',
    description: 'Toggle sidebar',
    scope: 'Global',
    callback: () => toggleSidebar(),
  });

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
        <SidebarGroup>
          <SidebarMenu>
            {chatThreads.map((thread) => (
              <SidebarMenuItem key={thread.id}>
                <SidebarMenuButton
                  isActive={currentThreadId === thread.id}
                  onClick={() => actions.switchThread(thread.id)}
                >
                  {thread.name}
                </SidebarMenuButton>
                {chatThreads.length > 1 && (
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
                          actions.deleteThread(thread.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Thread</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
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
          <Button variant="ghost" size="icon" onClick={() => {}}>
            <SettingsIcon className="w-6 h-6" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
