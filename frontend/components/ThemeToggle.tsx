'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { type Theme, getStoredTheme, toggleTheme, initializeTheme } from '@/lib/theme'

export interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ThemeToggle({
  className,
  size = 'md',
  showLabel = false,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    const currentTheme = initializeTheme()
    setTheme(currentTheme)
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const newTheme = toggleTheme(theme)
    setTheme(newTheme)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn('theme-toggle-skeleton', `theme-toggle-${size}`, className)}
        aria-hidden="true"
      />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'theme-toggle',
        `theme-toggle-${size}`,
        isDark && 'theme-toggle-dark',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          <div className="theme-toggle-icon">
            {isDark ? (
              // Moon icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 2a6 6 0 109 9 7 7 0 01-9-9z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              // Sun icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="currentColor" />
                <path
                  d="M8 1v2M8 13v2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M1 8h2M13 8h2M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}

// CSS styles
const styles = `
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: var(--transition-base);
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.theme-toggle:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.theme-toggle:hover {
  opacity: 0.8;
}

.theme-toggle-track {
  position: relative;
  border-radius: 1rem;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  transition: var(--transition-base);
}

.theme-toggle-dark .theme-toggle-track {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.theme-toggle-thumb {
  position: relative;
  border-radius: 50%;
  background-color: var(--bg-primary);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle-dark .theme-toggle-thumb {
  background-color: white;
  transform: translateX(var(--thumb-offset));
}

.theme-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: var(--transition-base);
}

.theme-toggle-dark .theme-toggle-icon {
  color: var(--color-primary);
}

.theme-toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  user-select: none;
}

/* Size variants */
.theme-toggle-sm .theme-toggle-track {
  width: 2.5rem;
  height: 1.25rem;
  --thumb-offset: 1.25rem;
}

.theme-toggle-sm .theme-toggle-thumb {
  width: 1rem;
  height: 1rem;
  margin: 0.125rem;
}

.theme-toggle-sm .theme-toggle-icon svg {
  width: 12px;
  height: 12px;
}

.theme-toggle-md .theme-toggle-track {
  width: 3rem;
  height: 1.5rem;
  --thumb-offset: 1.5rem;
}

.theme-toggle-md .theme-toggle-thumb {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0.125rem;
}

.theme-toggle-md .theme-toggle-icon svg {
  width: 14px;
  height: 14px;
}

.theme-toggle-lg .theme-toggle-track {
  width: 3.5rem;
  height: 1.75rem;
  --thumb-offset: 1.75rem;
}

.theme-toggle-lg .theme-toggle-thumb {
  width: 1.5rem;
  height: 1.5rem;
  margin: 0.125rem;
}

.theme-toggle-lg .theme-toggle-icon svg {
  width: 16px;
  height: 16px;
}

/* Skeleton for SSR */
.theme-toggle-skeleton {
  border-radius: 1rem;
  background-color: var(--bg-tertiary);
  opacity: 0.6;
}

.theme-toggle-skeleton.theme-toggle-sm {
  width: 2.5rem;
  height: 1.25rem;
}

.theme-toggle-skeleton.theme-toggle-md {
  width: 3rem;
  height: 1.5rem;
}

.theme-toggle-skeleton.theme-toggle-lg {
  width: 3.5rem;
  height: 1.75rem;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .theme-toggle-track {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .theme-toggle-track,
  .theme-toggle-thumb,
  .theme-toggle-icon {
    transition: none;
  }
}

/* Focus visible for better keyboard navigation */
.theme-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}