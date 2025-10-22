'use client'

import React, { useState, useCallback, useRef } from 'react'
import { SlideInput } from './SlideInput'
import { StreamingOutput } from './StreamingOutput'
import { SubmitButton } from './SubmitButton'
import { ThemeToggle } from './ThemeToggle'
import { PresentationStyleSelector, type PresentationStyle } from './PresentationStyleSelector'
import { validateSlideInput, type StreamChunk, type SlideBlock } from '@/lib/mastra-client'
import { cn, formatError } from '@/lib/utils'

export interface SlideProcessorProps {
  className?: string
}

interface ProcessingState {
  isProcessing: boolean
  toolStatus: string[]
  slides: SlideBlock[]
  error: string | null
  presentationId: string | null
  textGenerationComplete: boolean
  streamFinished: boolean
}

export function SlideProcessor({ className }: SlideProcessorProps) {
  const [input, setInput] = useState('')
  const [isValidInput, setIsValidInput] = useState(false)
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const [presentationStyle, setPresentationStyle] = useState<PresentationStyle>('explanatory')
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    toolStatus: [],
    slides: [],
    error: null,
    presentationId: null,
    textGenerationComplete: false,
    streamFinished: false,
  })

  // Ref to track the EventSource connection
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
  }, [])

  const handleValidationChange = useCallback((isValid: boolean, id?: string) => {
    setIsValidInput(isValid)
    setPresentationId(id || null)
  }, [])

  const handleStyleChange = useCallback((style: PresentationStyle) => {
    setPresentationStyle(style)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidInput || !presentationId || state.isProcessing) {
      return
    }

    // Clear previous state
    setState({
      isProcessing: true,
      toolStatus: [],
      slides: [],
      error: null,
      presentationId,
      textGenerationComplete: false,
      streamFinished: false,
    })

    try {
      // Create EventSource connection to streaming API
      const eventSource = new EventSource(
        `/api/stream-slides?presentationId=${encodeURIComponent(presentationId)}&style=${encodeURIComponent(presentationStyle)}`
      )
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('Stream connection opened')
      }

      eventSource.onmessage = (event) => {
        try {
          const chunk: StreamChunk = JSON.parse(event.data)

          setState(prev => {
            switch (chunk.type) {
              case 'slide-start':
                // A new slide is starting - create the slide block with empty script
                if (chunk.slideNumber && chunk.slideTitle) {
                  const updatedSlides = [...prev.slides]
                  const existingIndex = updatedSlides.findIndex(s => s.slideNumber === chunk.slideNumber)

                  const newSlide: SlideBlock = {
                    slideNumber: chunk.slideNumber,
                    title: chunk.slideTitle,
                    script: '', // Start with empty script
                    isComplete: false,
                    isStreaming: true
                  }

                  if (existingIndex >= 0) {
                    updatedSlides[existingIndex] = newSlide
                  } else {
                    updatedSlides.push(newSlide)
                    updatedSlides.sort((a, b) => a.slideNumber - b.slideNumber)
                  }

                  console.log(`[Frontend] Started slide ${chunk.slideNumber}: ${chunk.slideTitle}`)

                  return {
                    ...prev,
                    slides: updatedSlides,
                  }
                }
                return prev

              case 'slide-content':
                // Append content to the slide's script character by character
                if (chunk.slideNumber && chunk.slideContent) {
                  const updatedSlides = [...prev.slides]
                  const slideIndex = updatedSlides.findIndex(s => s.slideNumber === chunk.slideNumber)

                  if (slideIndex >= 0) {
                    updatedSlides[slideIndex] = {
                      ...updatedSlides[slideIndex],
                      script: updatedSlides[slideIndex].script + chunk.slideContent,
                      isStreaming: true // Keep streaming flag while receiving content
                    }
                  }

                  return {
                    ...prev,
                    slides: updatedSlides,
                  }
                }
                return prev

              case 'slide-complete':
                // Mark slide as complete - stop showing "Generating..." badge
                if (chunk.slideNumber) {
                  const updatedSlides = [...prev.slides]
                  const slideIndex = updatedSlides.findIndex(s => s.slideNumber === chunk.slideNumber)

                  if (slideIndex >= 0) {
                    updatedSlides[slideIndex] = {
                      ...updatedSlides[slideIndex],
                      isStreaming: false,
                      isComplete: true
                    }
                  }

                  console.log(`[Frontend] Completed slide ${chunk.slideNumber}`)

                  return {
                    ...prev,
                    slides: updatedSlides,
                  }
                }
                return prev

              case 'slide':
                // Handle individual slide chunks (complete slide - fallback)
                if (chunk.slide) {
                  const updatedSlides = [...prev.slides]
                  const existingIndex = updatedSlides.findIndex(s => s.slideNumber === chunk.slide!.slideNumber)

                  if (existingIndex >= 0) {
                    updatedSlides[existingIndex] = chunk.slide
                  } else {
                    updatedSlides.push(chunk.slide)
                    updatedSlides.sort((a, b) => a.slideNumber - b.slideNumber)
                  }

                  console.log(`[Frontend] Received complete slide ${chunk.slide.slideNumber}: ${chunk.slide.title}`)

                  return {
                    ...prev,
                    slides: updatedSlides,
                  }
                }
                return prev

              case 'object':
                // Handle structured output with all slides at once (fallback)
                if (chunk.object?.slides) {
                  const newSlides = chunk.object.slides.map(slide => ({
                    ...slide,
                    isComplete: true
                  }))
                  return {
                    ...prev,
                    slides: newSlides,
                  }
                }
                return prev

              case 'text-delta':
                // This might contain partial JSON during streaming
                // We'll handle complete objects via 'slide' or 'object' chunks
                return prev

              case 'start':
                return prev // Already handled in state initialization

              case 'finish':
                // Close EventSource immediately to prevent error event
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

              case 'error':
                return {
                  ...prev,
                  isProcessing: false,
                  error: chunk.error || 'An error occurred',
                }

              case 'tool-call':
                // Handle both old and new format for tool calls
                const toolData = chunk.data || chunk.payload
                const toolMessage = toolData?.message || 'Calling tool...'
                const toolName = toolData?.toolName || toolData?.args?.toolName || 'Unknown tool'
                return {
                  ...prev,
                  toolStatus: [...prev.toolStatus, `🔧 ${toolName}: ${toolMessage}`],
                }

              case 'tool-call-delta':
                // Handle streaming tool call arguments - just show progress
                const toolCallData = chunk.payload
                const toolCallName = toolCallData?.toolName || 'Tool'
                const buildingMessage = `🔧 ${toolCallName}: Building call...`

                // Only add if not already the last status message
                if (prev.toolStatus[prev.toolStatus.length - 1] !== buildingMessage) {
                  return {
                    ...prev,
                    toolStatus: [...prev.toolStatus, buildingMessage],
                  }
                }
                return prev

              case 'tool-result':
                // Handle the new payload structure for tool results
                const payload = chunk.payload || chunk.data

                // Extract slide information if available
                const slideData = payload?.result
                if (slideData && slideData.slideNumber && slideData.textContent) {
                  const slideInfo = `📄 Slide ${slideData.slideNumber}/${slideData.totalSlides}: Processing content`
                  return {
                    ...prev,
                    toolStatus: [...prev.toolStatus, slideInfo],
                  }
                }
                return prev

              case 'text-start':
                // Add a separator for when actual text generation starts
                return {
                  ...prev,
                  toolStatus: [...prev.toolStatus, '📝 Generating presentation script...'],
                }

              case 'text-end':
                // Text generation completed - mark it so we stop showing tool results
                return {
                  ...prev,
                  textGenerationComplete: true,
                }

              default:
                // Silently handle any other chunk types without logging
                return prev
            }
          })
        } catch (error) {
          console.error('Error parsing stream chunk:', error)
          console.error('Raw chunk data:', event.data)
        }
      }

      eventSource.onerror = (error) => {
        // Since we close the connection on finish, any error here is likely genuine
        console.error('EventSource connection error:', error)
        
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'Connection error. Please try again.',
        }))
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      }

    } catch (error) {
      console.error('Error starting stream:', error)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: formatError(error),
      }))
    }
  }, [isValidInput, presentationId, state.isProcessing])

  const handleStop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setState(prev => ({
      ...prev,
      isProcessing: false,
    }))
  }, [])

  const handleClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      toolStatus: [],
      slides: [],
      error: null,
      textGenerationComplete: false,
    }))
  }, [])

  const handleCopy = useCallback(() => {
    // Optional: Add analytics or user feedback here
    console.log('Content copied to clipboard')
  }, [])

  // Clean up EventSource on unmount
  React.useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <div className={cn('slide-processor', className)}>
      {/* Header */}
      <header className="slide-processor-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Slide Script Generator</h1>
            <p>Generate presentation scripts from Google Slides</p>
          </div>
          <ThemeToggle size="md" />
        </div>
      </header>

      {/* Main Content */}
      <main className="slide-processor-main">
        <div className="processor-container">
          {/* Input Section */}
          <section className="input-section">
            <form onSubmit={handleSubmit} className="input-form">
              <SlideInput
                value={input}
                onChange={handleInputChange}
                onValidationChange={handleValidationChange}
                disabled={state.isProcessing}
                required
                autoFocus
                placeholder="Enter Google Slides URL or presentation ID..."
              />

              <PresentationStyleSelector
                value={presentationStyle}
                onChange={handleStyleChange}
                disabled={state.isProcessing}
              />

              <div className="form-actions">
                {state.isProcessing ? (
                  <SubmitButton
                    type="button"
                    onClick={handleStop}
                    variant="secondary"
                    size="lg"
                    fullWidth
                    icon={
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="4" y="4" width="8" height="8" fill="currentColor" />
                      </svg>
                    }
                  >
                    Stop Generation
                  </SubmitButton>
                ) : (
                  <SubmitButton
                    type="submit"
                    disabled={!isValidInput}
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8l3 3 7-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  >
                    Generate Script
                  </SubmitButton>
                )}
              </div>
            </form>
          </section>

          {/* Output Section */}
          <section className="output-section">
            <StreamingOutput
              slides={state.slides}
              toolStatus={state.toolStatus}
              isStreaming={state.isProcessing}
              error={state.error}
              onCopy={handleCopy}
              onClear={handleClear}
              placeholder="Your presentation script will appear here as it's generated..."
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="slide-processor-footer">
        <p>
          Powered by{' '}
          <a href="https://mastra.ai" target="_blank" rel="noopener noreferrer">
            Mastra
          </a>{' '}
          • Built with Next.js
        </p>
      </footer>
    </div>
  )
}

