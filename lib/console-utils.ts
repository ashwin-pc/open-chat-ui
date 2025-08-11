// Store recent console logs
const MAX_LOG_ENTRIES = 50;
const consoleBuffer: { timestamp: string; level: string; args: any[] }[] = [];

// Original console methods
const originalConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
};

// Override console methods to capture logs
console.log = (...args: any[]) => {
  consoleBuffer.push({
    timestamp: new Date().toISOString(),
    level: 'log',
    args,
  });
  if (consoleBuffer.length > MAX_LOG_ENTRIES) {
    consoleBuffer.shift();
  }
  originalConsole.log(...args);
};

console.error = (...args: any[]) => {
  consoleBuffer.push({
    timestamp: new Date().toISOString(),
    level: 'error',
    args,
  });
  if (consoleBuffer.length > MAX_LOG_ENTRIES) {
    consoleBuffer.shift();
  }
  originalConsole.error(...args);
};

console.warn = (...args: any[]) => {
  consoleBuffer.push({
    timestamp: new Date().toISOString(),
    level: 'warn',
    args,
  });
  if (consoleBuffer.length > MAX_LOG_ENTRIES) {
    consoleBuffer.shift();
  }
  originalConsole.warn(...args);
};

console.info = (...args: any[]) => {
  consoleBuffer.push({
    timestamp: new Date().toISOString(),
    level: 'info',
    args,
  });
  if (consoleBuffer.length > MAX_LOG_ENTRIES) {
    consoleBuffer.shift();
  }
  originalConsole.info(...args);
};

// Helper to format any value for logging
const formatValue = (value: any): string => {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}\n${value.stack || ''}`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
};

export const getRecentLogs = () => {
  return consoleBuffer.map((entry) => ({
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.args.map((arg) => formatValue(arg)).join(' '),
  }));
};

export const logError = (error: Error | string, conversationId: string) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  // Log to browser console with proper formatting
  console.group('Error in conversation:', conversationId);
  console.error('Error message:', errorMessage);
  if (stack) {
    console.error('Stack trace:', stack);
  }
  console.groupEnd();

  return {
    errorMessage,
    stack,
    logs: getRecentLogs(),
  };
};
