import { useState, useRef } from 'react';

export function useMessageInput() {
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingInputBackup, setEditingInputBackup] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
