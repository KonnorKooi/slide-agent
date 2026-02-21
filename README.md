# VerbaSlide Slide Agent

The Mastra AI service that reads Google Slides presentations and generates speaker notes using GPT-4.1-mini, streamed in real time back to the frontend.

---

## Overview

This is one of three services that make up VerbaSlide:

| Service | Location | Purpose |
|---------|----------|---------|
| **Frontend** | `frontend/verbaslide-frontend/` | Web dashboard, auth, project management, streaming UI |
| **Backend** | `backend/verbaslide-backend/` | Firebase Cloud Functions, Firestore, OAuth token management |
| **Slide Agent** (this service) | `slide-agent/` | Mastra agent, GPT-4.1-mini, Google Slides API access |

The slide agent exposes an Express API server that the frontend calls to trigger note generation. The agent reads each slide via the Google Slides API, sends the content to GPT-4.1-mini, and streams the result back as Server-Sent Events.

---

## Prerequisites

- **Node.js 20+**
- **OpenAI API key** with access to GPT-4.1-mini
- **Google Cloud project** with OAuth 2.0 credentials and the Google Slides API enabled
- **Firebase backend** running (locally or deployed) -- the agent fetches OAuth tokens from it
- A `SERVER_API_KEY` that matches the one configured in the backend

---

## Getting Started

### 1. Install dependencies

```bash
cd slide-agent
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in the values in `.env`. See the [Environment Variables](#environment-variables) section for descriptions.

### 3. Start the service

```bash
npm run dev:api
```

The API server starts at [http://localhost:3001](http://localhost:3001).

Optionally, start the Mastra playground UI for browser-based agent testing:

```bash
npm run dev:mastra
```

The playground runs at [http://localhost:4111](http://localhost:4111) and is not required for the application to function.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4.1-mini access |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth redirect URI -- use `postmessage` for the server-side flow |
| `FIREBASE_FUNCTIONS_URL` | Yes | Base URL of the Firebase backend (local emulator or deployed) |
| `SERVER_API_KEY` | Yes | Shared secret used to authenticate calls to the Firebase backend - must match the backend's `SERVER_API_KEY` |
| `API_PORT` | No | Port for the Express API server (default: `3001`) |

See `.env.example` for format details and generation instructions.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start the Express API server on port 3001 (required for the app) |
| `npm run dev:mastra` | Start the Mastra playground UI on port 4111 (optional dev tool) |
| `npm run build` | Build the Mastra agent |
| `npm run start` | Start Mastra in production mode |

---

## API Endpoints

The Express API server (`api-server.js`) exposes two endpoints:

### GET /health

Health check.

```json
{ "status": "ok", "service": "mastra-api", "timestamp": "..." }
```

### POST /api/stream-with-user

Generates speaker notes for a presentation and streams the result as Server-Sent Events.

**Request body:**
```json
{
  "messages": [{ "role": "user", "content": "<tone-specific prompt>" }],
  "userId": "<Firebase UID>"
}
```

**Response:** SSE stream. The frontend's state machine parses the streamed JSON and emits per-slide events to the browser.

---

## Project Structure

```
slide-agent/
├── api-server.js              # Express server -- the entry point the frontend calls
├── mastra/
│   ├── index.ts               # Mastra instance setup
│   ├── agents/
│   │   └── agent.ts           # SlideAgent definition (model, instructions, tools)
│   └── tools/
│       ├── getSlideCount.ts   # Tool: get total slide count for a presentation
│       ├── getSlide.ts        # Tool: get text and image content for a single slide
│       └── googleAuth.ts      # Helper: returns an authenticated Google Slides client
├── lib/
│   ├── backend-auth.ts        # Fetches OAuth tokens from Firebase and creates API clients
│   └── user-context.ts        # Request-scoped userId storage (set/get/clear)
├── .env.example               # Environment variable template
└── tsconfig.json              # TypeScript configuration
```

---

## Note Generation Styles

The frontend passes a tone parameter that shapes the agent's instructions:

| Style | Character |
|-------|-----------|
| `concise` | Brief, key-point focused notes |
| `explanatory` | Detailed explanations with context and examples |
| `formal` | Professional business language |
| `storytelling` | Narrative flow with emotional engagement |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@mastra/core` | AI agent orchestration framework |
| `@ai-sdk/openai` | OpenAI GPT-4.1-mini integration |
| `googleapis` | Google Slides API client |
| `firebase-admin` | Firebase backend integration |
| `express` + `cors` | HTTP API server |
| `dotenv` | Environment variable loading |
| `zod` | Schema validation for tool inputs and outputs |

---

## Related Services

- **Backend (Firebase Cloud Functions):** `backend/verbaslide-backend/` - encrypts and stores OAuth refresh tokens, provides the `refreshOAuthToken` function this service calls
- **Frontend:** `frontend/verbaslide-frontend/` - calls this service via `/api/stream-with-user` and handles the SSE stream

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown of the request flow, token chain, and streaming design.
