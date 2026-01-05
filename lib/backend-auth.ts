/**
 * Backend authentication utility for fetching user OAuth tokens
 * from Firebase backend and creating authenticated Google Slides clients
 */

/**
 * Fetch fresh Google OAuth access token for user from Firebase backend
 */
export async function fetchUserAccessToken(userId: string): Promise<string> {
  const functionsUrl = process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/verbaslide/us-central1';

  try {
    const response = await fetch(`${functionsUrl}/refreshOAuthToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { userId }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh OAuth token: ${errorText}`);
    }

    const result = await response.json();

    if (!result.result?.success) {
      throw new Error(result.result?.error || 'Token refresh failed');
    }

    console.log('[Backend Auth] Successfully fetched access token for user:', userId);
    return result.result.accessToken;
  } catch (error: any) {
    console.error('[Backend Auth] Error fetching access token:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Create Google OAuth2 client with user's access token
 */
export function createOAuth2Client(accessToken: string) {
  const { google } = require('googleapis');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  return oauth2Client;
}

/**
 * Get authenticated Google Slides client using user's token from backend
 */
export async function getSlidesClientWithUserId(userId: string) {
  const { google } = require('googleapis');

  // Fetch fresh access token from backend
  const accessToken = await fetchUserAccessToken(userId);

  // Create OAuth2 client with token
  const auth = createOAuth2Client(accessToken);

  // Return Slides API client
  return google.slides({ version: 'v1', auth });
}
