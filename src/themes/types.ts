export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  border: string
  input: string
  ring: string
}

export interface ThemeFonts {
  body: string
  heading: string
}

export interface ThemeConfig {
  id: string
  name: string
  description: string
  author: string
  version: string
  isDefault?: boolean
  colors: ThemeColors
  fonts: ThemeFonts
  files?: Record<string, string>
}

export interface ThemeMetadata {
  id: string
  name: string
  description: string
  author: string
  version: string
  isDefault: boolean
  r2Key: string
  configJson?: string
  createdAt: string
  updatedAt: string
}

export type ThemeMode = 'light' | 'dark' | 'system'
