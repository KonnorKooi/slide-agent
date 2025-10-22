import { NextRequest } from 'next/server'

// Helper function to generate style-specific prompts
function generatePrompt(presentationId: string, style: string): string {
  const basePrompt = `Generate a complete presentation script for presentation ID: ${presentationId}`
  
  const styleInstructions = {
    concise: `${basePrompt}

Style: CONCISE
- Keep explanations brief and to-the-point
- Focus on key highlights and main points
- Use bullet points and short sentences
- Aim for clarity and efficiency
- Avoid redundant information`,

    explanatory: `${basePrompt}

Style: EXPLANATORY  
- Provide detailed explanations with context
- Include background information and examples
- Explain the significance of each point
- Use clear, educational language
- Help the audience understand the why behind each concept`,

    formal: `${basePrompt}

Style: FORMAL
- Use professional, business-appropriate language
- Maintain a serious and authoritative tone
- Include proper transitions and structure
- Use industry-standard terminology
- Ensure content is suitable for corporate/academic settings`,

    storytelling: `${basePrompt}

Style: STORY-TELLING
- Create a narrative flow that engages the audience
- Use storytelling techniques and anecdotes
- Build connections between ideas like chapters in a story
- Include emotional elements and relatable examples
- Make the presentation memorable and compelling`
  }

  return styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.explanatory
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const presentationId = searchParams.get('presentationId')
  const style = searchParams.get('style') || 'explanatory'

  if (!presentationId) {
    return new Response(
      JSON.stringify({ error: 'Missing presentationId parameter' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Helper function to send SSE data
      const sendEvent = (type: string, data: any) => {
        const message = `data: ${JSON.stringify({ type, ...data })}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Mathematical state machine for JSON streaming
      // States represent our exact position in the JSON structure
      type ParseState =
        | { type: 'INIT' }
        | { type: 'IN_SLIDES_ARRAY' }
        | { type: 'IN_SLIDE_OBJECT', slideNum: number | null, title: string | null }
        | { type: 'IN_STRING_VALUE', field: 'slideNumber' | 'title' | 'script', slideNum: number | null, title: string | null, buffer: string }
        | { type: 'IN_NUMBER_VALUE', field: 'slideNumber', buffer: string }

      let state: ParseState = { type: 'INIT' }
      let charBuffer = '' // Buffer for pattern matching
      let escapeNext = false
      const slideScripts = new Map<number, string>() // Track sent script per slide

      const processChar = (char: string) => {
        charBuffer += char

        // State: INIT - looking for "slides":[
        if (state.type === 'INIT') {
          if (charBuffer.includes('"slides"')) {
            const afterSlides = charBuffer.substring(charBuffer.indexOf('"slides"') + 8)
            if (afterSlides.includes('[')) {
              state = { type: 'IN_SLIDES_ARRAY' }
              charBuffer = ''
              console.log('[State] → IN_SLIDES_ARRAY')
            }
          }
          // Keep only last 20 chars to avoid memory issues
          if (charBuffer.length > 20) charBuffer = charBuffer.substring(charBuffer.length - 20)
          return
        }

        // State: IN_SLIDES_ARRAY - looking for {
        if (state.type === 'IN_SLIDES_ARRAY') {
          if (char === '{') {
            state = { type: 'IN_SLIDE_OBJECT', slideNum: null, title: null }
            charBuffer = ''
            console.log('[State] → IN_SLIDE_OBJECT')
          } else if (char === ']') {
            state = { type: 'INIT' }
            console.log('[State] → INIT (end of slides)')
          }
          return
        }

        // State: IN_SLIDE_OBJECT - looking for field names
        if (state.type === 'IN_SLIDE_OBJECT') {
          // Look for "slideNumber":
          if (charBuffer.includes('"slideNumber"')) {
            const afterField = charBuffer.substring(charBuffer.indexOf('"slideNumber"') + 13)
            if (afterField.includes(':')) {
              state = { type: 'IN_NUMBER_VALUE', field: 'slideNumber', buffer: '' }
              charBuffer = ''
              console.log('[State] → IN_NUMBER_VALUE (slideNumber)')
              return
            }
          }

          // Look for "title":"
          if (charBuffer.includes('"title"')) {
            const afterField = charBuffer.substring(charBuffer.indexOf('"title"') + 7)
            if (afterField.includes(':') && afterField.includes('"')) {
              state = {
                type: 'IN_STRING_VALUE',
                field: 'title',
                slideNum: state.slideNum,
                title: state.title,
                buffer: ''
              }
              charBuffer = ''
              console.log('[State] → IN_STRING_VALUE (title)')
              return
            }
          }

          // Look for "script":"
          if (charBuffer.includes('"script"')) {
            const afterField = charBuffer.substring(charBuffer.indexOf('"script"') + 8)
            if (afterField.includes(':') && afterField.includes('"')) {
              console.log(`[Debug] About to emit slide-start. slideNum=${state.slideNum}, title="${state.title}"`)

              // Emit slide-start event now that we have slideNum and title
              if (state.slideNum && state.title && !isNaN(state.slideNum)) {
                if (!slideScripts.has(state.slideNum)) {
                  slideScripts.set(state.slideNum, '')
                  console.log(`[Event] slide-start: ${state.slideNum} - ${state.title}`)
                  sendEvent('slide-start', {
                    slideNumber: state.slideNum,
                    slideTitle: state.title
                  })
                } else {
                  console.log(`[Debug] Skipping slide-start for ${state.slideNum} - already sent`)
                }
              } else {
                console.log(`[Error] Cannot emit slide-start - missing data: slideNum=${state.slideNum}, title="${state.title}"`)
              }

              state = {
                type: 'IN_STRING_VALUE',
                field: 'script',
                slideNum: state.slideNum,
                title: state.title,
                buffer: ''
              }
              charBuffer = ''
              console.log('[State] → IN_STRING_VALUE (script)')
              return
            }
          }

          // Look for end of slide object
          if (char === '}') {
            state = { type: 'IN_SLIDES_ARRAY' }
            charBuffer = ''
            console.log('[State] → IN_SLIDES_ARRAY (end of slide)')
          }

          // Keep buffer manageable
          if (charBuffer.length > 30) charBuffer = charBuffer.substring(charBuffer.length - 30)
          return
        }

        // State: IN_NUMBER_VALUE - reading slideNumber
        if (state.type === 'IN_NUMBER_VALUE') {
          if (char >= '0' && char <= '9') {
            state.buffer += char
          } else if ((char === ',' || char === '}' || char === '\n') && state.buffer.length > 0) {
            // Number complete (only if we have digits)
            const slideNum = parseInt(state.buffer)
            console.log(`[Value] slideNumber = ${slideNum}`)
            state = { type: 'IN_SLIDE_OBJECT', slideNum, title: null }
            charBuffer = char
          }
          // Ignore spaces while waiting for digits
          return
        }

        // State: IN_STRING_VALUE - reading title or script
        if (state.type === 'IN_STRING_VALUE') {
          // Handle escape sequences
          if (escapeNext) {
            state.buffer += char
            escapeNext = false
            return
          }

          if (char === '\\') {
            state.buffer += char
            escapeNext = true
            return
          }

          // Check for closing quote
          if (char === '"') {
            // String complete
            if (state.field === 'title') {
              console.log(`[Value] title = "${state.buffer}"`)
              state = {
                type: 'IN_SLIDE_OBJECT',
                slideNum: state.slideNum,
                title: state.buffer
              }
              charBuffer = ''
            } else if (state.field === 'script') {
              console.log(`[Value] script complete (${state.buffer.length} chars)`)

              // Send slide-complete event to mark this slide as done
              if (state.slideNum) {
                console.log(`[Event] slide-complete: ${state.slideNum}`)
                sendEvent('slide-complete', {
                  slideNumber: state.slideNum
                })
              }

              state = {
                type: 'IN_SLIDE_OBJECT',
                slideNum: state.slideNum,
                title: state.title
              }
              charBuffer = ''
            }
            return
          }

          // Accumulate character
          state.buffer += char

          // For script field, emit character immediately
          if (state.field === 'script' && state.slideNum) {
            sendEvent('slide-content', {
              slideNumber: state.slideNum,
              slideContent: char
            })
          }

          return
        }
      }

      // Buffer for accumulating text that might be JSON
      let textBuffer = ''
      let isAccumulatingJson = false

      try {
        // Send start event
        sendEvent('start', { presentationId, style })

        // Generate style-specific prompt
        const prompt = generatePrompt(presentationId, style)

        // Make streaming call to Mastra API
        const mastraResponse = await fetch('http://localhost:4111/api/agents/SlideAgent/stream/vnext', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: prompt
            }],
            memory: {
              thread: `presentation-${presentationId}-${style}-${Date.now()}`,
              resource: 'slide-agent'
            }
          })
        })

        if (!mastraResponse.ok) {
          throw new Error(`Mastra API error: ${mastraResponse.status}`)
        }

        // Process the streaming response
        const reader = mastraResponse.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim()
              
              // Skip [DONE] marker
              if (dataStr === '[DONE]') {
                break
              }

              try {
                const chunk = JSON.parse(dataStr)

                // Debug logging
                if (chunk.type === 'object' || chunk.type === 'text-delta' || chunk.type === 'finish' || chunk.type === 'text-end' || chunk.type === 'text-start') {
                  console.log('[API Route] Received chunk type:', chunk.type, 'payload:', JSON.stringify(chunk.payload || chunk.object || {}).substring(0, 200))
                }

                // Handle different chunk types from Mastra v5
                switch (chunk.type) {
                  case 'object':
                    // Forward structured output chunks with slide data
                    sendEvent('object', {
                      object: chunk.object || chunk.payload
                    })
                    break

                  case 'text-delta':
                    const textContent = chunk.payload?.text || chunk.payload?.content || ''

                    // Accumulate text to detect JSON
                    textBuffer += textContent

                    // Check if we're starting to accumulate JSON
                    if (!isAccumulatingJson) {
                      const trimmed = textBuffer.trim()
                      if (trimmed.startsWith('```json') || trimmed.startsWith('```\n{') || trimmed.startsWith('{')) {
                        isAccumulatingJson = true
                        console.log('[API Route] Started streaming JSON parsing')
                      }
                    }

                    // If we're accumulating JSON, process character by character
                    if (isAccumulatingJson) {
                      for (const char of textContent) {
                        processChar(char)
                      }
                    } else {
                      // Only send text-delta events if we're not accumulating JSON
                      sendEvent('text-delta', { content: textContent })
                    }
                    break

                  case 'text-start':
                    sendEvent('text-start', { messageId: chunk.payload?.id })
                    break

                  case 'text-end':
                    sendEvent('text-end', { messageId: chunk.payload?.id })
                    break
                  
                  case 'step-start':
                    // This is when a tool/function is being called
                    const request = chunk.payload?.request
                    const tools = request?.body?.tools
                    
                    if (tools && tools.length > 0) {
                      // Look for specific tool names
                      const hasSlideTools = tools.some((tool: any) => 
                        tool.name === 'getSlideCount' || tool.name === 'getSlide'
                      )
                      
                      if (hasSlideTools) {
                        sendEvent('tool-call', {
                          data: {
                            toolName: 'Google Slides API',
                            message: 'Accessing your Google Slides presentation...',
                            status: 'calling'
                          }
                        })
                      } else {
                        sendEvent('tool-call', {
                          data: {
                            toolName: 'Processing',
                            message: 'Analyzing request...',
                            status: 'calling'
                          }
                        })
                      }
                    }
                    break
                  
                  case 'step-finish':
                    // Tool execution completed
                    sendEvent('tool-result', {
                      data: {
                        toolName: 'Slides processed',
                        message: 'Continuing with script generation...',
                        status: 'completed'
                      }
                    })
                    break
                  
                  case 'finish':
                    sendEvent('finish', { presentationId })
                    break
                  
                  case 'start':
                    // Already sent start event
                    break
                  
                  default:
                    // Silently handle unknown chunk types
                    break
                }
              } catch (parseError) {
                console.log('Failed to parse chunk:', dataStr)
              }
            }
          }
        }

        // Send final finish event if not already sent
        sendEvent('finish', { presentationId })

      } catch (error) {
        console.error('Error in stream processing:', error)
        sendEvent('error', {
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      } finally {
        // Close the stream
        controller.close()
      }
    },

    cancel() {
      console.log('Stream cancelled by client')
    },
  })

  // Return Server-Sent Events response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}