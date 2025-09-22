# Google Slides OAuth Setup Guide

This guide walks you through setting up OAuth authentication for the Google Slides integration in your Mastra SlideAgent.

## Prerequisites

- Google account
- Node.js ≥20.9.0
- This project already has the required dependencies installed

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Slide Agent")
4. Click "Create"

### 1.2 Enable Google Slides API
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Slides API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace account)
   - Fill in app name: "Slide Agent"
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue" through the scopes and test users screens
4. Back to creating OAuth client ID:
   - Application type: "Desktop application"
   - Name: "Slide Agent Desktop"
   - Click "Create"

### 1.4 Download Credentials
1. After creating the OAuth client, you'll see a dialog with client ID and secret
2. Click "Download JSON"
3. Save the downloaded file as `credentials.json` in your project root directory

## Step 2: Project Configuration

### 2.1 File Placement
Make sure your `credentials.json` file is in the project root:
```
slide-agent/
├── credentials.json  ← Place the downloaded file here
├── src/
├── package.json
└── ...
```

### 2.2 Test Authentication (Optional)
You can test the OAuth flow by running the development server:
```bash
npm run dev
```

## Step 3: Using the Google Slides Tool

### 3.1 Getting a Presentation ID
The presentation ID is found in the Google Slides URL:
```
https://docs.google.com/presentation/d/PRESENTATION_ID/edit
```

Example:
```
https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```
The presentation ID is: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 3.2 Testing the Tool
1. Start the development server: `npm run dev`
2. Open the Mastra playground (usually at http://localhost:4111)
3. Try asking the SlideAgent: "Can you get the first slide from presentation ID 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms?"

### 3.3 First-Time Authentication Flow
1. When you first use the tool, it will open your default browser
2. Sign in to your Google account
3. Grant permission to access your Google Slides
4. The browser will show a success message
5. Authentication tokens are saved automatically for future use

## Troubleshooting

### "Credentials not found" Error
- Make sure `credentials.json` is in the project root directory
- Verify the file is valid JSON (download again if needed)

### "Access denied" Error
- Make sure the presentation is accessible to your Google account
- Try with a public presentation or one you own

### "Authentication failed" Error
- Delete `token.json` to reset authentication
- Run the tool again to re-authenticate

### Browser doesn't open
- The OAuth flow requires a desktop environment with a browser
- For server environments, you'll need a different authentication method

## Security Notes

- `credentials.json` contains sensitive information - never commit it to version control
- `token.json` is automatically generated and should also not be committed
- Both files are already added to `.gitignore`
- Use the minimum required OAuth scopes (currently read-only access)

## Example Usage

Once set up, you can use the tool like this:

```typescript
// In your agent conversation:
"Get slide 2 from presentation 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"

// The tool will return:
// - Slide content and text
// - Images in the slide
// - Slide metadata
// - Presentation information
```

## API Limits

- Google Slides API has usage quotas
- For development: 100 requests per 100 seconds per user
- For production: you may need to request quota increases

## Next Steps

With OAuth set up, you can:
1. Retrieve any slide from accessible presentations
2. Extract text content for analysis
3. Get image URLs from slides
4. Build more advanced slide manipulation tools