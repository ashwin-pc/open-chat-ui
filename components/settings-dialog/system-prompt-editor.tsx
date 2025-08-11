import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/contexts/chat-context';
import { SystemPrompt } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface SystemPromptEditorProps {
  promptId: string | null;
}

export function SystemPromptEditor({ promptId }: SystemPromptEditorProps) {
  const { systemPrompts, actions } = useChatContext();
  const prompt = systemPrompts.find((p) => p.id === promptId) || {
    id: promptId ?? uuidv4(),
    name: '',
    text: '',
    readonly: false,
  };
  const [editedPrompt, setEditedPrompt] = useState<SystemPrompt>(prompt);
  const isReadonly = prompt.readonly ?? false;

  useEffect(() => {
    if (!promptId) {
      setEditedPrompt({ id: uuidv4(), name: '', text: '' });
    } else if (promptId) {
      const prompt = systemPrompts.find((p) => p.id === promptId);
      if (prompt) {
        setEditedPrompt(prompt);
      }
    }
  }, [promptId, systemPrompts]);

  const handleSave = () => {
    if (!promptId) {
      actions.addSystemPrompt(editedPrompt);
    } else {
      actions.updateSystemPrompt(promptId, editedPrompt);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-0 flex justify-between items-center">
        <h2 className="text-base font-semibold">{!promptId ? 'Create New Prompt' : 'Edit Prompt'}</h2>
        {isReadonly && <Badge variant="secondary">Read-only</Badge>}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="prompt-name" className="text-sm">
              Name
            </Label>
            <Input
              id="prompt-name"
              value={editedPrompt.name}
              onChange={(e) => setEditedPrompt((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1"
              disabled={isReadonly}
            />
          </div>
          <div>
            <Label htmlFor="prompt-content" className="text-sm">
              Content
            </Label>
            <Textarea
              id="prompt-content"
              value={editedPrompt.text}
              onChange={(e) => setEditedPrompt((prev) => ({ ...prev, text: e.target.value }))}
              className="mt-1 min-h-[200px]"
              disabled={isReadonly}
            />
          </div>
        </div>
      </ScrollArea>
      {!isReadonly && (
        <div className="p-2 border-t">
          <Button onClick={handleSave} size="sm" className="w-full">
            {!promptId ? 'Create Prompt' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
