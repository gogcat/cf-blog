'use client'

import { useState } from 'react'

interface ThemeUploadProps {
  onUploadComplete: () => void
  uploading: boolean
  setUploading: (loading: boolean) => void
}

export function ThemeUpload({ onUploadComplete, uploading, setUploading }: ThemeUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('theme', file)

      const response = await fetch('/api/admin/themes/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || '上传失败')
      }

      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="theme-upload"
      />
      <label
        htmlFor="theme-upload"
        className={`px-4 py-2 border rounded-md cursor-pointer inline-block text-gray-900 dark:text-gray-100 ${
          uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        {uploading ? '上传中...' : '选择主题包 (.zip)'}
      </label>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
        上传主题包（.zip格式），包含完整的主题文件结构
      </p>

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
