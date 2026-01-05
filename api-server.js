/**
 * Standalone API Server for Mastra Service
 *
 * This server provides HTTP endpoints for the Mastra AI agent,
 * allowing the frontend to call the agent via REST API.
 */

import express from 'express';
import cors from 'cors';
import { SlideAgent } from './mastra/agents/agent.ts';
import { setUserId, getUserId, clearUserId } from './lib/user-context.ts';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mastra-api', timestamp: new Date().toISOString() });
});

/**
 * POST /api/stream-with-user
 *
 * Streaming endpoint that accepts userId and calls the SlideAgent
 * Returns Server-Sent Events stream
 */
app.post('/api/stream-with-user', async (req, res) => {
  console.log('[API] Received request to /api/stream-with-user');

  try {
    const { messages, memory, userId } = req.body;

    // Validate userId
    if (!userId) {
      console.error('[API] Missing userId in request body');
      return res.status(400).json({ error: 'Missing userId in request body' });
    }

    console.log(`[API] Processing request for userId: ${userId}`);

    // Set userId globally for this request
    setUserId(userId);

    try {
      console.log('[API] Calling SlideAgent.stream()');

      // Call Mastra agent with correct signature: stream(messages, options)
      // First argument is messages, second is options
      const stream = await SlideAgent.stream(messages);

      console.log('[API] Stream created successfully, sending to client');

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Mastra returns a MastraModelOutput with textStream property
      // We need to iterate over it and convert to SSE format
      try {
        // Stream is a MastraModelOutput, use textStream to iterate
        for await (const chunk of stream.textStream) {
          // Send each chunk as SSE
          const sseData = `data: ${JSON.stringify({ type: 'text-delta', payload: { text: chunk } })}\n\n`;
          res.write(sseData);
        }

        // Send completion event
        res.write(`data: ${JSON.stringify({ type: 'finish' })}\n\n`);
        console.log('[API] Stream completed');
      } finally {
        // Clean up userId after stream completes
        clearUserId();
        res.end();
        console.log('[API] Response ended, userId cleared');
      }

    } catch (streamError) {
      clearUserId();
      console.error('[API] Error during streaming:', streamError);
      throw streamError;
    }

  } catch (error) {
    clearUserId();
    console.error('[API] Error in /api/stream-with-user:', error);

    // If headers already sent, can't send error response
    if (res.headersSent) {
      res.end();
    } else {
      res.status(500).json({
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`[API] 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[API] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log(`Mastra API Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  POST http://localhost:${PORT}/api/stream-with-user`);
  console.log('');
  console.log('Mastra Playground: http://localhost:4111/');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('[API] SIGINT received, shutting down gracefully');
  process.exit(0);
});
