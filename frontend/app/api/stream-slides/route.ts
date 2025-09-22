import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const presentationId = searchParams.get('presentationId')

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
        sendEvent('start', { presentationId })

        let response

        // Make direct HTTP call to Mastra API using streamVNext
        try {
          const mastraResponse = await fetch('http://localhost:4111/api/agents/SlideAgent/stream/vnext', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{
                role: 'user',
                content: `Generate a complete presentation script for presentation ID: ${presentationId}`
              }],
              memory: {
                thread: `presentation-${presentationId}-${Date.now()}`,
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
                try {
                  const chunk = JSON.parse(line.slice(6))

                  if (chunk.type === 'text-delta') {
                    sendEvent('text-delta', { content: chunk.textDelta || chunk.delta || '' })
                  } else if (chunk.type === 'tool-call') {
                    sendEvent('tool-call', {
                      data: {
                        toolName: chunk.toolName,
                        toolCallId: chunk.toolCallId,
                        args: chunk.args,
                      }
                    })
                  } else if (chunk.type === 'finish') {
                    console.log('Stream finished:', chunk)
                    break
                  }
                } catch (parseError) {
                  console.log('Failed to parse chunk:', line)
                }
              }
            }
          }

        } catch (streamError: any) {
          console.log('StreamVNext HTTP call failed, falling back to generate:', streamError.message)

          // Fallback to direct generateVNext HTTP call
          try {
            const generateResponse = await fetch('http://localhost:4111/api/agents/SlideAgent/generate/vnext', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [{
                  role: 'user',
                  content: `Generate a complete presentation script for presentation ID: ${presentationId}`
                }],
                memory: {
                  thread: `presentation-${presentationId}-${Date.now()}`,
                  resource: 'slide-agent'
                }
              })
            })

            if (!generateResponse.ok) {
              throw new Error(`Generate API error: ${generateResponse.status}`)
            }

            const result = await generateResponse.json()
            const fullText = result.text || ''
            const words = fullText.split(' ')

            // Simulate streaming by sending the content in chunks
            for (let i = 0; i < words.length; i += 3) {
              const chunk = words.slice(i, i + 3).join(' ') + ' '
              sendEvent('text-delta', { content: chunk })

              // Add small delay to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 50))
            }

          } catch (generateError) {
            console.error('Both streaming and generate failed:', generateError)
            sendEvent('error', {
              error: 'Failed to generate presentation script. Please try again.'
            })
            return
          }
        }

        // Send final finish event
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