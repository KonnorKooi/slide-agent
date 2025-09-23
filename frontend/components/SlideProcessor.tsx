'use client'

import React, { useState, useCallback } from 'react'
import { SlideInput } from './SlideInput'
import { StreamingOutput } from './StreamingOutput'
import { SubmitButton } from './SubmitButton'
import { ThemeToggle } from './ThemeToggle'
import { validateSlideInput } from '@/lib/mastra-client'
import { cn, formatError } from '@/lib/utils'

export interface SlideProcessorProps {
  className?: string
}

interface ProcessingState {
  isProcessing: boolean
  content: string
  error: string | null
  presentationId: string | null
}

export function SlideProcessor({ className }: SlideProcessorProps) {
  const [input, setInput] = useState('')
  const [isValidInput, setIsValidInput] = useState(false)
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    content: '',
    error: null,
    presentationId: null,
  })

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
  }, [])

  const handleValidationChange = useCallback((isValid: boolean, id?: string) => {
    setIsValidInput(isValid)
    setPresentationId(id || null)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidInput || !presentationId || state.isProcessing) {
      return
    }

    // Clear previous state
    setState({
      isProcessing: true,
      content: '',
      error: null,
      presentationId,
    })

    try {
      // Make a simple fetch request to the API
      const response = await fetch(
        `/api/stream-slides?presentationId=${encodeURIComponent(presentationId)}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // Set the complete content at once
      setState(prev => ({
        ...prev,
        isProcessing: false,
        content: result.content || '',
      }))

    } catch (error) {
      console.error('Error generating script:', error)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: formatError(error),
      }))
    }
  }, [isValidInput, presentationId, state.isProcessing])

  const handleClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      content: '',
      error: null,
    }))
  }, [])

  const handleCopy = useCallback(() => {
    // Optional: Add analytics or user feedback here
    console.log('Content copied to clipboard')
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

              <div className="form-actions">
                <SubmitButton
                  type="submit"
                  disabled={!isValidInput || state.isProcessing}
                  isLoading={state.isProcessing}
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
                  {state.isProcessing ? 'Generating Script...' : 'Generate Script'}
                </SubmitButton>
              </div>
            </form>
          </section>

          {/* Output Section */}
          <section className="output-section">
            <StreamingOutput
              content={state.content}
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