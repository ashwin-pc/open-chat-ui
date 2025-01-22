import { ChatContextType } from '@/contexts/chat-context';
import { ChatThread } from "@/lib/types";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from '@/components/ui/sidebar';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThreadGroupProps {
    title: string;
    threads: ChatThread[];
    currentThreadId: string;
    actions: ChatContextType['actions'];
    handleRename: (threadId: string, currentName: string) => void;
}

export function ThreadGroup({
                                title,
                                threads,
                                currentThreadId,
                                actions,
                                handleRename
                            }: ThreadGroupProps) {
    if (threads.length === 0) return null;

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
                            {thread.name}
                        </SidebarMenuButton>
                        {threads && (
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
        </div>
    );
}