# VerbaSlide Slide Agent Architecture

This document covers the technical design of the slide agent service. For setup and usage, see [README.md](./README.md).

---

## System Overview

The slide agent sits between the frontend and the AI model. It is the only service in VerbaSlide that talks directly to OpenAI or the language model you choose in the mastra config.

```
Frontend (Next.js)
  |
  | POST /api/stream-with-user  (SSE response)
  v
Express API Server (api-server.js, port 3001)
  |
  | SlideAgent.stream(messages)
  v
Mastra SlideAgent (GPT-4.1-mini)
  |
  +-- getSlideCount tool -----> Google Slides API
  |                                    ^
  +-- getSlide tool (per slide) -------|
           |
           | getSlidesClient(userId)
           v
       backend-auth.ts
           |
           | POST refreshOAuthToken
           v
       Firebase Cloud Functions (backend)
           |
           | returns fresh access token
           v
       Google OAuth2 client (googleapis)
```

---

## Request Flow

A full note generation request follows these steps:

1. The frontend's `/api/generate-notes` route builds a tone-specific prompt and calls `POST /api/stream-with-user` on this service.
2. The API server receives `{ messages, userId }`, stores the `userId` in request-scoped context via `setUserId()`, and calls `SlideAgent.stream(messages)`.
3. Mastra runs the agent. The agent calls `getSlideCount` first to find out how many slides to process.
4. `getSlideCount` calls `getSlidesClient(userId)`, which triggers the token fetch chain (see below).
5. With an authenticated client, the tool calls the Google Slides API and returns the slide count.
6. The agent then calls `getSlide` for each slide index from 0 to N-1, extracting text content and image URLs each time.
7. With all slide content assembled, GPT-4.1-mini generates the speaker notes as a JSON object.
8. The JSON streams back character by character through the SSE response.
9. The frontend's state machine parses the JSON as it arrives and emits per-slide events to the browser.
10. After the stream finishes (or on error), `clearUserId()` is called to clean up the request context.

---

## OAuth Token Fetch Chain

The slide agent never stores OAuth tokens. Every time a tool needs to call the Google Slides API, it fetches a fresh access token from the Firebase backend on demand.

```
getSlidesClient(userId)                     [googleAuth.ts]
  |
  v
getSlidesClientWithUserId(userId)           [backend-auth.ts]
  |
  v
fetchUserAccessToken(userId)               [backend-auth.ts]
  |
  | POST ${FIREBASE_FUNCTIONS_URL}/refreshOAuthToken
  | Body: { data: { userId, serverApiKey } }
  |
  v
Firebase Cloud Function: refreshOAuthToken  [backend]
  |
  | Decrypts stored refresh token
  | Calls Google token endpoint
  |
  v
Returns fresh access token
  |
  v
createOAuth2Client(accessToken)            [backend-auth.ts]
  |
  | Creates google.auth.OAuth2 client
  | Sets { access_token }
  |
  v
google.slides({ version: 'v1', auth })     [tool]
```

**Why fetch on every request?**
Google access tokens expire after one hour. Rather than tracking expiry in this service, the token is always fetched fresh from the backend which holds the encrypted refresh token. This keeps token state in one place (the backend) and avoids stale token bugs.

**Server API key:** The `serverApiKey` in the request body is a shared secret that the Firebase Cloud Function uses to verify the caller is the slide agent, not an arbitrary external request.

---

## Request-Scoped User Context

Mastra tools do not receive the HTTP request as a parameter, they only receive their declared input schema. To pass the `userId` from the API request into the tools without threading it through every function signature, the service uses Node's built-in `AsyncLocalStorage`.

**File:** `lib/user-context.ts`

```
API request arrives with userId
  |
  v
runWithUserId(userId, async () => { ... })   -- creates an isolated async context
  |
  v
SlideAgent.stream() runs inside that context
  |
  +-- getSlideCount tool calls getUserId()   -- reads from its own async context
  +-- getSlide tool calls getUserId()        -- reads from its own async context
  |
  v
Stream finishes -- async context is automatically discarded
```

`AsyncLocalStorage` from Node's `async_hooks` module propagates the stored value through the entire async call chain (including `await`, `for await`, and callbacks) without any explicit cleanup step. Each concurrent request has its own isolated store, so concurrent users cannot overwrite each other's `userId`.

---

## Streaming Architecture

The agent output streams from OpenAI through several layers before reaching the browser.

```
GPT-4.1-mini (OpenAI)
  |
  | token stream
  v
Mastra SlideAgent.stream()
  |
  | stream.textStream (AsyncIterable<string>)
  v
api-server.js
  |
  | for await (const chunk of stream.textStream)
  | res.write(`data: ${JSON.stringify({ type: 'text-delta', text: chunk })}\n\n`)
  |
  v
Frontend route: /api/generate-notes        [frontend service]
  |
  | Reads SSE stream from this service
  | Runs state machine on each character
  | Emits browser-facing SSE events:
  |   slide-start, slide-content, slide-complete, finish, error
  v
Browser EventSource
  |
  v
Project viewer page updates in real time
```

The slide agent itself emits a simple `{ type, text }` SSE format. The more complex state machine that extracts per-slide events lives in the frontend's `/api/generate-notes` route, not here.

---

## Agent Output Format

The agent is instructed to output pure JSON with no markdown wrapping. The schema is:

```json
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Introduction",
      "script": "Welcome everyone. Today we will cover..."
    }
  ]
}
```

`slideNumber` is 1-based. The frontend state machine uses it to correlate generated notes with the correct slide in the UI.

---

## Tool Design

### getSlideCount

Calls `slides.presentations.get()` and returns `presentation.slides.length`. The agent uses this to know how many `getSlide` calls to make.

**Input:** `presentationId`, optional `includeMetadata`
**Output:** `slideCount`, `presentationTitle`, optional metadata (page size, locale, revision ID)

### getSlide

Calls `slides.presentations.get()` again (the full presentation) and picks the slide at the given 0-based index. It then walks the `pageElements` array to extract:
- Text: from `shape.text.textElements[].textRun.content`
- Images: from `image.contentUrl` and `image.sourceUrl`

**Input:** `presentationId`, `slideIndex` (0-based), optional `includeContent`
**Output:** Raw slide object plus `textContent` string and `imageUrls` array

Both tools include specific error handling: 401 for auth failures (triggers a retry after refreshing the token), 403 for access denied, 404 for missing presentations, and validation errors for out-of-range slide indices.

---

## Error Handling

| Layer | Behavior |
|-------|---------|
| Tool level | Returns structured error messages (401, 403, 404) that the agent can act on (e.g., retry after auth failure) |
| API server | Catches streaming errors; returns 500 if headers have not been sent yet; otherwise closes the stream |
| Frontend | The state machine continues parsing even if a chunk is malformed; `error` SSE events trigger the UI error state |
