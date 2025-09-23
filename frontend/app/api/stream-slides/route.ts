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

  try {
    // Use non-streaming generate API directly
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

    // Return the complete result at once
    return new Response(
      JSON.stringify({ 
        type: 'complete',
        content: fullText,
        presentationId 
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Error generating presentation script:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
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