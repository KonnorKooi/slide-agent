import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { SubmitButton } from '@/components/SubmitButton'

const meta: Meta<typeof SubmitButton> = {
  title: 'Components/SubmitButton',
  component: SubmitButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component with loading states and various variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Button text content',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the button is in loading state',
    },
    loadingText: {
      control: 'text',
      description: 'Text to show when loading',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
      description: 'Button variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether button should take full width',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Icons for demonstration
const PlayIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3 2l10 6-10 6V2z"
      fill="currentColor"
    />
  </svg>
)

const CheckIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3 8l3 3 7-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const StopIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="4" y="4" width="8" height="8" fill="currentColor" />
  </svg>
)

// Default primary button
export const Primary: Story = {
  args: {
    children: 'Generate Script',
    variant: 'primary',
    size: 'md',
  },
}

// Secondary variant
export const Secondary: Story = {
  args: {
    children: 'Cancel',
    variant: 'secondary',
    size: 'md',
  },
}

// Outline variant
export const Outline: Story = {
  args: {
    children: 'Learn More',
    variant: 'outline',
    size: 'md',
  },
}

// Loading state
export const Loading: Story = {
  args: {
    children: 'Generate Script',
    isLoading: true,
    loadingText: 'Generating...',
    variant: 'primary',
    size: 'md',
  },
}

// With icon
export const WithIcon: Story = {
  args: {
    children: 'Generate Script',
    icon: CheckIcon,
    variant: 'primary',
    size: 'md',
  },
}

// Small size
export const Small: Story = {
  args: {
    children: 'Copy',
    variant: 'secondary',
    size: 'sm',
  },
}

// Large size
export const Large: Story = {
  args: {
    children: 'Get Started',
    variant: 'primary',
    size: 'lg',
  },
}

// Full width
export const FullWidth: Story = {
  args: {
    children: 'Continue',
    variant: 'primary',
    size: 'md',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
}

// Disabled state
export const Disabled: Story = {
  args: {
    children: 'Generate Script',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
}

// All sizes comparison
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <SubmitButton variant="primary" size="sm">
        Small
      </SubmitButton>
      <SubmitButton variant="primary" size="md">
        Medium
      </SubmitButton>
      <SubmitButton variant="primary" size="lg">
        Large
      </SubmitButton>
    </div>
  ),
}

// All variants comparison
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <SubmitButton variant="primary" size="md">
        Primary
      </SubmitButton>
      <SubmitButton variant="secondary" size="md">
        Secondary
      </SubmitButton>
      <SubmitButton variant="outline" size="md">
        Outline
      </SubmitButton>
    </div>
  ),
}

// Interactive loading demo
export const LoadingDemo: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false)

    const handleClick = () => {
      setIsLoading(true)
      setTimeout(() => setIsLoading(false), 3000)
    }

    return (
      <SubmitButton
        variant="primary"
        size="md"
        isLoading={isLoading}
        loadingText="Processing..."
        onClick={handleClick}
        icon={isLoading ? undefined : PlayIcon}
      >
        {isLoading ? 'Processing...' : 'Start Process'}
      </SubmitButton>
    )
  },
}

// Stop button example
export const StopButton: Story = {
  args: {
    children: 'Stop Generation',
    variant: 'secondary',
    size: 'lg',
    icon: StopIcon,
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
}