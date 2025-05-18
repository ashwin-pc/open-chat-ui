import { renderHook, act, waitFor } from '@testing-library/react';
import { useThreadStorage } from './use-thread-storage';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Message, Roles } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';

// Mock uuid to return predictable values
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock the database
jest.mock('../lib/db', () => ({
  db: {
    threads: {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    },
    threadSummaries: {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      toArray: jest.fn(),
      count: jest.fn(),
      clear: jest.fn(),
    },
    systemPrompts: {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      toArray: jest.fn(),
    },
  },
}));

jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn(),
}));

describe('useThreadStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mocked responses
    (useLiveQuery as jest.Mock).mockImplementation((queryFn) => {
      if (queryFn.toString().includes('threadSummaries.toArray')) {
        return [];
      }
      if (queryFn.toString().includes('systemPrompts.toArray')) {
        return [];
      }
      if (queryFn.toString().includes('threads.get')) {
        return null;
      }
      return undefined;
    });
    // Set up default mocked responses
    (db.threadSummaries.toArray as jest.Mock).mockResolvedValue([]);
    (db.threadSummaries.count as jest.Mock).mockResolvedValue(0);
    (db.systemPrompts.toArray as jest.Mock).mockResolvedValue([]);
    (uuidv4 as jest.Mock).mockReturnValue('test-uuid');
  });

  it('should initialize with empty thread when no threads exist', async () => {
    const { result } = renderHook(() => useThreadStorage({}));

    // Initial state should have empty arrays
    expect(result.current.threadSummaries).toEqual([]);

    // Wait for initialization effects
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify database calls
    expect(db.systemPrompts.toArray).toHaveBeenCalled();
    expect(db.threadSummaries.count).toHaveBeenCalled();
    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid',
        name: 'New Chat',
        branches: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: 'Main',
            messages: [],
          }),
        ]),
      }),
    );
  });

  it('should create a new thread', async () => {
    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.createThread();
    });

    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid',
        name: 'New Chat',
      }),
    );
    expect(db.threadSummaries.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid',
        name: 'New Chat',
        isIncognitoThread: false,
      }),
    );
  });

  it('should update an existing thread', async () => {
    // Mock existing thread
    const existingThread = {
      id: 'existing-id',
      name: 'Original Name',
      branches: [
        {
          id: 1,
          name: 'Main',
          messages: [],
          attachments: [],
          createdAt: new Date(),
          description: 'Initial conversation branch',
        },
      ],
      currentBranchId: 1,
    };
    (db.threads.get as jest.Mock).mockResolvedValue(existingThread);

    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.updateThread({
        id: 'existing-id',
        name: 'Updated Name',
      });
    });

    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'existing-id',
        name: 'Updated Name',
      }),
    );
  });

  it('should delete a thread', async () => {
    const threadId = 'thread-to-delete';
    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.deleteThread(threadId);
    });

    expect(db.threads.delete).toHaveBeenCalledWith(threadId);
    expect(db.threadSummaries.delete).toHaveBeenCalledWith(threadId);
  });

  it('should handle system prompts', async () => {
    const newPrompt = {
      id: 'test-prompt',
      name: 'Test Prompt',
      text: 'This is a test prompt',
    };

    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.addSystemPrompt(newPrompt);
    });

    expect(db.systemPrompts.put).toHaveBeenCalledWith(newPrompt);
  });

  it('should create a new branch', async () => {
    const threadId = 'test-thread';
    const messages: Message[] = [{ text: 'Hello', sender: Roles.HUMAN }];
    const attachments = [new File(['test'], 'test.txt')];

    // Mock existing thread
    (db.threads.get as jest.Mock).mockResolvedValue({
      id: threadId,
      branches: [{ id: 1, messages: [], attachments: [] }],
      currentBranchId: 1,
    });

    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.createBranch(threadId, messages, attachments);
    });

    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: threadId,
        branches: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({
            id: 2,
            messages,
            attachments,
          }),
        ]),
        currentBranchId: 2,
      }),
    );
  });

  it('should switch between branches', async () => {
    const threadId = 'test-thread';
    const thread = {
      id: threadId,
      branches: [
        { id: 1, messages: [] },
        { id: 2, messages: [] },
      ],
      currentBranchId: 1,
    };
    (db.threads.get as jest.Mock).mockResolvedValue(thread);

    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.switchBranch(threadId, 2);
    });

    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: threadId,
        currentBranchId: 2,
      }),
    );
  });

  it('should handle file attachments', async () => {
    const threadId = 'test-thread';
    const branchId = 1;
    const newFile = new File(['test'], 'test.txt');

    const thread = {
      id: threadId,
      branches: [{ id: branchId, messages: [], attachments: [] }],
      currentBranchId: branchId,
    };
    (db.threads.get as jest.Mock).mockResolvedValue(thread);

    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.addAttachments(threadId, branchId, [newFile]);
    });

    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        branches: [
          expect.objectContaining({
            id: branchId,
            attachments: [newFile],
          }),
        ],
      }),
    );

    // Test attachment removal
    await act(async () => {
      await result.current.actions.removeAttachment(threadId, branchId, 'test.txt');
    });

    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        branches: [
          expect.objectContaining({
            id: branchId,
            attachments: [],
          }),
        ],
      }),
    );
  });

  it('should clear all chat history', async () => {
    const { result } = renderHook(() => useThreadStorage({}));

    await act(async () => {
      await result.current.actions.deleteEntireChatHistory();
    });

    expect(db.threads.clear).toHaveBeenCalled();
    expect(db.threadSummaries.clear).toHaveBeenCalled();
    expect(db.threads.put).toHaveBeenCalled(); // Should create a new empty thread
  });

  it('should handle incognito mode', async () => {
    const { result } = renderHook(() => useThreadStorage({ isIncognito: true }));

    await act(async () => {
      await result.current.actions.createThread();
    });

    expect(db.threadSummaries.put).toHaveBeenCalledWith(
      expect.objectContaining({
        isIncognitoThread: true,
      }),
    );
  });

  it('should update system prompt for a thread', async () => {
    const threadId = 'test-uuid';
    const promptId = 'new-prompt';

    // Mock an existing thread
    const existingThread = {
      id: threadId,
      name: 'New Chat',
      branches: [
        {
          id: 1,
          name: 'Main',
          messages: [],
          attachments: [],
          createdAt: new Date(),
          description: 'Initial conversation branch',
        },
      ],
      currentBranchId: 1,
    };

    // Set up mocks
    (db.threads.get as jest.Mock).mockResolvedValue(existingThread);
    (db.threadSummaries.toArray as jest.Mock).mockResolvedValue([
      { id: threadId, name: 'New Chat', lastUpdated: new Date() },
    ]);
    (db.threadSummaries.count as jest.Mock).mockResolvedValue(1);
    // Mock useLiveQuery
    (useLiveQuery as jest.Mock).mockImplementation((queryFn) => {
      if (queryFn.toString().includes('threadSummaries.toArray')) {
        return [{ id: threadId, name: 'New Chat', lastUpdated: new Date() }];
      }
      if (queryFn.toString().includes('systemPrompts.toArray')) {
        return [{ id: 'default', name: 'Default Prompt', text: 'You are a helpful assistant.' }];
      }
      if (queryFn.toString().includes('threads.get')) {
        return existingThread;
      }
      return undefined;
    });

    const { result } = renderHook(() => useThreadStorage({}));

    // Manually set the current thread using the action
    await act(async () => {
      result.current.actions.switchThread(threadId);
    });

    // Use waitFor to wait until currentThreadId is updated
    await waitFor(() => expect(result.current.currentThreadId).toBe(threadId), { timeout: 1000 });

    // Now perform the system prompt update
    await act(async () => {
      await result.current.actions.selectSystemPrompt(promptId);
    });

    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: threadId,
        systemPromptId: promptId,
      }),
    );
  });

  it('should handle concurrent thread creation', async () => {
    const { result } = renderHook(() => useThreadStorage({}));

    // Attempt to create multiple threads simultaneously
    await act(async () => {
      const promises = [
        result.current.actions.createThread(),
        result.current.actions.createThread(),
        result.current.actions.createThread(),
      ];
      await Promise.all(promises);
    });

    // Should only create one thread due to the isCreatingThreadRef lock
    expect(db.threads.put).toHaveBeenCalledTimes(1);
  });

  it('should set lastUpdated to current time on thread update', async () => {
    const existingThread = {
      id: 'test-thread',
      name: 'Old Name',
      branches: [
        {
          id: 1,
          name: 'Main',
          messages: [],
          attachments: [],
          createdAt: new Date('2000-01-01'),
          description: 'Initial conversation branch',
        },
      ],
      currentBranchId: 1,
    };
    const oldSummary = {
      id: 'test-thread',
      name: 'Old Name',
      lastUpdated: new Date('2000-01-01'),
      isIncognitoThread: false,
    };

    (db.threadSummaries.toArray as jest.Mock).mockResolvedValue([
      { id: 'test-thread', name: 'Old Name', lastUpdated: new Date('2000-01-01') },
    ]);
    (db.threads.get as jest.Mock).mockResolvedValue(existingThread);
    (db.threadSummaries.get as jest.Mock).mockResolvedValue(oldSummary);

    const { result } = renderHook(() => useThreadStorage({ threadId: existingThread.id }));

    await act(async () => {
      await result.current.actions.updateThread({ id: 'test-thread', name: 'Updated Name' });
    });

    // Capture the summary passed to db.threadSummaries.put
    const putCalls = (db.threadSummaries.put as jest.Mock).mock.calls;
    const lastCallArg = putCalls[putCalls.length - 1][0];
    expect(lastCallArg.name).toBe('Updated Name');
    expect(new Date().getTime() - new Date(lastCallArg.lastUpdated).getTime()).toBeLessThan(1000);
  });

  it('should not create new thread if empty thread already exists during createThread', async () => {
    // Mock an existing empty thread
    const existingEmptyThread = {
      id: 'existing-empty-thread',
      name: 'New Chat',
      branches: [
        {
          id: 1,
          name: 'Main',
          messages: [],
          attachments: [],
          createdAt: new Date(),
          description: 'Initial conversation branch',
        },
      ],
      currentBranchId: 1,
    };

    // Mock thread summaries to have one thread
    (db.threadSummaries.toArray as jest.Mock).mockResolvedValue([
      {
        id: 'existing-empty-thread',
        name: 'New Chat',
        lastUpdated: new Date(),
        isIncognitoThread: false,
      },
    ]);

    // Mock thread count to be 1
    (db.threadSummaries.count as jest.Mock).mockResolvedValue(1);

    // Mock threads.get to return our existing empty thread
    (db.threads.get as jest.Mock).mockImplementation((threadId) => {
      if (threadId === 'existing-empty-thread') {
        return Promise.resolve(existingEmptyThread);
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useThreadStorage({}));

    // Clear mocks to ensure we only track new calls after setup
    jest.clearAllMocks();

    // Try to create a new thread
    await act(async () => {
      await result.current.actions.createThread();
    });

    // Verify that no new thread was created
    expect(db.threads.put).not.toHaveBeenCalled();

    // Verify that switchThread was called with the existing empty thread's ID
    expect(db.threads.get).toHaveBeenCalledWith('existing-empty-thread');
  });

  it('should create new thread when threadId does not exist during initialization', async () => {
    // Mock thread count to be 0 initially
    (db.threadSummaries.count as jest.Mock).mockResolvedValue(0);
    // Mock that thread doesn't exist in DB
    (db.threads.get as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() =>
      useThreadStorage({
        threadId: 'non-existent-thread-id',
      }),
    );

    // Wait for initialization
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify a new thread was created
    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid',
        name: 'New Chat',
        branches: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: 'Main',
            messages: [],
          }),
        ]),
      }),
    );

    // Verify thread summary was created
    expect(db.threadSummaries.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid',
        name: 'New Chat',
        isIncognitoThread: false,
      }),
    );
  });

  it('should create new thread when threadId is null during initialization', async () => {
    // Mock thread count to be 0 initially
    (db.threadSummaries.count as jest.Mock).mockResolvedValue(0);
    // Mock that thread doesn't exist in DB
    (db.threads.get as jest.Mock).mockResolvedValue(null);

    // Clear mocks before rendering the hook
    jest.clearAllMocks();

    const { result } = renderHook(() =>
      useThreadStorage({
        threadId: null,
      }),
    );

    // Wait for initialization effects to complete
    await waitFor(() => {
      expect(db.threads.put).toHaveBeenCalled();
    });

    // Now verify the specific calls
    expect(db.threads.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid',
        name: 'New Chat',
        branches: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: 'Main',
            messages: [],
          }),
        ]),
      }),
    );

    expect(db.threadSummaries.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid',
        name: 'New Chat',
        isIncognitoThread: false,
      }),
    );

    // Verify that threads.get was called with the new UUID
    // (since it checks if the newly created thread exists)
    expect(db.threads.get).toHaveBeenCalledWith('test-uuid');
    expect(db.threads.get).toHaveBeenCalledTimes(1);
  });

  it('should toggle pin status without affecting lastUpdated timestamp', async () => {
    // Mock an existing thread with a specific lastUpdated time
    const originalDate = new Date('2024-01-01');
    const existingThread = {
      id: 'test-thread',
      name: 'Test Thread',
      lastUpdated: originalDate,
      isPinned: false,
    };

    // Mock useLiveQuery to return our thread summary
    (useLiveQuery as jest.Mock).mockImplementation((queryFn) => {
      if (queryFn.toString().includes('threadSummaries.toArray')) {
        return [existingThread];
      }
      if (queryFn.toString().includes('systemPrompts.toArray')) {
        return [];
      }
      return undefined;
    });

    // Mock direct DB calls
    (db.threadSummaries.get as jest.Mock).mockResolvedValue(existingThread);
    (db.threadSummaries.count as jest.Mock).mockResolvedValue(1);

    const { result } = renderHook(() => useThreadStorage({}));

    // Clear any initialization calls
    jest.clearAllMocks();

    // Pin the thread
    await act(async () => {
      await result.current.actions.toggleThreadPin('test-thread');
    });

    // Check the call to put for pinning
    expect(db.threadSummaries.put).toHaveBeenCalledWith({
      id: 'test-thread',
      name: 'Test Thread',
      isPinned: true,
      lastUpdated: originalDate,
    });

    // Update the mock for the pinned state
    const pinnedThread = { ...existingThread, isPinned: true };
    (db.threadSummaries.get as jest.Mock).mockResolvedValue(pinnedThread);
    (useLiveQuery as jest.Mock).mockImplementation((queryFn) => {
      if (queryFn.toString().includes('threadSummaries.toArray')) {
        return [pinnedThread];
      }
      if (queryFn.toString().includes('systemPrompts.toArray')) {
        return [];
      }
      return undefined;
    });

    // Clear mocks again before unpinning
    jest.clearAllMocks();

    // Unpin the thread
    await act(async () => {
      await result.current.actions.toggleThreadPin('test-thread');
    });

    // Check the call to put for unpinning
    expect(db.threadSummaries.put).toHaveBeenCalledWith({
      id: 'test-thread',
      name: 'Test Thread',
      isPinned: false,
      lastUpdated: originalDate,
    });
  });

  it('should maintain pin status when renaming thread', async () => {
    // Mock an existing pinned thread
    const existingThread = {
      id: 'test-thread',
      name: 'Old Name',
      branches: [
        {
          id: 1,
          name: 'Main',
          messages: [],
          attachments: [],
          createdAt: new Date(),
          description: 'Initial conversation branch',
        },
      ],
      currentBranchId: 1,
    };

    const existingSummary = {
      id: 'test-thread',
      name: 'Old Name',
      lastUpdated: new Date(),
      isPinned: true,
      isIncognitoThread: false,
    };

    (db.threads.get as jest.Mock).mockResolvedValue(existingThread);
    (db.threadSummaries.get as jest.Mock).mockResolvedValue(existingSummary);

    const { result } = renderHook(() => useThreadStorage({}));

    // Rename the thread
    await act(async () => {
      await result.current.actions.renameThread('test-thread', 'New Name');
    });

    // Verify that the pin status was maintained
    expect(db.threadSummaries.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-thread',
        name: 'New Name',
        isPinned: true,
      }),
    );
  });
});
