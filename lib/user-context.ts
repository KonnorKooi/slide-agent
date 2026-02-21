/**
 * Request-scoped user context management for Mastra tool execution
 *
 * Uses AsyncLocalStorage so concurrent requests each have their own isolated
 * userId. Tools call getUserId() without needing the userId passed explicitly.
 */

import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage<{ userId: string }>();

export function runWithUserId<T>(userId: string, fn: () => T): T {
  return storage.run({ userId }, fn);
}

export function getUserId(): string {
  const store = storage.getStore();
  if (!store) {
    throw new Error('No userId available. Must be called within runWithUserId().');
  }
  return store.userId;
}
