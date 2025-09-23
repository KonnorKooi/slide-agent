# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mastra-based AI agent project that creates slide decks. The project uses the Mastra framework for building AI agents with a focus on slide generation functionality.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm test` - Run tests (currently no tests configured)

## Architecture

### Core Structure
- **Mastra Framework**: Built on top of @mastra/core for AI agent functionality
- **TypeScript**: Full TypeScript codebase with ES2022 target
- **Node.js**: Requires Node.js >=20.9.0

### Key Directories
- `mastra/` - Main Mastra configuration and agent definitions
- `mastra/agents/` - Agent implementations
- `mastra/tools/` - Custom tool implementations (Google Slides integration)
- `.mastra/` - Mastra framework build artifacts and configuration

### Main Components
- `mastra/index.ts` - Main Mastra instance configuration, registers all agents
- `mastra/agents/agent.ts` - SlideAgent implementation using OpenAI GPT-4o-mini
- `mastra/tools/getSlide.ts` - Google Slides API integration tool
- `mastra/tools/googleAuth.ts` - OAuth 2.0 authentication helper for Google APIs

### Dependencies
- **@mastra/core** - Core Mastra framework
- **@mastra/libsql** - Database integration
- **@mastra/memory** - Memory management for agents
- **zod** - Schema validation
- **@ai-sdk/openai** - OpenAI integration
- **googleapis** - Official Google APIs Node.js client
- **@google-cloud/local-auth** - OAuth 2.0 authentication for Google APIs

## Environment Setup

### Required API Keys
The project requires the following environment variables in `.env`:
- `OPENAI_API_KEY` - OpenAI API key for the SlideAgent

### Google Slides OAuth Setup
To use the Google Slides integration:

1. **Google Cloud Console Setup**:
   - Create a project in Google Cloud Console
   - Enable the Google Slides API
   - Create OAuth 2.0 credentials (Desktop application type)
   - Download the credentials file as `credentials.json` in project root

2. **Authentication Files**:
   - `credentials.json` - OAuth 2.0 client credentials (add to project root)
   - `token.json` - Automatically generated user tokens (created on first auth)

3. **OAuth Scopes**:
   - The tool uses `https://www.googleapis.com/auth/presentations.readonly` scope
   - Read-only access to Google Slides presentations

## Tools

### Google Slides Tools

#### Get Slide Content (`getSlide`)
Retrieves individual slides from Google Slides presentations.

**Input Parameters**:
- `presentationId` (string) - Google Slides presentation ID from URL
- `slideIndex` (number) - Zero-based slide index (0 = first slide)
- `includeContent` (boolean) - Whether to extract text content (default: true)

**Returns**:
- Slide metadata and content
- Extracted text content
- Image URLs
- Slide and presentation information

#### Get Slide Count (`getSlideCount`)
Gets the total number of slides in a Google Slides presentation.

**Input Parameters**:
- `presentationId` (string) - Google Slides presentation ID from URL
- `includeMetadata` (boolean) - Whether to include presentation metadata (default: false)

**Returns**:
- Total slide count
- Presentation title and URL
- Optional: page size, locale, revision ID

**Usage**:
```typescript
// Both tools handle OAuth authentication automatically
// First run will open browser for Google login
// Examples:
// "How many slides are in presentation 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms?"
// "Get slide 3 from presentation 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
```

## Agent Development

When working with agents:
- Agents are defined in `mastra/agents/`
- Tools are defined in `mastra/tools/`
- Register new agents in `mastra/index.ts`
- The SlideAgent can retrieve slides from Google Slides presentations via OAuth
- Agent instructions are defined inline in the agent constructor

## Google API Authentication Flow

1. First tool usage prompts OAuth consent screen
2. User grants permission to read Google Slides
3. Tokens stored in `token.json` for future use
4. Automatic token refresh when expired