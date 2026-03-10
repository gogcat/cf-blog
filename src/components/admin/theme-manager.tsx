'use client'

import { useState, useEffect } from 'react'
import { useThemeStore } from '@/lib/store/theme'
import { ThemeUpload } from './theme-upload'
import { Card, CardContent } from '@/components/ui/card'
import type { ThemeConfig, ThemeMetadata } from '@/themes/types'

export function ThemeManager() {
  const { 
    themeName, 
    availableThemes, 
    loading, 
    loadThemes, 
    activateTheme 
  } = useThemeStore()
  
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadThemes()
  }, [loadThemes])

  const handleUploadComplete = () => {
    loadThemes()
  }

  const handleActivateTheme = async (themeId: string) => {
    await activateTheme(themeId)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">上传主题</h3>
          <ThemeUpload 
            onUploadComplete={handleUploadComplete}
            uploading={uploading}
            setUploading={setUploading}
          />
        </CardContent>
      </Card>

      <div>
        <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">可用主题</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={themeName === theme.id}
              loading={loading}
              onActivate={handleActivateTheme}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeCard({ 
  theme, 
  isActive, 
  loading, 
  onActivate 
}: { 
  theme: ThemeMetadata
  isActive: boolean
  loading: boolean
  onActivate: (id: string) => Promise<void>
}) {
  const colors = theme.configJson ? (JSON.parse(theme.configJson) as ThemeConfig).colors : null
  
  return (
    <Card className={`overflow-hidden ${
      isActive 
        ? 'border-blue-500 shadow-sm' 
        : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-lg text-gray-900 dark:text-gray-100">{theme.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {theme.description}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              作者: {theme.author} | 版本: {theme.version}
            </div>
            {theme.isDefault && (
              <div className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                内置主题
              </div>
            )}
          </div>
          <button
            onClick={() => onActivate(theme.id)}
            disabled={loading || isActive}
            className={`mt-2 px-3 py-1 text-sm rounded ${
              isActive
                ? 'bg-blue-600 text-white'
                : loading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isActive ? '当前使用' : loading ? '切换中...' : '使用此主题'}
          </button>
        </div>
      </CardContent>
      
      {colors && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">主题预览</div>
          <div className="flex gap-2">
            <div 
              className="w-8 h-8 rounded" 
              style={{ backgroundColor: colors.primary }}
              title="Primary Color"
            />
            <div 
              className="w-8 h-8 rounded" 
              style={{ backgroundColor: colors.secondary }}
              title="Secondary Color"
            />
            <div 
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600" 
              style={{ backgroundColor: colors.background }}
              title="Background Color"
            />
          </div>
        </div>
      )}
    </Card>
  )
}
