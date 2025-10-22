import type { Meta, StoryObj } from '@storybook/react'
import React, { useState, useEffect } from 'react'
import { StreamingOutput } from '@/components/StreamingOutput'

const meta: Meta<typeof StreamingOutput> = {
  title: 'Components/StreamingOutput',
  component: StreamingOutput,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Output component for displaying streaming text with controls and status indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    slides: {
      control: 'object',
      description: 'Array of slide blocks to display',
    },
    toolStatus: {
      control: 'object',
      description: 'Array of tool status messages',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether content is currently streaming',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    autoScroll: {
      control: 'boolean',
      description: 'Whether to auto-scroll to bottom',
    },
    showCopyButton: {
      control: 'boolean',
      description: 'Whether to show copy button',
    },
    showClearButton: {
      control: 'boolean',
      description: 'Whether to show clear button',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    onCopy: {
      action: 'copied',
      description: 'Copy button click handler',
    },
    onClear: {
      action: 'cleared',
      description: 'Clear button click handler',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample slide data
const sampleSlides = [
  {
    slideNumber: 1,
    title: "Welcome to Our Company",
    script: "Welcome everyone to today's presentation about our company's journey and achievements. Over the next few minutes, we'll explore how we've grown from a small startup to a leading player in our industry. This story is not just about numbers and milestones, but about the people, innovations, and values that have shaped our path forward.",
    isComplete: true
  },
  {
    slideNumber: 2,
    title: "Our Mission Statement",
    script: "At the heart of everything we do lies our mission: to empower businesses through innovative technology solutions that drive growth and efficiency. This mission has been our north star since day one, guiding every decision we make and every product we develop. It's what gets us up in the morning and what drives us to continuously push the boundaries of what's possible.",
    isComplete: true
  },
  {
    slideNumber: 3,
    title: "Key Achievements",
    script: "Let me share some of our proudest achievements from the past year. We've successfully launched three major product updates, expanded our team by 150%, and most importantly, helped over 10,000 businesses transform their operations. These numbers represent real impact – real businesses that are now more efficient, more profitable, and better positioned for the future.",
    isComplete: true
  },
  {
    slideNumber: 4,
    title: "Looking Forward",
    script: "As we look toward the future, we're excited about the opportunities ahead. We're investing in new technologies, expanding into new markets, and continuing to build products that make a real difference. Thank you for joining us on this journey, and we look forward to sharing more exciting developments with you soon.",
    isComplete: true
  }
]

const sampleToolStatus = [
  "🔧 Google Slides API: Accessing your presentation...",
  "📄 Slide 1/4: Processing content",
  "📄 Slide 2/4: Processing content",
  "📄 Slide 3/4: Processing content",
  "📄 Slide 4/4: Processing content",
  "📝 Generating presentation script..."
]

// Container for stories to provide proper height
const StoryContainer: React.FC<{ children: React.ReactNode; height?: string }> = ({
  children,
  height = '500px'
}) => (
  <div style={{ height, padding: '1rem', background: 'var(--bg-secondary)' }}>
    {children}
  </div>
)

// Empty state
export const Empty: Story = {
  render: (args) => (
    <StoryContainer>
      <StreamingOutput {...args} />
    </StoryContainer>
  ),
  args: {
    slides: [],
    toolStatus: [],
    isStreaming: false,
    error: null,
    placeholder: 'Your presentation script will appear here...',
  },
}

// With content
export const WithContent: Story = {
  render: (args) => (
    <StoryContainer>
      <StreamingOutput {...args} />
    </StoryContainer>
  ),
  args: {
    slides: sampleSlides,
    toolStatus: sampleToolStatus,
    isStreaming: false,
    error: null,
  },
}

// Streaming state
export const Streaming: Story = {
  render: (args) => (
    <StoryContainer>
      <StreamingOutput {...args} />
    </StoryContainer>
  ),
  args: {
    slides: sampleSlides.slice(0, 2),
    toolStatus: sampleToolStatus.slice(0, 3),
    isStreaming: true,
    error: null,
  },
}

// Error state
export const WithError: Story = {
  render: (args) => (
    <StoryContainer>
      <StreamingOutput {...args} />
    </StoryContainer>
  ),
  args: {
    slides: [],
    toolStatus: [],
    isStreaming: false,
    error: 'Failed to connect to the presentation. Please check the URL and try again.',
  },
}

// Without controls
export const NoControls: Story = {
  render: (args) => (
    <StoryContainer>
      <StreamingOutput {...args} />
    </StoryContainer>
  ),
  args: {
    slides: sampleSlides,
    toolStatus: sampleToolStatus,
    isStreaming: false,
    showCopyButton: false,
    showClearButton: false,
  },
}

// Interactive streaming simulation
export const StreamingSimulation: Story = {
  render: (args) => {
    const [slides, setSlides] = useState<typeof sampleSlides>([])
    const [toolStatus, setToolStatus] = useState<string[]>([])
    const [isStreaming, setIsStreaming] = useState(false)

    const startStreaming = () => {
      if (isStreaming) return

      setSlides([])
      setToolStatus([])
      setIsStreaming(true)

      // Simulate tool status messages
      const statuses = sampleToolStatus.slice()
      let statusIndex = 0

      const addStatus = () => {
        if (statusIndex < statuses.length) {
          setToolStatus(prev => [...prev, statuses[statusIndex]])
          statusIndex++
          setTimeout(addStatus, 500)
        } else {
          addSlides()
        }
      }

      // Simulate slides appearing one by one
      let slideIndex = 0
      const addSlides = () => {
        if (slideIndex < sampleSlides.length) {
          setSlides(prev => [...prev, sampleSlides[slideIndex]])
          slideIndex++
          setTimeout(addSlides, 1000)
        } else {
          setIsStreaming(false)
        }
      }

      addStatus()
    }

    const stopStreaming = () => {
      setIsStreaming(false)
    }

    const clearContent = () => {
      setSlides([])
      setToolStatus([])
      setIsStreaming(false)
    }

    return (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
          <button
            onClick={startStreaming}
            disabled={isStreaming}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isStreaming ? '#ccc' : 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
            }}
          >
            {isStreaming ? 'Streaming...' : 'Start Simulation'}
          </button>

          <button
            onClick={stopStreaming}
            disabled={!isStreaming}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: !isStreaming ? '#ccc' : 'var(--color-error)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: !isStreaming ? 'not-allowed' : 'pointer',
            }}
          >
            Stop
          </button>

          <button
            onClick={clearContent}
            disabled={isStreaming}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isStreaming ? '#ccc' : 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.5rem',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ flex: 1, background: 'var(--bg-secondary)' }}>
          <StreamingOutput
            slides={slides}
            toolStatus={toolStatus}
            isStreaming={isStreaming}
            error={null}
            onClear={clearContent}
            placeholder="Click 'Start Simulation' to see streaming in action..."
          />
        </div>
      </div>
    )
  },
}

// Large content test
export const LargeContent: Story = {
  render: (args) => (
    <StoryContainer height="400px">
      <StreamingOutput {...args} />
    </StoryContainer>
  ),
  args: {
    slides: Array(20).fill(null).map((_, i) => ({
      ...sampleSlides[i % 4],
      slideNumber: i + 1,
      isComplete: true
    })),
    toolStatus: sampleToolStatus,
    isStreaming: false,
    error: null,
  },
}