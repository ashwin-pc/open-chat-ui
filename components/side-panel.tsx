import { memo, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, MessageCircleDashed, ArrowLeft, Search } from 'lucide-react';
import { useChatContext } from '@/contexts/chat-context';
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
import { Input } from '@/components/ui/input';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { ThemeToggle } from './theme-toggle';
import { ShortcutsDialog } from './shortcuts-dialog';
import { SettingsDialog } from './settings-dialog';
import { ThreadGroup } from './thread-group';
import { categorizeThreads } from '@/lib/utils/thread-utils';
import { record } from 'aws-amplify/analytics';
import { ThreadSummary } from '@/lib/types';

function SidePanelComponent() {
  const { threadSummaries, currentThreadId, actions, settings } = useChatContext();
  const { toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');

  useHotkeys('toggle-sidebar', {
    key: 'cmd+\\',
    description: 'Toggle sidebar',
    scope: 'Global',
    callback: () => toggleSidebar(),
  });

  useHotkeys('search', {
    key: 'cmd+k',
    description: 'Search conversations',
    scope: 'Global',
    callback: () => document.getElementById('search-conversations')?.focus(),
  });

  const handleRename = (threadId: string, currentName: string) => {
    const newName = window.prompt('Enter new thread name:', currentName);
    if (newName && newName.trim() !== '') {
      actions.renameThread(threadId, newName.trim());
    }
  };

  const goToLegacyUI = () => {
    record({ name: 'ClickedLegacyUI' });
    window.location.href = window.location.origin;
  };

  const filteredThreads = useMemo(() => {
    if (!threadSummaries || threadSummaries.length === 0) {
      return [];
    }

    if (!searchQuery.trim()) {
      return threadSummaries;
    }

    const query = searchQuery.toLowerCase();
    return threadSummaries.filter((thread: ThreadSummary) => {
      // Search in thread name
      if (thread.name.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    });
  }, [threadSummaries, searchQuery]);

  const categorized = useMemo(() => categorizeThreads(filteredThreads), [filteredThreads]);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
      <MessageSquare className="h-8 w-8 mb-2" />
      {searchQuery ? (
        <>
          <h3 className="font-medium mb-1">No matching conversations</h3>
          <p className="text-sm">Try different search terms</p>
        </>
      ) : (
        <>
          <h3 className="font-medium mb-1">No conversations yet</h3>
          <p className="text-sm">Start a new chat to begin</p>
        </>
      )}
    </div>
  );

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
                <span className="text-xs text-muted-foreground">
                  {filteredThreads.length} conversation{filteredThreads.length !== 1 ? 's' : ''}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Add search input */}
          <SidebarMenuItem className="px-2 py-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-conversations"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => {
                  const newQuery = e.target.value;
                  setSearchQuery(newQuery);
                  if (newQuery && !searchQuery) {
                    record({ name: 'SearchUsed' });
                  }
                }}
                className="pl-8 w-full"
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {filteredThreads.length === 0 ? (
          <EmptyState />
        ) : (
          <SidebarGroup className="space-y-2">
            {categorized.pinned.length > 0 && (
              <ThreadGroup
                title="Pinned"
                threads={categorized.pinned}
                currentThreadId={currentThreadId}
                actions={actions}
                handleRename={handleRename}
              />
            )}
            {categorized.today.length > 0 && (
              <ThreadGroup
                title="Today"
                threads={categorized.today}
                currentThreadId={currentThreadId}
                actions={actions}
                handleRename={handleRename}
              />
            )}
            {categorized.lastWeek.length > 0 && (
              <ThreadGroup
                title="Last 7 Days"
                threads={categorized.lastWeek}
                currentThreadId={currentThreadId}
                actions={actions}
                handleRename={handleRename}
              />
            )}
            {categorized.lastMonth.length > 0 && (
              <ThreadGroup
                title="Last 30 Days"
                threads={categorized.lastMonth}
                currentThreadId={currentThreadId}
                actions={actions}
                handleRename={handleRename}
              />
            )}
            {categorized.older.length > 0 && (
              <ThreadGroup
                title="Older"
                threads={categorized.older}
                currentThreadId={currentThreadId}
                actions={actions}
                handleRename={handleRename}
              />
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <Button className="w-full" variant="outline" onClick={() => actions.createThread()}>
          {settings.isIncognitoMode ? (
            <MessageCircleDashed className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {settings.isIncognitoMode ? 'New Incognito Chat' : 'New Chat'}
        </Button>

        <Button className="w-full" variant="secondary" onClick={goToLegacyUI}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Legacy UI
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

// Use memo to avoid unnecessary re-renders
export const SidePanel = memo(SidePanelComponent);
