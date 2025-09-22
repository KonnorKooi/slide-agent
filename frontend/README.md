# Slide Agent Frontend

A modern Next.js frontend for the Slide Agent project that generates presentation scripts from Google Slides using AI streaming.

## Features

- 🎨 **Royal Blue Theme** with dark/light mode support
- 📱 **Responsive Design** for mobile and desktop
- ⚡ **Real-time Streaming** of AI-generated content
- 🧪 **Component Testing** with Storybook
- 🎯 **TypeScript** for type safety
- ♿ **Accessibility** features built-in

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Mastra server URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000**

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run storybook` - Start Storybook component explorer
- `npm run build-storybook` - Build Storybook for deployment

## Components

### SlideInput
Input component for Google Slides URLs or presentation IDs with validation.

### StreamingOutput
Display component for real-time streaming text with controls and status indicators.

### SubmitButton
Button component with loading states and multiple variants.

### ThemeToggle
Toggle component for switching between light and dark themes.

### SlideProcessor
Main container component that orchestrates the entire user experience.

## Environment Variables

- `NEXT_PUBLIC_MASTRA_URL` - URL of your Mastra server (default: http://localhost:4111)

## Architecture

The frontend connects to the Mastra backend via:

- **REST API** - For initial requests and configuration
- **Server-Sent Events** - For real-time streaming of AI-generated content
- **Mastra Client SDK** - For typed communication with the backend

## Styling

Uses CSS custom properties for theming with:
- Royal blue primary color (#4169e1)
- Automatic dark/light mode detection
- Persistent theme preferences
- Smooth animations and transitions

## Development

1. **Component Development:** Use Storybook to develop and test components in isolation
2. **Type Checking:** Run `npm run type-check` before commits
3. **Testing:** All components have comprehensive Storybook stories

## Deployment

The frontend can be deployed to any platform supporting Next.js:
- Vercel (recommended)
- Netlify
- Railway
- Self-hosted

Make sure to set the `NEXT_PUBLIC_MASTRA_URL` environment variable to point to your deployed Mastra server.

## API Integration

The frontend expects a Mastra server running with:
- SlideAgent configured
- Google Slides tools available
- OAuth credentials properly set up

See the main project README for backend setup instructions.