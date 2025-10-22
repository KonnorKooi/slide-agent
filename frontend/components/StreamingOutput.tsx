'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn, copyToClipboard, formatError } from '@/lib/utils'
import type { SlideBlock } from '@/lib/mastra-client'

export interface StreamingOutputProps {
  slides: SlideBlock[]
  toolStatus: string[]
  isStreaming: boolean
  error?: string | null
  onCopy?: () => void
  onClear?: () => void
  className?: string
  autoScroll?: boolean
  showCopyButton?: boolean
  showClearButton?: boolean
  placeholder?: string
}

export function StreamingOutput({
  slides,
  toolStatus,
  isStreaming,
  error,
  onCopy,
  onClear,
  className,
  autoScroll = true,
  showCopyButton = true,
  showClearButton = true,
  placeholder = 'Your presentation script will appear here...',
}: StreamingOutputProps) {
  const outputRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showToolStatus, setShowToolStatus] = useState(true)

  // Auto-scroll to bottom when new content is added (throttled)
  useEffect(() => {
    if (autoScroll && isNearBottom && outputRef.current) {
      // Use requestAnimationFrame to throttle scrolling
      const scrollToBottom = () => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
      }

      const rafId = requestAnimationFrame(scrollToBottom)
      return () => cancelAnimationFrame(rafId)
    }
  }, [slides, toolStatus, autoScroll, isNearBottom])

  // Track if user is near the bottom of the scroll area
  const handleScroll = useCallback(() => {
    if (!outputRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = outputRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    setIsNearBottom(distanceFromBottom < 100) // Within 100px of bottom
  }, [])

  const handleCopy = useCallback(async () => {
    if (slides.length === 0) return

    try {
      // Format slides as readable text for copying
      const formattedContent = slides
        .map(slide => `Slide ${slide.slideNumber} - "${slide.title}"\n\n${slide.script}`)
        .join('\n\n---\n\n')

      await copyToClipboard(formattedContent)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }, [slides, onCopy])

  const handleClear = useCallback(() => {
    onClear?.()
  }, [onClear])

  const hasContent = slides.length > 0 || toolStatus.length > 0
  const showPlaceholder = !hasContent && !isStreaming && !error

  return (
    <div className={cn('streaming-output-container', className)}>
      {/* Header with controls */}
      <div className="output-header">
        <div className="output-status">
          {isStreaming && (
            <div className="streaming-indicator">
              <div className="streaming-dot"></div>
              <span>Generating script...</span>
            </div>
          )}
          {error && (
            <div className="error-indicator">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="var(--color-error)" />
                <path d="M8 4v4M8 10h0" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Error occurred</span>
            </div>
          )}
          {!isStreaming && hasContent && !error && (
            <div className="complete-indicator">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="var(--color-success)" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Script generated</span>
            </div>
          )}
        </div>

        <div className="output-controls">
          {showCopyButton && hasContent && (
            <button
              onClick={handleCopy}
              className="btn btn-secondary output-btn"
              title="Copy to clipboard"
              disabled={copied}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M6 3V2a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}

          {showClearButton && (hasContent || error) && !isStreaming && (
            <button
              onClick={handleClear}
              className="btn btn-secondary output-btn"
              title="Clear output"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 6h10M8 3v10M5 6v6a1 1 0 001 1h4a1 1 0 001-1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Output content area */}
      <div
        ref={outputRef}
        className={cn(
          'output-content',
          isStreaming && 'streaming',
          error && 'has-error'
        )}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Presentation script output"
      >
        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="var(--color-error)" />
              <path d="M10 6v4M10 14h0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              <strong>Error:</strong> {formatError(error)}
            </div>
          </div>
        )}

        {showPlaceholder && (
          <div className="placeholder-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12h6M9 16h6M9 8h6M3 4h18a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z"
                stroke="var(--text-muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>{placeholder}</p>
          </div>
        )}

        {/* Tool Status Section */}
        {toolStatus.length > 0 && (
          <div className="tool-status-section">
            <button
              className="tool-status-toggle"
              onClick={() => setShowToolStatus(!showToolStatus)}
              aria-expanded={showToolStatus}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  transform: showToolStatus ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Processing Status ({toolStatus.length} updates)</span>
            </button>
            {showToolStatus && (
              <div className="tool-status-content">
                {toolStatus.map((status, index) => (
                  <div key={index} className="tool-status-item">
                    {status}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Slides Section */}
        {slides.length > 0 && (
          <div className="slides-container">
            {slides.map((slide) => (
              <div key={slide.slideNumber} className={`slide-block ${slide.isStreaming ? 'streaming' : ''}`}>
                <div className="slide-header">
                  <span className="slide-number">Slide {slide.slideNumber}</span>
                  <h3 className="slide-title">{slide.title}</h3>
                  {slide.isStreaming && (
                    <span className="streaming-badge">
                      <span className="streaming-dot"></span>
                      Generating...
                    </span>
                  )}
                </div>
                <div className="slide-script">
                  {slide.script}
                  {slide.isStreaming && <span className="cursor-blink">|</span>}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="streaming-indicator-inline">
                <span className="streaming-dot"></span>
                Generating slides...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-scroll notification */}
      {!isNearBottom && isStreaming && (
        <button
          onClick={() => {
            setIsNearBottom(true)
            if (outputRef.current) {
              outputRef.current.scrollTop = outputRef.current.scrollHeight
            }
          }}
          className="scroll-to-bottom"
          title="Scroll to bottom"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          New content
        </button>
      )}
    </div>
  )
}

// CSS styles
const styles = `
.streaming-output-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  background-color: var(--bg-primary);
  overflow: hidden;
  position: relative;
}

.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-primary);
  background-color: var(--bg-secondary);
  flex-shrink: 0;
}

.output-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary);
}

.streaming-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.error-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-error);
}

.complete-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-success);
}

.output-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.output-btn {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  gap: 0.375rem;
}

.output-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  background-color: var(--bg-primary);
}

.output-content.has-error {
  padding: 1rem;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: rgb(239 68 68 / 0.1);
  border: 1px solid rgb(239 68 68 / 0.2);
  border-radius: 0.5rem;
  color: var(--color-error);
  font-family: system-ui, -apple-system, sans-serif;
}

.placeholder-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: var(--text-muted);
  text-align: center;
  font-family: system-ui, -apple-system, sans-serif;
}

.placeholder-message p {
  margin: 0;
  font-size: 0.875rem;
}

/* Tool Status Section */
.tool-status-section {
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: var(--bg-secondary);
}

.tool-status-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: left;
  transition: background-color 0.2s;
}

.tool-status-toggle:hover {
  background-color: var(--bg-primary);
}

.tool-status-content {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-primary);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.8125rem;
  max-height: 200px;
  overflow-y: auto;
}

.tool-status-item {
  padding: 0.375rem 0;
  color: var(--text-muted);
  line-height: 1.5;
}

/* Slides Container */
.slides-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.slide-block {
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.5rem;
  background-color: var(--bg-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--color-primary);
}

.slide-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--border-primary);
}

.slide-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4rem;
  padding: 0.375rem 0.75rem;
  background-color: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  letter-spacing: 0.025em;
}

.slide-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.slide-script {
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 0.9375rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.streaming-indicator-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-style: italic;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.scroll-to-bottom {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: var(--transition-base);
}

.scroll-to-bottom:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Streaming indicators */
.streaming-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: auto;
}

.streaming-dot {
  width: 6px;
  height: 6px;
  background-color: currentColor;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.cursor-blink {
  display: inline-block;
  margin-left: 2px;
  font-weight: 400;
  animation: blink 1s step-end infinite;
  color: var(--color-primary);
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.slide-block.streaming {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}