'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type PresentationStyle = 'concise' | 'explanatory' | 'formal' | 'storytelling'

export interface PresentationStyleSelectorProps {
  value: PresentationStyle
  onChange: (style: PresentationStyle) => void
  disabled?: boolean
  className?: string
}

const styles: Array<{
  value: PresentationStyle
  label: string
  description: string
}> = [
  {
    value: 'concise',
    label: 'Concise',
    description: 'Brief, to-the-point script with key highlights'
  },
  {
    value: 'explanatory',
    label: 'Explanatory',
    description: 'Detailed explanations with context and examples'
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Professional, business-appropriate tone'
  },
  {
    value: 'storytelling',
    label: 'Story-telling',
    description: 'Narrative approach with engaging flow'
  }
]

export function PresentationStyleSelector({
  value,
  onChange,
  disabled = false,
  className
}: PresentationStyleSelectorProps) {
  return (
    <div className={cn('presentation-style-selector', className)}>
      <label className="style-selector-label">
        Presentation Style
      </label>
      <div className="style-selector-grid">
        {styles.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => onChange(style.value)}
            disabled={disabled}
            className={cn(
              'style-option',
              value === style.value && 'style-option-selected',
              disabled && 'style-option-disabled'
            )}
            aria-pressed={value === style.value}
            title={style.description}
          >
            <span className="style-label">{style.label}</span>
            <span className="style-description">{style.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// CSS styles
const styles_css = `
.presentation-style-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.style-selector-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.style-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .style-selector-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.style-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #ffffff;
  color: #1a202c;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
  min-height: 4rem;
}

@media (min-width: 768px) {
  .style-option {
    padding: 1rem 0.75rem;
    min-height: 4.5rem;
  }
}

.style-option:hover:not(.style-option-disabled) {
  border-color: #3b82f6;
  background-color: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.style-option:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.style-option-selected {
  border-color: #3b82f6;
  background-color: #3b82f6;
  color: white;
}

.style-option-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.style-label {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  color: inherit;
}

.style-description {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Ensure description is visible on hover */
.style-option:hover:not(.style-option-disabled) .style-description {
  color: #475569;
}

/* Ensure description is visible when selected */
.style-option-selected .style-description {
  color: rgba(255, 255, 255, 0.9);
}

/* Hover effects */
.style-option:hover:not(.style-option-disabled) {
  transform: translateY(-1px);
}

.style-option:active:not(.style-option-disabled) {
  transform: translateY(0);
}

/* Dark mode improvements for better contrast */
@media (prefers-color-scheme: dark) {
  .style-selector-label {
    color: #e2e8f0;
  }

  .style-option {
    border-color: #4a5568;
    background-color: #2d3748;
    color: #e2e8f0;
  }
  
  .style-option:hover:not(.style-option-disabled) {
    border-color: #3b82f6;
    background-color: #374151;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .style-option-selected {
    border-color: #3b82f6;
    background-color: #3b82f6;
    color: white;
  }
  
  .style-description {
    color: #a0aec0;
  }
  
  .style-option:hover:not(.style-option-disabled) .style-description {
    color: #cbd5e0;
  }

  .style-option-selected .style-description {
    color: rgba(255, 255, 255, 0.9);
  }
}

/* Also support dark mode class-based toggle */
.dark .style-selector-label {
  color: #e2e8f0;
}

.dark .style-option {
  border-color: #4a5568;
  background-color: #2d3748;
  color: #e2e8f0;
}

.dark .style-option:hover:not(.style-option-disabled) {
  border-color: #3b82f6;
  background-color: #374151;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.dark .style-option-selected {
  border-color: #3b82f6;
  background-color: #3b82f6;
  color: white;
}

.dark .style-description {
  color: #a0aec0;
}

.dark .style-option:hover:not(.style-option-disabled) .style-description {
  color: #cbd5e0;
}

.dark .style-option-selected .style-description {
  color: rgba(255, 255, 255, 0.9);
}

/* Animation for selection */
.style-option-selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  animation: shine 1.5s ease-in-out;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles_css
  document.head.appendChild(styleEl)
}
