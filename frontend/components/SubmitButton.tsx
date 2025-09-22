'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({
    children,
    isLoading = false,
    loadingText = 'Processing...',
    icon,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled,
    className,
    ...props
  }, ref) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'submit-button',
          `submit-button-${variant}`,
          `submit-button-${size}`,
          fullWidth && 'submit-button-full',
          isLoading && 'submit-button-loading',
          className
        )}
        aria-disabled={isDisabled}
        {...props}
      >
        <span className="submit-button-content">
          {isLoading ? (
            <>
              <div className="loading-spinner" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="9.42 9.42"
                    transform="rotate(-90 8 8)"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from="-90 8 8"
                      to="270 8 8"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              {icon && <span className="submit-button-icon">{icon}</span>}
              <span>{children}</span>
            </>
          )}
        </span>
      </button>
    )
  }
)

SubmitButton.displayName = 'SubmitButton'

// CSS styles
const styles = `
.submit-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: var(--transition-base);
  text-decoration: none;
  font-family: inherit;
  user-select: none;
  white-space: nowrap;
  vertical-align: middle;
}

.submit-button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Variants */
.submit-button-primary {
  background-color: var(--color-primary);
  color: white;
  box-shadow: var(--button-shadow);
}

.submit-button-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.submit-button-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.submit-button-secondary:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  border-color: var(--border-secondary);
}

.submit-button-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.submit-button-outline:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
}

/* Sizes */
.submit-button-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  min-height: 2rem;
}

.submit-button-md {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  min-height: 2.5rem;
}

.submit-button-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
  min-height: 3rem;
}

/* Full width */
.submit-button-full {
  width: 100%;
}

/* Loading state */
.submit-button-loading {
  pointer-events: none;
}

.submit-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.loading-spinner svg {
  width: 100%;
  height: 100%;
}

/* Animation for loading state */
.submit-button-loading .submit-button-content {
  animation: loading-fade 0.2s ease-in-out;
}

@keyframes loading-fade {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

/* Focus visible for keyboard navigation */
.submit-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .submit-button-primary {
    border: 1px solid transparent;
  }

  .submit-button-secondary {
    border: 1px solid var(--text-primary);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .submit-button {
    transition: none;
  }

  .submit-button:hover:not(:disabled) {
    transform: none;
  }

  .loading-spinner svg animateTransform {
    animation-duration: 2s;
  }
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}