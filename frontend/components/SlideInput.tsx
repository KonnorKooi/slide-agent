'use client'

import { useState, useCallback, useId } from 'react'
import { validateSlideInput, extractPresentationId } from '@/lib/mastra-client'
import { cn } from '@/lib/utils'

export interface SlideInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean, presentationId?: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  required?: boolean
  autoFocus?: boolean
}

export function SlideInput({
  value,
  onChange,
  onValidationChange,
  disabled = false,
  placeholder = 'Enter Google Slides URL or presentation ID...',
  className,
  required = false,
  autoFocus = false,
}: SlideInputProps) {
  const [error, setError] = useState<string>('')
  const [touched, setTouched] = useState(false)
  const inputId = useId()

  const validateInput = useCallback((inputValue: string) => {
    if (!inputValue.trim()) {
      if (required && touched) {
        setError('Please enter a Google Slides URL or presentation ID')
        onValidationChange?.(false)
      } else {
        setError('')
        onValidationChange?.(false)
      }
      return
    }

    const validation = validateSlideInput(inputValue)

    if (validation.isValid) {
      setError('')
      onValidationChange?.(true, validation.presentationId)
    } else {
      setError(validation.error || 'Invalid input')
      onValidationChange?.(false)
    }
  }, [required, touched, onValidationChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    validateInput(newValue)
  }

  const handleBlur = () => {
    setTouched(true)
    validateInput(value)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Allow default paste behavior, validation will happen in onChange
    const target = e.currentTarget
    setTimeout(() => {
      const pastedValue = target.value
      if (pastedValue) {
        setTouched(true)
        validateInput(pastedValue)
      }
    }, 0)
  }

  const hasError = error && touched
  const isValid = !hasError && value.trim() && validateSlideInput(value).isValid

  return (
    <div className={cn('slide-input-container', className)}>
      <label htmlFor={inputId} className="input-label">
        Google Slides URL or Presentation ID
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>

      <div className="input-wrapper">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'input',
            'slide-input',
            hasError && 'input-error',
            isValid && 'input-valid',
            disabled && 'input-disabled'
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          autoFocus={autoFocus}
          autoComplete="url"
          spellCheck="false"
        />

        {isValid && (
          <div className="input-success-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="var(--color-success)" />
              <path
                d="M6 10l2 2 6-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {hasError && (
        <p id={`${inputId}-error`} className="input-error-message" role="alert">
          {error}
        </p>
      )}

      {isValid && (
        <p className="input-help-text">
          Presentation ID: <code>{extractPresentationId(value)}</code>
        </p>
      )}
    </div>
  )
}

// CSS-in-JS styles (you could also put these in a separate CSS module)
const styles = `
.slide-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-indicator {
  color: var(--color-error);
  font-size: 1rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.slide-input {
  padding-right: 3rem;
}

.slide-input.input-error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgb(239 68 68 / 0.1);
}

.slide-input.input-valid {
  border-color: var(--color-success);
  box-shadow: 0 0 0 3px rgb(16 185 129 / 0.1);
}

.slide-input.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-success-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.input-error-message {
  font-size: 0.75rem;
  color: var(--color-error);
  margin: 0;
}

.input-help-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

.input-help-text code {
  background-color: var(--bg-secondary);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.75rem;
  color: var(--color-primary);
}
`

// Inject styles (in a real app, you'd put these in a CSS file)
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}