import type { Meta, StoryObj } from '@storybook/react'
import { ThemeToggle } from '@/components/ThemeToggle'

const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toggle component for switching between light and dark themes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the toggle',
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to show the theme label',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default theme toggle
export const Default: Story = {
  args: {
    size: 'md',
    showLabel: false,
  },
}

// With label
export const WithLabel: Story = {
  args: {
    size: 'md',
    showLabel: true,
  },
}

// Small size
export const Small: Story = {
  args: {
    size: 'sm',
    showLabel: false,
  },
}

// Medium size (default)
export const Medium: Story = {
  args: {
    size: 'md',
    showLabel: false,
  },
}

// Large size
export const Large: Story = {
  args: {
    size: 'lg',
    showLabel: false,
  },
}

// All sizes comparison
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ThemeToggle size="sm" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Small</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ThemeToggle size="md" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Medium</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <ThemeToggle size="lg" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Large</span>
      </div>
    </div>
  ),
}

// With and without labels
export const LabelComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle size="md" showLabel={false} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Without Label</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle size="md" showLabel={true} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>With Label</span>
      </div>
    </div>
  ),
}

// In a toolbar context
export const InToolbar: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-primary)',
        minWidth: '300px',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
        Settings
      </h3>
      <ThemeToggle size="md" />
    </div>
  ),
}

// In a header context
export const InHeader: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        minWidth: '500px',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          Slide Script Generator
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Generate presentation scripts from Google Slides
        </p>
      </div>
      <ThemeToggle size="md" />
    </div>
  ),
}

// Grouped with other controls
export const WithOtherControls: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-primary)',
      }}
    >
      <button
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}
      >
        Settings
      </button>
      <button
        style={{
          padding: '0.5rem 1rem',
          background: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}
      >
        Help
      </button>
      <div style={{ width: '1px', height: '2rem', background: 'var(--border-primary)' }} />
      <ThemeToggle size="md" showLabel={true} />
    </div>
  ),
}

// Interactive demonstration
export const InteractiveDemo: Story = {
  render: () => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Try switching themes!
      </h3>
      <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
        This toggle will change the theme of the entire Storybook preview.
        The theme change should persist as you navigate between stories.
      </p>
      <ThemeToggle size="lg" showLabel={true} />
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-primary)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--text-primary)' }}>
          This box will change colors based on the current theme.
        </p>
      </div>
    </div>
  ),
}