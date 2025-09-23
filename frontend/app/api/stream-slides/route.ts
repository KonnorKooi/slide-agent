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
                
                // Handle different chunk types from Mastra v5
                switch (chunk.type) {
                  case 'text-delta':
                    sendEvent('text-delta', { content: chunk.payload?.text || '' })
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