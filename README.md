# VerbaSlide Slide Agent

AI-powered speaker notes generation service for VerbaSlide presentations.

## Overview

The Slide Agent is a Mastra-based AI service that analyzes Google Slides presentations and generates context-aware speaker notes using GPT-4.1o mini at the moment. It retrieves slide content (text and images(needs to be further tested)), processes it with a specialized prompt for an AI agent, and streams the generated notes back to the frontend via Server-Sent Events (SSE).

## Architecture

**Framework:** Mastra (AI agent orchestration)
**Model:** OpenAI GPT-4.1o mini
**Integration:** Google Slides API
**Authentication:** Firebase Cloud Functions (backend OAuth tokens)
**Streaming:** Server-Sent Events (SSE)

## Components

### Mastra Agent
- **Location:** `mastra/agents/agent.ts`
- **Purpose:** SlideAgent orchestrates the note generation process
- **Capabilities:** Analyzes slide content, generates notes in multiple styles (concise, explanatory, formal, storytelling)

### Tools
- **getSlideCount** (`mastra/tools/getSlideCount.ts`) - Retrieves total number of slides in a presentation
- **getSlide** (`mastra/tools/getSlide.ts`) - Fetches individual slide content including text and embedded images

### API Server
- **Location:** `api-server.js`
- **Endpoint:** Express server on port 4000
- **Purpose:** Handles note generation requests from the frontend

### Frontend Integration
- **Location:** `frontend/app/api/stream-slides/route.ts`
- **Endpoint:** `GET /api/stream-slides?presentationId=X&style=Y`
- **Response:** SSE stream with real-time note generation

## How It Works

1. Frontend sends presentation ID and style preference to SSE endpoint
2. SSE route extracts user ID from Firebase session
3. Request forwarded to Mastra API server with user context
4. Mastra fetches OAuth token from backend Cloud Function
5. SlideAgent uses tools to retrieve slide content from Google Slides API
6. GPT-4o generates speaker notes based on slide content and style
7. Notes streamed back to frontend via SSE events

## Development

### Prerequisites
- Node.js 20 or 22+
- OpenAI API key

### Environment Variables
Create `.env` in the `slide-agent/` directory:
 
see .env.example for further assistance with .env variables needed

### Running the Service

**Production Service (Required)**
```bash
npm run dev:api
```
This starts the API server on port 3001 which the frontend uses.

**Development Playground (Optional)**
```bash
npm run dev:mastra
```
This starts the Mastra playground UI on port 4111 for testing agents in the browser. Not required for the application to work.

### Endpoints
- API Server: http://localhost:3001 (required)
- Mastra Playground: http://localhost:4111 (optional development tool)

## Key Files

```
slide-agent/
├── mastra/
│   ├── agents/agent.ts           # SlideAgent definition
│   └── tools/
│       ├── getSlideCount.ts      # Presentation metadata
│       ├── getSlide.ts           # Individual slide content
│       └── googleAuth.ts         # Google Slides client helper
├── lib/
│   ├── backend-auth.ts           # Backend OAuth token retrieval
│   └── user-context.ts           # Request-scoped user ID
├── frontend/app/api/stream-slides/route.ts  # SSE endpoint
├── api-server.js                 # Express API server
└── .env                          # OpenAI API key

```

## Note Generation Styles

- **concise** - Brief, bullet-point notes
- **explanatory** - Detailed explanations and context
- **formal** - Professional, structured notes
- **storytelling** - Narrative-driven presentation flow

## Dependencies

- `@mastra/core` - AI agent framework
- `@ai-sdk/openai` - OpenAI GPT-4o integration
- `googleapis` - Google Slides API client
- `firebase-admin` - Backend authentication
- `express` + `cors` - API server
- `dotenv` - Environment configuration
