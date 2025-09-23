# Text Streaming Architecture - Slide Agent

This document explains how real-time text streaming works in the Slide Agent application, from backend to frontend rendering.
Streaming will work with these models that support AI SDK

OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
Anthropic: claude-3-opus, claude-3-sonnet, claude-3-haiku
Google: gemini-pro, gemini-1.5-pro
Mistral: mistral-large, mistral-medium, mistral-small
Cohere: command-r-plus, command-r

## 🏗️ **Overview**

The Slide Agent implements a sophisticated streaming architecture that allows users to see AI-generated presentation scripts appear in real-time as they're being created. The system uses Server-Sent Events (SSE) to stream data from the Mastra backend through a Next.js API route to a React frontend.

## 📊 **Architecture Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mastra Agent  │───▶│  Next.js API    │───▶│ React Component │───▶│   User Interface│
│   (Backend)     │    │   (Middleware)  │    │   (Frontend)    │    │   (Browser)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
    Tool Calls &             EventSource              React State           Smooth Text
   Text Generation           Streaming               Management             Rendering
```

## 🔧 **Components Breakdown**

### 1. **Mastra Backend** (`http://localhost:4112`)

**Purpose**: AI agent that processes Google Slides and generates presentation scripts

**Key Features**:
- Connects to Google Slides API via tools (`getSlide`, `getSlideCount`)
- Uses OpenAI for script generation
- Streams responses in real-time via `/api/agents/SlideAgent/stream/vnext`

**Stream Format**: Mastra v5 format with expanded chunk types:
```typescript
interface MastraChunk {
  type: 'text-delta' | 'tool-call' | 'tool-call-delta' | 'tool-result' | 'text-start' | 'text-end' | 'start' | 'finish' | 'error'
  runId?: string
  from?: string
  content?: string
  data?: any
  payload?: {
    content?: string
    message?: string
    toolName?: string
    toolCallId?: string
    argsTextDelta?: string
    args?: any
    result?: any
    [key: string]: any
  }
  error?: string
}
```

### 2. **Next.js API Route** (`/frontend/app/api/stream-slides/route.ts`)

**Purpose**: Middleware that bridges Mastra backend with React frontend

**Key Responsibilities**:
- Receives presentation ID from frontend
- Creates connection to Mastra streaming endpoint
- Parses Mastra v5 chunk format
- Transforms chunks into frontend-compatible format
- Handles connection errors and cleanup

