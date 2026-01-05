#!/usr/bin/env node

/**
 * Simple script to test Google Slides OAuth authentication
 * Run this to complete OAuth flow and create token.json
 */

import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCOPES = ['https://www.googleapis.com/auth/presentations.readonly'];
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function testAuth() {
  try {
    console.log('🔐 Starting Google OAuth authentication...\n');

    // Load credentials
    const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf-8'));
    console.log('✅ credentials.json loaded\n');

    // Authenticate
    console.log('🌐 Opening browser for authentication...');
    console.log('   (A browser window should open automatically)\n');

    const auth = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });

    console.log('✅ Authentication successful!\n');

    // Save the token
    const tokens = auth.credentials;
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
    console.log('✅ Token saved to token.json\n');

    // Test API access
    console.log('🧪 Testing Google Slides API access...\n');
    const slides = google.slides({ version: 'v1', auth });

    const testPresentationId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

    try {
      const presentation = await slides.presentations.get({
        presentationId: testPresentationId,
      });

      console.log('✅ Successfully accessed Google Slides API!');
      console.log(`   Presentation: "${presentation.data.title}"`);
      console.log(`   Slides: ${presentation.data.slides?.length || 0}\n`);

      console.log('🎉 All set! You can now use the Mastra agent.\n');
      console.log('Next steps:');
      console.log('1. Go back to http://localhost:3000/test-mastra');
      console.log('2. Try generating speaker notes again\n');

    } catch (apiError) {
      console.error('❌ API test failed:', apiError.message);
    }

  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure credentials.json exists in slide-agent/');
    console.log('2. Check that credentials.json is valid (download from Google Cloud Console)');
    console.log('3. Make sure you granted all requested permissions\n');
  }
}

testAuth();
