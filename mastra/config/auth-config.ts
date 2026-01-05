/**
 * Authentication Configuration
 *
 * For Development: Uses mock OAuth tokens
 * For Production: Uses real Firebase OAuth tokens from Firestore
 */

export const authConfig = {
  // Set to 'mock' for development, 'firebase' for production
  mode: process.env.AUTH_MODE || 'mock',

  // Mock OAuth tokens for development (REMOVE IN PRODUCTION)
  mockTokens: {
    // Add test presentation IDs here
    // When OAuth is ready, delete this entire section
    default: 'mock-access-token-for-testing'
  },

  // Firebase configuration (for production)
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'verbaslide',
    // Path to service account key (for Mastra to access Firestore)
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
  }
};

/**
 * TODO: When OAuth is ready, change AUTH_MODE=firebase in .env
 *
 * Current flow (mock):
 *   Frontend → Mastra → Uses credentials.json (dev only)
 *
 * Future flow (OAuth ready):
 *   Frontend → Mastra → Validates Firebase token → Gets user's OAuth from Firestore
 */
