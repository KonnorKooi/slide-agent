import { getSlidesClientWithUserId } from '../../lib/backend-auth';

/**
 * Get authenticated Google Slides API client using user's token
 *
 * @param userId - Firebase UID of the user
 * @returns Authenticated Google Slides API client
 */
export async function getSlidesClient(userId: string) {
  return await getSlidesClientWithUserId(userId);
}

/**
 * @deprecated credentials.json is no longer used
 */
export async function hasCredentials(): Promise<boolean> {
  return false;
}

/**
 * @deprecated Use getSlidesClient(userId) instead
 */
export async function authorize() {
  throw new Error('authorize() is deprecated. Use getSlidesClient(userId) instead.');
}
