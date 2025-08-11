export class ChatError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ChatError';
  }
}

export class NetworkError extends ChatError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class APIError extends ChatError {
  constructor(message: string) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

export class FileError extends ChatError {
  constructor(message: string) {
    super(message, 'FILE_ERROR');
    this.name = 'FileError';
  }
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function toChatError(error: unknown): ChatError {
  if (error instanceof ChatError) {
    return error;
  }
  if (error instanceof Error) {
    return new ChatError(error.message);
  }
  return new ChatError(String(error));
}
