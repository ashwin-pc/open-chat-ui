import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useHotkeys, useHotkeyList, hotkeyService } from './use-hotkeys';

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = jest.fn();
const originalConsoleWarn = console.warn;

describe('useHotkeys', () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    mockCallback = jest.fn();
    console.warn = mockConsoleWarn;
    // Clear any existing shortcuts
    hotkeyService['shortcuts'].clear();
    hotkeyService['listeners'] = [];
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    mockConsoleWarn.mockReset();
    // Clean up event listeners
    hotkeyService['shortcuts'].clear();
    hotkeyService['listeners'] = [];
  });

  describe('Registration and Cleanup', () => {
    it('should register hotkey on mount', () => {
      const { unmount } = renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      expect(hotkeyService.getShortcuts()).toHaveLength(1);
      expect(hotkeyService.getShortcuts()[0]).toEqual({
        key: 'k',
        description: 'Test hotkey',
        scope: 'Global',
        callback: mockCallback,
      });

      unmount();
    });

    it('should unregister hotkey on unmount', () => {
      const { unmount } = renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      expect(hotkeyService.getShortcuts()).toHaveLength(1);

      unmount();

      expect(hotkeyService.getShortcuts()).toHaveLength(0);
    });

    it('should update hotkey when props change', () => {
      let key = 'k';
      const { rerender } = renderHook(() =>
        useHotkeys('test-hotkey', {
          key,
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      expect(hotkeyService.getShortcuts()[0].key).toBe('k');

      key = 'j';
      rerender();

      expect(hotkeyService.getShortcuts()[0].key).toBe('j');
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should trigger callback on matching key press', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger callback on non-matching key press', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'j',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should prevent default when hotkey matches', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default when hotkey does not match', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      const event = new KeyboardEvent('keydown', {
        key: 'j',
        bubbles: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Modifier Key Combinations', () => {
    it('should handle cmd+key combination', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'cmd+k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle ctrl+key combination', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'ctrl+k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle shift+key combination', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'shift+k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          shiftKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle alt+key combination', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'alt+k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          altKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle complex modifier combinations', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'shift+cmd+k', // Order matters - should match the key combination generation
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          shiftKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger with incomplete modifier combination', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'cmd+k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      // Press 'k' without cmd
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Input Field Conflict Handling', () => {
    let inputElement: HTMLInputElement;
    let textareaElement: HTMLTextAreaElement;

    beforeEach(() => {
      // Create input elements for testing
      inputElement = document.createElement('input');
      textareaElement = document.createElement('textarea');
      document.body.appendChild(inputElement);
      document.body.appendChild(textareaElement);
    });

    afterEach(() => {
      document.body.removeChild(inputElement);
      document.body.removeChild(textareaElement);
    });

    it('should ignore single key when input is focused', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      inputElement.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should ignore single key when textarea is focused', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      textareaElement.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should allow modifier combinations even when input is focused', () => {
      renderHook(() =>
        useHotkeys('test-modifier-hotkey', {
          key: 'cmd+k',
          description: 'Test modifier hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      inputElement.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle contenteditable elements', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      const contentEditableDiv = document.createElement('div');
      contentEditableDiv.setAttribute('contenteditable', 'true');
      document.body.appendChild(contentEditableDiv);

      // Make the div focusable
      contentEditableDiv.tabIndex = -1;
      contentEditableDiv.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).not.toHaveBeenCalled();

      document.body.removeChild(contentEditableDiv);
    });

    it('should work normally when no input is focused', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'k',
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      // Focus body to ensure no input is focused
      document.body.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle uppercase and lowercase keys consistently', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'K', // Uppercase in config
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      // Should trigger with lowercase
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle special keys like Escape', () => {
      renderHook(() =>
        useHotkeys('test-hotkey', {
          key: 'escape', // Use lowercase to match the hook's key normalization
          description: 'Test hotkey',
          scope: 'Global',
          callback: mockCallback,
        }),
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Hotkeys', () => {
    it('should handle multiple hotkeys independently', () => {
      const mockCallback2 = jest.fn();

      renderHook(() => {
        useHotkeys('test-hotkey-1', {
          key: 'j',
          description: 'Test hotkey 1',
          scope: 'Global',
          callback: mockCallback,
        });

        useHotkeys('test-hotkey-2', {
          key: 'k',
          description: 'Test hotkey 2',
          scope: 'Global',
          callback: mockCallback2,
        });
      });

      // Trigger first hotkey
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'j',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback2).not.toHaveBeenCalled();

      // Trigger second hotkey
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useHotkeyList', () => {
  beforeEach(() => {
    // Clear any existing shortcuts
    hotkeyService['shortcuts'].clear();
    hotkeyService['listeners'] = [];
  });

  afterEach(() => {
    hotkeyService['shortcuts'].clear();
    hotkeyService['listeners'] = [];
  });

  it('should return empty list initially', () => {
    const { result } = renderHook(() => useHotkeyList());
    expect(result.current).toEqual([]);
  });

  it('should return registered shortcuts', () => {
    const mockCallback = jest.fn();

    // Setup the list hook first to listen for changes
    const { result } = renderHook(() => useHotkeyList());

    // Verify initially empty
    expect(result.current).toHaveLength(0);

    // Register a hotkey and it should be reflected in the list
    renderHook(() =>
      useHotkeys('test-hotkey', {
        key: 'k',
        description: 'Test hotkey',
        scope: 'Global',
        callback: mockCallback,
      }),
    );

    // Now the list should have the registered shortcut
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      key: 'k',
      description: 'Test hotkey',
      scope: 'Global',
      callback: mockCallback,
    });
  });

  it('should update when shortcuts are added or removed', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useHotkeyList());

    expect(result.current).toHaveLength(0);

    // Register a hotkey
    const { unmount } = renderHook(() =>
      useHotkeys('test-hotkey', {
        key: 'k',
        description: 'Test hotkey',
        scope: 'Global',
        callback: mockCallback,
      }),
    );

    expect(result.current).toHaveLength(1);

    // Unregister the hotkey
    unmount();

    expect(result.current).toHaveLength(0);
  });
});

describe('HotkeyService', () => {
  beforeEach(() => {
    hotkeyService['shortcuts'].clear();
    hotkeyService['listeners'] = [];
  });

  afterEach(() => {
    hotkeyService['shortcuts'].clear();
    hotkeyService['listeners'] = [];
  });

  it('should register and unregister shortcuts', () => {
    const mockCallback = jest.fn();
    const shortcut = {
      key: 'k',
      description: 'Test hotkey',
      scope: 'Global',
      callback: mockCallback,
    };

    hotkeyService.register('test-id', shortcut);
    expect(hotkeyService.getShortcuts()).toHaveLength(1);
    expect(hotkeyService.getShortcuts()[0]).toEqual(shortcut);

    hotkeyService.unregister('test-id');
    expect(hotkeyService.getShortcuts()).toHaveLength(0);
  });

  it('should notify listeners when shortcuts change', () => {
    const listener = jest.fn();
    const mockCallback = jest.fn();

    hotkeyService.subscribe(listener);

    const shortcut = {
      key: 'k',
      description: 'Test hotkey',
      scope: 'Global',
      callback: mockCallback,
    };

    hotkeyService.register('test-id', shortcut);
    expect(listener).toHaveBeenCalledWith([shortcut]);

    hotkeyService.unregister('test-id');
    expect(listener).toHaveBeenCalledWith([]);
  });

  it('should handle multiple listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const mockCallback = jest.fn();

    hotkeyService.subscribe(listener1);
    hotkeyService.subscribe(listener2);

    const shortcut = {
      key: 'k',
      description: 'Test hotkey',
      scope: 'Global',
      callback: mockCallback,
    };

    hotkeyService.register('test-id', shortcut);

    expect(listener1).toHaveBeenCalledWith([shortcut]);
    expect(listener2).toHaveBeenCalledWith([shortcut]);
  });

  it('should allow unsubscribing listeners', () => {
    const listener = jest.fn();
    const mockCallback = jest.fn();

    const unsubscribe = hotkeyService.subscribe(listener);
    unsubscribe();

    const shortcut = {
      key: 'k',
      description: 'Test hotkey',
      scope: 'Global',
      callback: mockCallback,
    };

    hotkeyService.register('test-id', shortcut);
    expect(listener).not.toHaveBeenCalled();
  });
});
