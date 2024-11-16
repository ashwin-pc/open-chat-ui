import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { useHotkeys } from '@/hooks/use-hotkeys';

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
                  {chatThreads.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.deleteThread(thread.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </SidebarMenuButton>
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
      </SidebarFooter>
    </Sidebar>
  );
}
