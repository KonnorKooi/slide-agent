/**
 * Global user context management for Mastra tool execution
 *
 * This module provides a way to inject userId into tool execution context.
 * The userId is set by the API route before agent execution and cleared after.
 */

let currentUserId: string | null = null;

export function setUserId(userId: string) {
  currentUserId = userId;
}

export function getUserId(): string {
  if (!currentUserId) {
    throw new Error('No userId available. Must be set before tool execution.');
  }
  return currentUserId;
}

export function clearUserId() {
  currentUserId = null;
}
