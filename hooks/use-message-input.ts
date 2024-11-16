import { useState, useRef } from 'react';
import { useHotkeys } from './use-hotkeys';

export function useMessageInput() {
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingInputBackup, setEditingInputBackup] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useHotkeys('focus-chat-input', {
    key: 'cmd+k',
    description: 'Focus chat input',
    scope: 'Global',
    callback: () => textareaRef.current?.focus(),
  });

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingInputBackup('');
    setInput('');
  };

  return {
    input,
    setInput,
    editingMessageId,
    setEditingMessageId,
    editingInputBackup,
    setEditingInputBackup,
    textareaRef,
    fileInputRef,
    handleCancelEdit,
  };
}
