import { KV } from '@/lib/kv'
import { R2 } from '@/lib/r2'
import { getEnv } from '@/lib/api'
import type { ThemeConfig, ThemeMetadata } from '@/themes/types'
import { defaultTheme } from '@/themes/default'
import { darkTheme } from '@/themes/dark'

const KV_CACHE_TTL = 86400
const BROWSER_CACHE_TTL = 3600000

const builtInThemes: Record<string, ThemeConfig> = {
  default: defaultTheme,
  dark: darkTheme,
}

async function loadThemeFromKV(themeId: string): Promise<ThemeConfig | null> {
  try {
    const cached = await KV.get(`theme:${themeId}`)
    if (cached) {
      return JSON.parse(cached)
    }
    return null
  } catch (error) {
    console.error('Failed to load theme from KV:', error)
    return null
  }
}

async function loadThemeFromR2(themeId: string): Promise<ThemeConfig> {
  try {
    const configObject = await R2.get(`themes/${themeId}/config.json`)
    if (!configObject) {
      throw new Error(`Theme config not found: ${themeId}`)
    }
    
    const config = JSON.parse(await configObject.text())
    const files = await listThemeFiles(themeId)
    
    return {
      ...config,
      files,
    }
  } catch (error) {
    console.error('Failed to load theme from R2:', error)
    throw error
  }
}

async function listThemeFiles(themeId: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  const prefix = `themes/${themeId}/`
  
  try {
    const objects = await R2.list({ prefix })
    
    for (const object of objects.objects) {
      if (object.key.endsWith('/')) continue
      
      const relativePath = object.key.replace(prefix, '')
      if (relativePath === 'config.json') continue
      
      const fileObject = await R2.get(object.key)
      if (fileObject) {
        files[relativePath] = await fileObject.text()
      }
    }
  } catch (error) {
    console.error('Failed to list theme files:', error)
  }
  
  return files
}

async function cacheThemeToKV(themeId: string, theme: ThemeConfig): Promise<void> {
  try {
    await KV.put(`theme:${themeId}`, JSON.stringify(theme), {
      expirationTtl: KV_CACHE_TTL,
    })
  } catch (error) {
    console.error('Failed to cache theme to KV:', error)
  }
}

export async function loadThemeServer(themeId: string): Promise<ThemeConfig> {
  if (builtInThemes[themeId]) {
    return builtInThemes[themeId]
  }
  
  const cached = await loadThemeFromKV(themeId)
  if (cached) {
    return cached
  }
  
  const theme = await loadThemeFromR2(themeId)
  await cacheThemeToKV(themeId, theme)
  
  return theme
}

export async function listThemesFromDB(): Promise<ThemeMetadata[]> {
  const env = getEnv()
  
  try {
    const result = await env.DB.prepare(`
      SELECT id, name, description, author, version, is_default, r2_key, config_json, created_at, updated_at
      FROM themes
      ORDER BY is_default DESC, created_at DESC
    `).all<ThemeMetadata>()
    
    const builtInList: ThemeMetadata[] = [
      {
        id: 'default',
        name: defaultTheme.name,
        description: defaultTheme.description,
        author: defaultTheme.author,
        version: defaultTheme.version,
        isDefault: true,
        r2Key: '',
        configJson: JSON.stringify(defaultTheme),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dark',
        name: darkTheme.name,
        description: darkTheme.description,
        author: darkTheme.author,
        version: darkTheme.version,
        isDefault: false,
        r2Key: '',
        configJson: JSON.stringify(darkTheme),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    
    return [...builtInList, ...(result.results || [])]
  } catch (error) {
    console.error('Failed to list themes:', error)
    const builtInList: ThemeMetadata[] = [
      {
        id: 'default',
        name: defaultTheme.name,
        description: defaultTheme.description,
        author: defaultTheme.author,
        version: defaultTheme.version,
        isDefault: true,
        r2Key: '',
        configJson: JSON.stringify(defaultTheme),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dark',
        name: darkTheme.name,
        description: darkTheme.description,
        author: darkTheme.author,
        version: darkTheme.version,
        isDefault: false,
        r2Key: '',
        configJson: JSON.stringify(darkTheme),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    return builtInList
  }
}

export async function getCurrentTheme(): Promise<string> {
  const env = getEnv()
  
  try {
    const result = await env.DB.prepare("SELECT value FROM settings WHERE key = 'theme'")
      .first<{ value: string }>()
    
    return result?.value || 'default'
  } catch (error) {
    console.error('Failed to get current theme:', error)
    return 'default'
  }
}

export function cacheThemeToBrowser(themeId: string, theme: ThemeConfig): void {
  if (typeof window === 'undefined') return
  
  try {
    const cacheData = {
      theme,
      timestamp: Date.now(),
    }
    localStorage.setItem(`theme_${themeId}`, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Failed to cache theme to browser:', error)
  }
}

export function loadThemeFromBrowserCache(themeId: string): ThemeConfig | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(`theme_${themeId}`)
    if (!cached) return null
    
    const { theme, timestamp } = JSON.parse(cached)
    
    if (Date.now() - timestamp > BROWSER_CACHE_TTL) {
      localStorage.removeItem(`theme_${themeId}`)
      return null
    }
    
    return theme
  } catch (error) {
    console.error('Failed to load theme from browser cache:', error)
    return null
  }
}
