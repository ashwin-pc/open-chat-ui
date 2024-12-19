'use client';

import React, { useState } from 'react';
import { SystemPromptsList } from './system-prompts-list';
import { SystemPromptEditor } from './system-prompt-editor';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useChat } from '@/contexts/chat-context';

export function SystemPromptsManager() {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {showCreatePrompt ? (
        <>
          <div className="p-2 border-b">
            <Button variant="ghost" size="sm" onClick={() => setShowCreatePrompt(false)} className="h-8">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
          <SystemPromptEditor promptId={selectedPromptId} />
        </>
      ) : (
        <SystemPromptsList
          onSelectPrompt={(id) => {
            setSelectedPromptId(id);
            setShowCreatePrompt(true);
          }}
          selectedPromptId={selectedPromptId}
        />
      )}
    </div>
  );
}
