import type { ThemeConfig } from '../types'

export const defaultTheme: ThemeConfig = {
  id: 'default',
  name: '默认主题',
  description: '简约现代的默认主题',
  author: 'System',
  version: '1.0.0',
  isDefault: true,
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    background: '#ffffff',
    foreground: '#1f2937',
    card: '#ffffff',
    cardForeground: '#1f2937',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#3b82f6',
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
}

export default defaultTheme
