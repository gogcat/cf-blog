'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MediaFile {
  key: string
  size: number
  uploaded: string
  httpEtag: string
  publicUrl: string
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = (newCursor?: string) => {
    setLoading(true)
    const url = newCursor 
      ? `/api/admin/media?cursor=${newCursor}&limit=50`
      : '/api/admin/media?limit=50'
    
    fetch(url)
      .then(res => res.json() as Promise<{ success: boolean; data: { files: MediaFile[]; cursor: string | null; truncated: boolean }; error?: string }>)
      .then(data => {
        if (data.success) {
          if (newCursor) {
            setFiles(prev => [...prev, ...data.data.files])
          } else {
            setFiles(data.data.files)
          }
          setCursor(data.data.cursor)
          setHasMore(data.data.truncated)
        } else {
          setError(data.error || '获取媒体列表失败')
        }
      })
      .catch(() => {
        setError('获取媒体列表失败')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json() as { success: boolean; error?: string }
      
      if (data.success) {
        fetchMedia()
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(data.error || '上传失败')
      }
    } catch {
      setError('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('确定要删除这个文件吗？')) return

    setDeleting(key)
    try {
      const res = await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      const data = await res.json() as { success: boolean; error?: string }
      
      if (data.success) {
        setFiles(prev => prev.filter(f => f.key !== key))
      } else {
        setError(data.error || '删除失败')
      }
    } catch {
      setError('删除失败')
    } finally {
      setDeleting(null)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('链接已复制到剪贴板')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">媒体库</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? '上传中...' : '上传文件'}
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>
      )}

      {loading && files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无媒体文件</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <div key={file.key} className="bg-white rounded-lg border overflow-hidden group">
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={file.publicUrl}
                    alt={file.key}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50%" x="50%" dominant-baseline="middle" text-anchor="middle" font-size="20">📄</text></svg>'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyUrl(file.publicUrl)}
                      className="p-2 bg-white rounded-lg text-sm hover:bg-gray-100"
                    >
                      复制
                    </button>
                    <button
                      onClick={() => handleDelete(file.key)}
                      disabled={deleting === file.key}
                      className="p-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleting === file.key ? '...' : '删除'}
                    </button>
                  </div>
                </div>
                <div className="p-2 text-xs text-gray-500 truncate">
                  {file.key.split('/').pop()}
                </div>
                <div className="px-2 pb-2 text-xs text-gray-400">
                  {formatSize(file.size)}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <Button 
                onClick={() => fetchMedia(cursor || undefined)}
                disabled={loading}
                variant="outline"
              >
                {loading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