**Code Structure**:
```typescript
export async function GET(request: NextRequest) {
  // Extract presentation ID from URL params
  const { searchParams } = new URL(request.url)
  const presentationId = searchParams.get('presentationId')

  // Create connection to Mastra
  const response = await fetch('http://localhost:4111/api/agents/SlideAgent/stream/vnext', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: presentationId }]
    })
  })

  // Stream processing
  const stream = new ReadableStream({
    start(controller) {
      // Parse Mastra chunks and forward to frontend
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

### 3. **React Frontend Components**

#### **SlideProcessor Component** (`/frontend/components/SlideProcessor.tsx`)

**Purpose**: Main orchestrator for the streaming experience

**Key Features**:
- Manages EventSource connection to API route
- Handles chunk processing and state management
- Provides user controls (submit, stop, reset)
- Manages processing state and error handling

**State Management**:
```typescript
interface ProcessingState {
  isProcessing: boolean
  content: string
  error: string | null
  presentationId: string | null
  textGenerationComplete: boolean
  streamFinished: boolean
}
```

**Chunk Processing Logic**:
```typescript
eventSource.onmessage = (event) => {
  const chunk: StreamChunk = JSON.parse(event.data)
  
  setState(prev => {
    switch (chunk.type) {
      case 'text-delta':
        // Handle both old and new payload formats
        const deltaContent = chunk.content || chunk.payload?.content || ''
        return { ...prev, content: prev.content + deltaContent }
      
      case 'tool-call':
        const toolData = chunk.data || chunk.payload
        const toolMessage = toolData?.message || 'Calling tool...'
        const toolName = toolData?.toolName || toolData?.args?.toolName || 'Unknown tool'
        return { ...prev, content: prev.content + `\n🔧 ${toolName}: ${toolMessage}\n` }
      
      case 'tool-call-delta':
        // Show incremental progress for tool call building
        const toolCallData = chunk.payload
        const toolCallName = toolCallData?.toolName || 'Tool'
        return {
          ...prev,
          content: prev.content.endsWith(`🔧 ${toolCallName}: Building call...\n`) 
            ? prev.content 
            : prev.content + `🔧 ${toolCallName}: Building call...\n`
        }
      
      case 'tool-result':
        const payload = chunk.payload || chunk.data
        const slideData = payload?.result
        
        // Show slide processing progress
        if (slideData && slideData.slideNumber && slideData.textContent) {
          const slideInfo = `📄 Slide ${slideData.slideNumber}/${slideData.totalSlides}: Processing content`
          return { ...prev, content: prev.content + `${slideInfo}\n` }
        } else {
          // Skip generic completion messages
          return prev
        }
      
      case 'text-start':
        return { ...prev, content: prev.content + '📝 Generating presentation script:\n\n' }
      
      case 'text-end':
        return { ...prev, textGenerationComplete: true }
      
      case 'finish':
        // Proactively close EventSource to prevent error events
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
        return {
          ...prev,
          isProcessing: false,
          textGenerationComplete: true,
          streamFinished: true,
        }
      
      // Silently handle unknown chunk types
      default:
        return prev
    }
  })
}
```

#### **StreamingOutput Component** (`/frontend/components/StreamingOutput.tsx`)

**Purpose**: Optimized text display with real-time rendering

**Key Features**:
- Performance-optimized text rendering
- Auto-scroll functionality
- Copy/clear controls
- Loading states and error handling

**Performance Optimizations**:
```typescript
<pre style={{ 
  margin: 0, 
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  transform: 'translateZ(0)', // GPU acceleration
  contain: 'layout style paint', // Prevent layout thrashing
}}>
  {content}
</pre>
```

## 🔄 **Data Flow**

### **1. Initialization**
```
User enters Google Slides URL
    ↓
SlideProcessor validates input
    ↓
Creates EventSource connection to /api/stream-slides
    ↓
API route connects to Mastra backend
```

### **2. Tool Execution Phase**
```
Mastra calls Google Slides API tools
    ↓
Streams tool-call chunks
    ↓
API route forwards to frontend
    ↓
SlideProcessor shows: "🔧 Google Slides API: Accessing..."
    ↓
Tool completes, streams tool-result chunks
    ↓
SlideProcessor shows: "✅ Slides processed: Continuing..."
```

### **3. Text Generation Phase**
```
Mastra receives text-start signal
    ↓
SlideProcessor shows: "📝 Generating presentation script:"
    ↓
AI generates text in small chunks (text-delta)
    ↓
Each chunk updates React state immediately
    ↓
StreamingOutput renders new content without blinking
    ↓
Text appears character-by-character in real-time
```

### **4. Completion**
```
Mastra sends text-end signal
    ↓
SlideProcessor sets textGenerationComplete = true
    ↓
Any subsequent tool-result chunks are hidden
    ↓
Stream ends with finish chunk
    ↓
