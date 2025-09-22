export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'slide-agent-theme'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error)
  }

  // Default to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Failed to store theme in localStorage:', error)
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return

  document.documentElement.setAttribute('data-theme', theme)
}

export function initializeTheme(): Theme {
  const theme = getStoredTheme()
  applyTheme(theme)
  return theme
}

export function toggleTheme(currentTheme: Theme): Theme {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  setStoredTheme(newTheme)
  applyTheme(newTheme)
  return newTheme
}