// CSS styles
const styles = `
.slide-processor {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.slide-processor-header {
  border-bottom: 1px solid var(--border-primary);
  background-color: var(--bg-secondary);
  padding: 1.5rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-title p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.slide-processor-main {
  flex: 1;
  padding: 2rem 0;
}

.processor-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  height: 100%;
}

@media (min-width: 1024px) {
  .processor-container {
    grid-template-columns: 400px 1fr;
    gap: 3rem;
  }
}

.input-section {
  display: flex;
  flex-direction: column;
}

.input-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.output-section {
  min-height: 500px;
  height: 100%;
}

@media (min-width: 1024px) {
  .output-section {
    min-height: 600px;
  }
}

.slide-processor-footer {
  border-top: 1px solid var(--border-primary);
  background-color: var(--bg-secondary);
  padding: 1rem 0;
  text-align: center;
}

.slide-processor-footer p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.slide-processor-footer a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.slide-processor-footer a:hover {
  text-decoration: underline;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .slide-processor-main {
    padding: 1rem 0;
  }

  .processor-container {
    padding: 0 0.5rem;
    gap: 1.5rem;
  }

  .output-section {
    min-height: 400px;
  }
}

/* Focus management */
.slide-processor:focus-within .input-section {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
  border-radius: 0.5rem;
}

/* Loading state adjustments */
.slide-processor:has(.submit-button-loading) .input-section {
  opacity: 0.8;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}