UI shows completion state
```

## ⚡ **Performance Optimizations**

### **Backend Optimizations**
- **Chunked Processing**: Mastra sends small, frequent updates instead of waiting for completion
- **Tool Streaming**: Individual tool calls are streamed as they execute
- **Connection Reuse**: Single persistent connection for entire session

### **Frontend Optimizations**
- **Direct State Updates**: No buffering or batching that could cause delays
- **GPU Acceleration**: `transform: translateZ(0)` forces hardware acceleration
- **Layout Containment**: `contain: 'layout style paint'` prevents unnecessary reflows
- **Optimized Re-renders**: React state updates only when necessary

## 🐛 **Common Issues & Solutions**

### **Problem**: Text Blinking During Streaming
**Cause**: React re-rendering entire text block on each update
**Solution**: Use direct state updates with GPU acceleration and layout containment

### **Problem**: Text Duplication
**Cause**: Multiple text management systems (buffering + direct updates)
**Solution**: Single source of truth - EventSource → React state → DOM

### **Problem**: Tool Messages After Completion
**Cause**: Backend continues tool execution after text generation
**Solution**: Track `textGenerationComplete` state and filter late tool results

### **Problem**: Connection Errors
**Cause**: Network issues or backend unavailability
**Solution**: Proper error handling with user feedback and retry mechanisms

## 📝 **Stream Chunk Types**

| Chunk Type | Purpose | Frontend Action |
|------------|---------|-----------------|
| `text-delta` | AI-generated text piece | Append to content (handles both old format and payload.content) |
| `tool-call` | Tool execution start | Show tool activity message |
| `tool-call-delta` | Tool argument streaming | Show incremental tool building progress |
| `tool-result` | Tool execution complete | Show slide processing progress, skip generic messages |
| `text-start` | Text generation begins | Show generation header |
| `text-end` | Text generation complete | Mark text complete |
| `start` | Stream initialization | Initialize state |
| `finish` | Stream complete | Close EventSource, mark processing complete |
| `error` | Error occurred | Display error message |

## 🔗 **Connection Management**

### **EventSource Connection**
```typescript
const eventSource = new EventSource(`/api/stream-slides?presentationId=${id}`)

eventSource.onopen = () => console.log('Stream opened')
eventSource.onmessage = (event) => { /* Process chunks */ }
eventSource.onerror = (error) => { 
  // Simplified error handling since we close proactively on finish
  console.error('EventSource connection error:', error)
  setState(prev => ({ ...prev, isProcessing: false, error: 'Connection error. Please try again.' }))
  if (eventSourceRef.current) {
    eventSourceRef.current.close()
    eventSourceRef.current = null
  }
}

// Cleanup handled automatically in finish chunk
```

### **Connection Lifecycle**
1. **Open**: User submits form → EventSource created
2. **Active**: Chunks processed → UI updates in real-time
3. **Completion**: Finish chunk received → EventSource closed proactively to prevent error events
4. **Error**: Network issues → Show error message, allow retry
5. **Cleanup**: Component unmount or user stops → Graceful shutdown

## 🎯 **Key Benefits**

1. **Real-time Feedback**: Users see progress immediately with slide-by-slide updates
2. **Smooth Experience**: No jarring waits or sudden content appearances
3. **Transparency**: Tool calls and slide processing progress visible to user
4. **Performance**: Optimized for smooth rendering without blocking UI
5. **Reliability**: Proper error handling and proactive connection management
6. **Scalability**: Streaming reduces memory usage vs. waiting for complete response
7. **Clean Completion**: Proactive EventSource closure prevents false error messages

## 🛠️ **Performance Optimizations**

- **Flexible Payload Handling**: Supports both legacy and new Mastra chunk formats
- **Selective Message Display**: Shows relevant progress, hides verbose tool completion messages
- **Proactive Connection Management**: Closes EventSource on completion to prevent error events
- **React State Optimization**: Direct state updates without buffering conflicts
- **GPU Acceleration**: CSS transforms for smooth text rendering

## 🚀 **Future Enhancements**

- **Reconnection Logic**: Auto-retry on connection drops
- **Progress Indicators**: Show percentage completion
- **Chunk Buffering**: Optional batching for very high-frequency updates
- **WebSocket Upgrade**: For bi-directional communication
- **Compression**: Reduce bandwidth usage for large responses

---

This streaming architecture provides a robust, performant, and user-friendly way to display AI-generated content in real-time, making the application feel responsive and modern while handling the complexity of coordinating between multiple services and managing real-time data flow.
