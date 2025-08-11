import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Check, Star, Trash, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatContext } from '@/contexts/chat-context';

interface SystemPromptsListProps {
  onSelectPrompt: (id: string | null) => void;
  selectedPromptId: string | null;
}

export function SystemPromptsList({ onSelectPrompt }: SystemPromptsListProps) {
  const { systemPrompts, currentThread, actions, defaultSystemPromptId } = useChatContext();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-2 border-b flex justify-between items-center sticky top-0 bg-background z-10">
        <h2 className="text-base font-semibold">System Prompts</h2>
        <Button variant="outline" size="sm" onClick={() => onSelectPrompt(null)}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>
      <ScrollArea className="flex-1 h-[calc(100%-41px)]">
        <div className="p-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {systemPrompts.map((prompt) => (
            <Card key={prompt.id} className="flex flex-col">
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center justify-between space-x-2">
                  <span className="truncate">{prompt.name}</span>
                  <div className="flex items-center space-x-1">
                    {prompt.id === currentThread.systemPromptId && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" title="Active" />
                    )}
                    {prompt.id === defaultSystemPromptId && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!prompt.readonly && (
                          <DropdownMenuItem onClick={() => onSelectPrompt(prompt.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => actions.selectSystemPrompt(prompt.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Set as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actions.setDefaultSystemPrompt(prompt.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                        {!prompt.readonly && (
                          <DropdownMenuItem onClick={() => actions.deleteSystemPrompt(prompt.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p
                  className="text-xs text-muted-foreground line-clamp-4 cursor-pointer"
                  onClick={() => onSelectPrompt(prompt.id)}
                >
                  {prompt.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
