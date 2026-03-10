import type { ThemeConfig } from '../types'

export const darkTheme: ThemeConfig = {
  id: 'dark',
  name: '暗色主题',
  description: '深色护眼的暗色主题',
  author: 'System',
  version: '1.0.0',
  colors: {
    primary: '#60a5fa',
    secondary: '#9ca3af',
    background: '#111827',
    foreground: '#f9fafb',
    card: '#1f2937',
    cardForeground: '#f9fafb',
    border: '#374151',
    input: '#374151',
    ring: '#60a5fa',
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
}

export default darkTheme
