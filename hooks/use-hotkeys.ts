// app/hooks/use-hotkeys.ts
import { useEffect, useState } from 'react';

export type Shortcut = {
  key: string;
  description: string;
  callback: () => void;
  scope?: string;
};

class HotkeyService {
  private shortcuts: Map<string, Shortcut> = new Map();
  private listeners: ((shortcuts: Shortcut[]) => void)[] = [];

  register(id: string, shortcut: Shortcut) {
    this.shortcuts.set(id, shortcut);
    this.notifyListeners();
  }

  unregister(id: string) {
    this.shortcuts.delete(id);
    this.notifyListeners();
  }

  getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  subscribe(listener: (shortcuts: Shortcut[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const shortcuts = this.getShortcuts();
    this.listeners.forEach((listener) => listener(shortcuts));
  }
}

export const hotkeyService = new HotkeyService();

// Helper function to check if hotkeys should be ignored when typing in input fields
function shouldIgnoreHotkey(event: KeyboardEvent): boolean {
  const activeElement = document.activeElement;
  
  if (!activeElement) return false;
  
  // Check if the active element is an input field
  const tagName = activeElement.tagName.toLowerCase();
  const isInputField = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
  
  // If not in an input field, don't ignore
  if (!isInputField && !isContentEditable) return false;
  
  // Allow hotkeys with modifier keys to work even in input fields
  const hasModifier = event.ctrlKey || event.altKey || event.metaKey;
  
  // Ignore single-key hotkeys when typing in input fields, but allow modifier combinations
  return !hasModifier;
}

export function useHotkeys(id: string, shortcut: Shortcut) {
  useEffect(() => {
    hotkeyService.register(id, shortcut);

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we should ignore this hotkey because user is typing in an input field
      if (shouldIgnoreHotkey(event)) {
        return;
      }

      const combo = [];

      if (event.ctrlKey) combo.push('ctrl');
      if (event.altKey) combo.push('alt');
      if (event.shiftKey) combo.push('shift');
      if (event.metaKey) combo.push('cmd');

      if (event.key !== 'Control' && event.key !== 'Meta' && event.key !== 'Shift' && event.key !== 'Alt') {
        combo.push(event.key.toLowerCase());
      }

      const pressedKey = combo.join('+');

      if (shortcut.key.toLowerCase() === pressedKey) {
        event.preventDefault();
        shortcut.callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      hotkeyService.unregister(id);
    };
  }, [id, shortcut]);
}

export function useHotkeyList() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    const unsubscribe = hotkeyService.subscribe(setShortcuts);
    return unsubscribe;
  }, []);

  return shortcuts;
}
