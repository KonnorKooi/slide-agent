import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SlideInput } from '@/components/SlideInput'

const meta: Meta<typeof SlideInput> = {
  title: 'Components/SlideInput',
  component: SlideInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input component for Google Slides URLs or presentation IDs with validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current input value',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when input value changes',
    },
    onValidationChange: {
      action: 'validation-changed',
      description: 'Callback when validation state changes',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Whether to auto-focus the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper for stories
function InteractiveSlideInput(args: any) {
  const [value, setValue] = useState(args.value || '')
  const [validationState, setValidationState] = useState<{isValid: boolean, presentationId?: string}>({
    isValid: false
  })

  return (
    <div style={{ width: '400px' }}>
      <SlideInput
        {...args}
        value={value}
        onChange={setValue}
        onValidationChange={(isValid, presentationId) => {
          setValidationState({ isValid, presentationId })
          args.onValidationChange?.(isValid, presentationId)
        }}
      />
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <strong>Validation State:</strong> {validationState.isValid ? 'Valid' : 'Invalid'}
        {validationState.presentationId && (
          <div><strong>Presentation ID:</strong> {validationState.presentationId}</div>
        )}
      </div>
    </div>
  )
}

// Default story
export const Default: Story = {
  render: (args) => <InteractiveSlideInput {...args} />,
  args: {
    placeholder: 'Enter Google Slides URL or presentation ID...',
    required: false,
    disabled: false,
    autoFocus: false,
  },
}

// With existing URL
export const WithValidURL: Story = {
  render: (args) => <InteractiveSlideInput {...args} />,
  args: {
    value: 'https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    placeholder: 'Enter Google Slides URL or presentation ID...',
    required: false,
    disabled: false,
  },
}

// With presentation ID only
export const WithPresentationID: Story = {
  render: (args) => <InteractiveSlideInput {...args} />,
  args: {
    value: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    placeholder: 'Enter Google Slides URL or presentation ID...',
    required: false,
    disabled: false,
  },
}

// Required field
export const Required: Story = {
  render: (args) => <InteractiveSlideInput {...args} />,
  args: {
    placeholder: 'Enter Google Slides URL or presentation ID...',
    required: true,
    disabled: false,
  },
}

// Disabled state
export const Disabled: Story = {
  render: (args) => <InteractiveSlideInput {...args} />,
  args: {
    value: 'https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    placeholder: 'Enter Google Slides URL or presentation ID...',
    disabled: true,
  },
}

// With error state (invalid URL)
export const WithError: Story = {
  render: (args) => <InteractiveSlideInput {...args} />,
  args: {
    value: 'invalid-url-example',
    placeholder: 'Enter Google Slides URL or presentation ID...',
    required: true,
  },
}

// Auto-focus
export const AutoFocus: Story = {
  render: (args) => <InteractiveSlideInput {...args} />,
  args: {
    placeholder: 'This input should be focused',
    autoFocus: true,
  },
}