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
