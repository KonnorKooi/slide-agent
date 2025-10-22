import { MastraClient } from '@mastra/client-js'

// Get the Mastra server URL from environment variables
// Default to localhost:4111 for development
const MASTRA_BASE_URL = process.env.NEXT_PUBLIC_MASTRA_URL || 'http://localhost:4111'

export const mastraClient = new MastraClient({
  baseUrl: MASTRA_BASE_URL,
  retries: 3,
  backoffMs: 300,
  maxBackoffMs: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Slide Agent specific functions
export const slideAgent = mastraClient.getAgent('SlideAgent')

export async function getSlideAgentDetails() {
  try {
    return await slideAgent.details()
  } catch (error) {
    console.error('Failed to get slide agent details:', error)
    throw new Error('Unable to connect to Slide Agent')
  }
}

// Type definitions for slide processing
export interface SlideProcessRequest {
  presentationId: string
  threadId?: string
}

export interface SlideBlock {
  slideNumber: number
  title: string
  script: string
  isComplete: boolean
  isStreaming?: boolean // Track if this slide is currently receiving text
}

export interface StreamChunk {
  type: 'text-delta' | 'text-start' | 'text-end' | 'tool-call' | 'tool-call-delta' | 'tool-result' | 'start' | 'finish' | 'error' | 'object' | 'slide' | 'slide-start' | 'slide-content' | 'slide-complete'
  runId?: string
  from?: string
  content?: string
  data?: any
  slide?: {
    slideNumber: number
    title: string
    script: string
    isComplete: boolean
  }
  slideNumber?: number
  slideTitle?: string
  slideContent?: string // Partial script content
  object?: {
    slides?: Array<{
      slideNumber: number
      title: string
      script: string
    }>
  }
  payload?: {
    content?: string
    message?: string
    toolName?: string
    toolCallId?: string
    argsTextDelta?: string
    args?: any
    result?: any
    text?: string
    [key: string]: any
  }
  error?: string
}

// Helper function to extract presentation ID from Google Slides URL
export function extractPresentationId(input: string): string {
  // If input is already a presentation ID (no slashes), return as-is
  if (!input.includes('/')) {
    return input.trim()
  }

  // Extract from full Google Slides URL
  const urlMatch = input.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  // Extract from shorter format
  const shortMatch = input.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (shortMatch) {
    return shortMatch[1]
  }

  // If no match found, assume it's already a presentation ID
  return input.trim()
}

// Validate if a string looks like a Google Slides presentation ID
export function isValidPresentationId(id: string): boolean {
  // Google Slides presentation IDs are typically 44 characters long
  // and contain letters, numbers, hyphens, and underscores
  const presentationIdRegex = /^[a-zA-Z0-9-_]{40,50}$/
  return presentationIdRegex.test(id)
}

// Helper function to validate Google Slides URL or ID
export function validateSlideInput(input: string): { isValid: boolean; presentationId?: string; error?: string } {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'Please enter a Google Slides URL or presentation ID' }
  }

  try {
    const presentationId = extractPresentationId(input)

    if (!isValidPresentationId(presentationId)) {
      return {
        isValid: false,
        error: 'Invalid Google Slides URL or presentation ID. Please check your input.'
      }
    }

    return { isValid: true, presentationId }
  } catch (error) {
    return {
      isValid: false,
      error: 'Unable to process the provided URL or ID. Please try again.'
    }
  }
}