import { ChatThread } from './types';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export const SHARED_THREAD_PARAM = 'shared_thread';
// Maximum size in characters before compression (roughly 20KB of text)
export const MAX_SHAREABLE_THREAD_SIZE = 20000;

export function getThreadSize(thread: ChatThread): number {
  return JSON.stringify(thread).length;
}

export function isThreadShareable(thread: ChatThread): boolean {
  return getThreadSize(thread) <= MAX_SHAREABLE_THREAD_SIZE;
}

export function encodeThread(thread: ChatThread): string {
  const threadData = JSON.stringify(thread);
  return compressToEncodedURIComponent(threadData);
}

export function decodeThread(encodedData: string): ChatThread | null {
  try {
    const decompressed = decompressFromEncodedURIComponent(encodedData);
    if (!decompressed) return null;
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Failed to decode thread:', error);
    return null;
  }
}

export function getSharedThreadFromUrl(): ChatThread | null {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedThread = urlParams.get(SHARED_THREAD_PARAM);
  if (!encodedThread) return null;
  return decodeThread(encodedThread);
}

export function createShareUrl(thread: ChatThread): string {
  if (!isThreadShareable(thread)) {
    throw new Error('Thread is too large to share via URL. Please export and share as a file instead.');
  }
  const encodedThread = encodeThread(thread);
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set(SHARED_THREAD_PARAM, encodedThread);
  return currentUrl.toString();
}
