/**
 * Firebase Helper for Mastra
 *
 * Handles authentication in two modes:
 * 1. MOCK MODE (development): Uses credentials.json, no Firebase needed
 * 2. FIREBASE MODE (production): Validates user tokens, retrieves OAuth from Firestore
 */

import { authConfig } from '../config/auth-config';

// Lazy load Firebase Admin (only when needed)
let firebaseAdmin: any = null;
let db: any = null;

/**
 * Initialize Firebase Admin SDK (only in firebase mode)
 */
async function initFirebase() {
  if (authConfig.mode !== 'firebase') {
    return null;
  }

  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    const admin = await import('firebase-admin');

    if (admin.apps.length === 0) {
      const serviceAccount = require(authConfig.firebase.serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: authConfig.firebase.projectId
      });
    }

    firebaseAdmin = admin;
    db = admin.firestore();

    console.log('[Firebase] Initialized Firebase Admin SDK');
    return firebaseAdmin;
  } catch (error) {
    console.error('[Firebase] Failed to initialize:', error);
    throw new Error('Firebase Admin SDK initialization failed');
  }
}

/**
 * Validate Firebase ID token and return user ID
 */
export async function validateFirebaseToken(idToken: string): Promise<string> {
  if (authConfig.mode === 'mock') {
    console.log('[Auth] Mock mode: Skipping token validation');
    return 'mock-user-id';
  }

  try {
    const admin = await initFirebase();
    if (!admin) {
      throw new Error('Firebase not initialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('[Auth] Token validated for user:', decodedToken.uid);
    return decodedToken.uid;
  } catch (error) {
    console.error('[Auth] Token validation failed:', error);
    throw new Error('Invalid Firebase token');
  }
}

/**
 * Get user's Google OAuth access token from Firestore
 *
 * In mock mode: Returns null (uses credentials.json instead)
 * In firebase mode: Retrieves and decrypts user's OAuth token
 */
export async function getUserOAuthToken(userId: string): Promise<string | null> {
  if (authConfig.mode === 'mock') {
    console.log('[Auth] Mock mode: Using credentials.json for OAuth');
    return null; // Signal to use credentials.json
  }

  try {
    if (!db) {
      await initFirebase();
    }

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const encryptedToken = userData.oauthToken;

    if (!encryptedToken) {
      throw new Error('User has not connected Google Slides');
    }

    // TODO: Add decryption logic here (copy from backend functions)
    // For now, assume token is stored decrypted (NOT SECURE - fix in production)
    const oauthToken = encryptedToken;

    console.log('[Auth] Retrieved OAuth token for user:', userId);
    return oauthToken;
  } catch (error) {
    console.error('[Auth] Failed to get OAuth token:', error);
    throw error;
  }
}

/**
 * Refresh Google OAuth access token using refresh token
 */
export async function refreshOAuthToken(refreshToken: string): Promise<string> {
  const { google } = require('googleapis');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('[Auth] Refreshed access token');
    return credentials.access_token;
  } catch (error) {
    console.error('[Auth] Failed to refresh token:', error);
    throw new Error('Failed to refresh OAuth token');
  }
}

/**
 * Get authentication mode
 */
export function getAuthMode(): 'mock' | 'firebase' {
  return authConfig.mode as 'mock' | 'firebase';
}

/**
 * Check if using mock authentication
 */
export function isMockMode(): boolean {
  return authConfig.mode === 'mock';
}
