import { R2 } from '@/lib/r2'
import { KV } from '@/lib/kv'
import { getEnv } from '@/lib/api'
import { extractThemeFiles, parseThemeConfig, validateThemePackage } from './parser'
import type { ThemeConfig } from '@/themes/types'

export async function uploadTheme(
  file: File
): Promise<ThemeConfig> {
  const themeId = `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const buffer = await file.arrayBuffer()
    const files = await extractThemeFiles(buffer)
    
    const validation = validateThemePackage(files)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid theme package')
    }
    
    const config = parseThemeConfig(files['config.json'])
    config.id = themeId
    
    await uploadThemeFiles(themeId, files, config)
    
    await saveThemeMetadata(themeId, config)
    
    try {
      await KV.delete('themes:list')
    } catch (e) {
      // Ignore KV errors
    }
    
    return config
  } catch (error) {
    await cleanupFailedUpload(themeId)
    throw error
  }
}

async function uploadThemeFiles(
  themeId: string,
  files: Record<string, string>,
  config: ThemeConfig
): Promise<void> {
  await R2.put(`themes/${themeId}/config.json`, JSON.stringify(config))
  
  const uploadPromises = Object.entries(files)
    .filter(([path]) => path !== 'config.json')
    .map(([path, content]) => {
      const key = `themes/${themeId}/${path}`
      return R2.put(key, content)
    })
  
  await Promise.all(uploadPromises)
}

async function saveThemeMetadata(
  themeId: string,
  config: ThemeConfig
): Promise<void> {
  const env = getEnv()
  
  await env.DB.prepare(`
    INSERT INTO themes (id, name, description, author, version, is_default, r2_key, config_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    themeId,
    config.name,
    config.description || '',
    config.author || 'Unknown',
    config.version || '1.0.0',
    false,
    `themes/${themeId}`,
    JSON.stringify(config)
  ).run()
}

async function cleanupFailedUpload(themeId: string): Promise<void> {
  try {
    const objects = await R2.list({ prefix: `themes/${themeId}/` })
    
    const deletePromises = objects.objects.map(obj => R2.delete(obj.key))
    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Failed to cleanup failed upload:', error)
  }
}

export async function deleteTheme(themeId: string): Promise<void> {
  if (themeId === 'default' || themeId === 'dark') {
    throw new Error('Cannot delete built-in themes')
  }
  
  const env = getEnv()
  
  const currentTheme = await env.DB.prepare("SELECT value FROM settings WHERE key = 'theme'")
    .first<{ value: string }>()
  
  if (currentTheme?.value === themeId) {
    throw new Error('Cannot delete active theme')
  }
  
  const objects = await R2.list({ prefix: `themes/${themeId}/` })
  const deletePromises = objects.objects.map(obj => R2.delete(obj.key))
  await Promise.all(deletePromises)
  
  await env.DB.prepare('DELETE FROM themes WHERE id = ?').bind(themeId).run()
  
  try {
    await KV.delete(`theme:${themeId}`)
    await KV.delete('themes:list')
  } catch (e) {
    // Ignore KV errors
  }
}
