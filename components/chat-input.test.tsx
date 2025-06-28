import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './chat-input';
import { useChatContext } from '@/contexts/chat-context';
import { BedrockModelNames, CreativityLevel } from '@/lib/types';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the chat context
jest.mock('@/contexts/chat-context');
const mockUseChatContext = useChatContext as jest.MockedFunction<typeof useChatContext>;

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

describe('ChatInput Token Counter', () => {
  const mockCalculateTokens = jest.fn();
  const mockActions = {
    calculateTokens: mockCalculateTokens,
    updateSettings: jest.fn(),
    createThread: jest.fn(),
    toggleThreadPin: jest.fn(),
    updateThread: jest.fn(),
    deleteThread: jest.fn(),
    renameThread: jest.fn(),
    switchThread: jest.fn(),
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
    createBranch: jest.fn(),
    switchBranch: jest.fn(),
    deleteBranch: jest.fn(),
    addAttachments: jest.fn(),
    removeAttachment: jest.fn(),
    addSystemPrompt: jest.fn(),
    updateSystemPrompt: jest.fn(),
    deleteSystemPrompt: jest.fn(),
    selectSystemPrompt: jest.fn(),
    deleteEntireChatHistory: jest.fn(),
    createThreadFromShared: jest.fn(),
    updateBranch: jest.fn(),
    updateBranchModel: jest.fn(),
    setDefaultSystemPrompt: jest.fn(),
    setCurrentArtifact: jest.fn(),
  };

  // Helper function to render with TooltipProvider
  const renderWithTooltip = (component: React.ReactElement) => {
    const view = render(<TooltipProvider>{component}</TooltipProvider>);

    // Override rerender to wrap with TooltipProvider
    const { rerender: originalRerender, ...rest } = view;
    const wrappedRerender = (newComponent: React.ReactElement) => {
      return originalRerender(<TooltipProvider>{newComponent}</TooltipProvider>);
    };

    return { ...rest, rerender: wrappedRerender };
  };

  const defaultProps = {
    isImmersive: false,
    toggleImmersive: jest.fn(),
    input: '',
    setInput: jest.fn(),
    handleSend: jest.fn(),
    isPolling: false,
    handleAbort: jest.fn(),
    editingMessageId: null,
    handleCancelEdit: jest.fn(),
    textareaRef: { current: null },
    fileInputRef: { current: null },
    handleFileUpload: jest.fn(),
    attachments: [],
    removeAttachment: jest.fn(),
    selectedModel: BedrockModelNames.CLAUDE_V3_5_SONNET_V2,
    onModelChange: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Default mock context
    mockUseChatContext.mockReturnValue({
      settings: {
        cmdToSend: false,
        isIncognitoMode: false,
        largeTextPasteDetection: false,
        enableMaxChatWidth: true,
        useArtifacts: false,
        showTokenCounter: false,
      },
      tokenCounts: {
        conversationTokens: 100,
        currentInputTokens: 50,
        totalTokens: 150,
      },
      actions: mockActions,
      creativityLevel: CreativityLevel.PRECISE,
      setCreativityLevel: jest.fn(),
      currentArtifact: null,
      threadSummaries: [],
      currentThreadId: 'test-thread',
      currentThread: null as unknown as any,
      currentBranch: null as unknown as any,
      systemPrompts: [],
      defaultSystemPromptId: '',
      currentSystemPrompt: { id: '', name: '', text: '' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Token Counter Visibility', () => {
    it('should not show token counter when setting is disabled', () => {
      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: false,
        },
      });

      renderWithTooltip(<ChatInput {...defaultProps} />);

      expect(screen.queryByText(/Conversation:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Current:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
    });

    it('should show token counter when setting is enabled', () => {
      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: true,
        },
      });

      renderWithTooltip(<ChatInput {...defaultProps} />);

      expect(screen.getByText(/Conversation: 100/)).toBeInTheDocument();
      expect(screen.getByText(/Current: 50/)).toBeInTheDocument();
      expect(screen.getByText(/Total: 150/)).toBeInTheDocument();
    });
  });

  describe('Token Calculation Behavior', () => {
    it('should not calculate tokens when setting is disabled', () => {
      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: false,
        },
      });

      renderWithTooltip(<ChatInput {...defaultProps} />);

      // No token calculations should be triggered
      expect(mockCalculateTokens).not.toHaveBeenCalled();
    });

    it('should calculate tokens when setting is enabled', async () => {
      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: true,
        },
      });

      renderWithTooltip(<ChatInput {...defaultProps} />);

      // Should trigger token calculation on mount when setting is enabled
      await waitFor(() => {
        expect(mockCalculateTokens).toHaveBeenCalled();
      });
    });
  });

  describe('Debounced Token Calculation', () => {
    it('should debounce token calculations when typing', async () => {
      const setInputMock = jest.fn();
      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: true,
        },
      });

      renderWithTooltip(<ChatInput {...defaultProps} setInput={setInputMock} />);

      const textarea = screen.getByRole('textbox');

      // Clear initial calls
      mockCalculateTokens.mockClear();

      // Type multiple characters quickly
      userEvent.type(textarea, 'Hello');

      // Should not have calculated tokens yet (within debounce period)
      expect(mockCalculateTokens).not.toHaveBeenCalled();

      // Advance time by debounce delay (300ms)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now should have calculated tokens once
      await waitFor(() => {
        expect(mockCalculateTokens).toHaveBeenCalledTimes(1);
      });
    });

    it('should calculate tokens immediately on input changes (current behavior)', async () => {
      let currentInput = '';
      const setInputMock = jest.fn((value) => {
        currentInput = value;
      });

      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: true,
        },
      });

      const { rerender } = renderWithTooltip(
        <ChatInput {...defaultProps} input={currentInput} setInput={setInputMock} />,
      );

      const textarea = screen.getByRole('textbox');

      // Wait for initial mount calculations to complete
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Clear initial calls after mount
      mockCalculateTokens.mockClear();

      // Type first character and update the input prop
      userEvent.type(textarea, 'H');
      currentInput = 'H';
      rerender(<ChatInput {...defaultProps} input={currentInput} setInput={setInputMock} />);

      // Should have calculated immediately due to attachments useEffect
      expect(mockCalculateTokens).toHaveBeenCalledTimes(1);
      expect(mockCalculateTokens).toHaveBeenCalledWith('H', []);

      mockCalculateTokens.mockClear();

      // Type another character and update the input prop
      userEvent.type(textarea, 'e');
      currentInput = 'He';
      rerender(<ChatInput {...defaultProps} input={currentInput} setInput={setInputMock} />);

      // Should have calculated immediately again
      expect(mockCalculateTokens).toHaveBeenCalledTimes(1);
      expect(mockCalculateTokens).toHaveBeenCalledWith('He', []);
    });

    it('should not debounce token calculations when setting is disabled', async () => {
      const setInputMock = jest.fn();
      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: false,
        },
      });

      renderWithTooltip(<ChatInput {...defaultProps} setInput={setInputMock} />);

      const textarea = screen.getByRole('textbox');

      // Type characters
      userEvent.type(textarea, 'Hello');

      // Advance time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should never calculate tokens
      expect(mockCalculateTokens).not.toHaveBeenCalled();
    });
  });

  describe('Attachment Token Calculation', () => {
    it('should calculate tokens immediately when attachments change and setting is enabled', async () => {
      const mockAttachments = [{ id: '1', name: 'test.txt', content: 'test content' }];

      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: true,
        },
      });

      const { rerender } = renderWithTooltip(<ChatInput {...defaultProps} attachments={[]} />);

      // Clear initial calls
      mockCalculateTokens.mockClear();

      // Update with attachments
      rerender(<ChatInput {...defaultProps} attachments={mockAttachments} />);

      // Should calculate immediately (no debounce for attachments)
      await waitFor(() => {
        expect(mockCalculateTokens).toHaveBeenCalled();
      });
    });

    it('should not calculate tokens for attachments when setting is disabled', async () => {
      const mockAttachments = [{ id: '1', name: 'test.txt', content: 'test content' }];

      mockUseChatContext.mockReturnValue({
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: false,
        },
      });

      const { rerender } = renderWithTooltip(<ChatInput {...defaultProps} attachments={[]} />);

      // Clear initial calls
      mockCalculateTokens.mockClear();

      // Update with attachments
      rerender(<ChatInput {...defaultProps} attachments={mockAttachments} />);

      // Should not calculate tokens
      expect(mockCalculateTokens).not.toHaveBeenCalled();
    });
  });

  describe('Setting Toggle', () => {
    it('should start calculating tokens when setting is enabled', async () => {
      // Initially disabled
      const mockContext = {
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: false,
        },
      };

      mockUseChatContext.mockReturnValue(mockContext);

      const { rerender } = renderWithTooltip(<ChatInput {...defaultProps} />);

      expect(mockCalculateTokens).not.toHaveBeenCalled();

      // Enable the setting
      const enabledContext = {
        ...mockContext,
        settings: {
          ...mockContext.settings,
          showTokenCounter: true,
        },
      };

      mockUseChatContext.mockReturnValue(enabledContext);
      rerender(<ChatInput {...defaultProps} />);

      // Should now calculate tokens
      await waitFor(() => {
        expect(mockCalculateTokens).toHaveBeenCalled();
      });
    });

    it('should stop calculating tokens when setting is disabled', async () => {
      // Initially enabled
      const mockContext = {
        ...mockUseChatContext(),
        settings: {
          ...mockUseChatContext().settings,
          showTokenCounter: true,
        },
      };

      mockUseChatContext.mockReturnValue(mockContext);

      const { rerender } = renderWithTooltip(<ChatInput {...defaultProps} />);

      // Clear initial calls
      mockCalculateTokens.mockClear();

      // Disable the setting
      const disabledContext = {
        ...mockContext,
        settings: {
          ...mockContext.settings,
          showTokenCounter: false,
        },
      };

      mockUseChatContext.mockReturnValue(disabledContext);
      rerender(<ChatInput {...defaultProps} setInput={jest.fn()} />);

      const textarea = screen.getByRole('textbox');

      // Type something
      userEvent.type(textarea, 'Test');

      // Advance time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not calculate tokens after disabling
      expect(mockCalculateTokens).not.toHaveBeenCalled();
    });
  });
});
