import type { ThemeConfig } from '@/themes/types'
import type JSZip from 'jszip'

export async function extractThemeFiles(
  zipBuffer: ArrayBuffer
): Promise<Record<string, string>> {
  const JSZipModule = await import('jszip')
  const zip = await JSZipModule.default.loadAsync(zipBuffer)
  const files: Record<string, string> = {}
  
  const promises: Promise<void>[] = []
  
  zip.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
    if (!zipEntry.dir) {
      promises.push(
        zipEntry.async('string').then((content: string) => {
          files[relativePath] = content
        })
      )
    }
  })
  
  await Promise.all(promises)
  return files
}

export function validateThemeConfig(config: unknown): config is ThemeConfig {
  if (!config || typeof config !== 'object') {
    return false
  }
  
  const c = config as Record<string, unknown>
  
  if (typeof c.id !== 'string' || !c.id) {
    return false
  }
  
  if (typeof c.name !== 'string' || !c.name) {
    return false
  }
  
  if (!c.colors || typeof c.colors !== 'object') {
    return false
  }
  
  const colors = c.colors as Record<string, unknown>
  const requiredColors = ['primary', 'secondary', 'background', 'foreground']
  
  for (const color of requiredColors) {
    if (typeof colors[color] !== 'string') {
      return false
    }
  }
  
  return true
}

export function parseThemeConfig(configJson: string): ThemeConfig {
  try {
    const config = JSON.parse(configJson)
    
    if (!validateThemeConfig(config)) {
      throw new Error('Invalid theme configuration')
    }
    
    return config
  } catch (error) {
    throw new Error(`Failed to parse theme config: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function validateThemePackage(
  files: Record<string, string>
): { valid: boolean; error?: string } {
  if (!files['config.json']) {
    return { valid: false, error: 'Missing config.json file' }
  }
  
  try {
    const config = parseThemeConfig(files['config.json'])
    
    if (!config.id || !config.name) {
      return { valid: false, error: 'Theme must have id and name' }
    }
    
    if (!config.colors) {
      return { valid: false, error: 'Theme must have colors configuration' }
    }
    
    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid theme configuration' 
    }
  }
}
