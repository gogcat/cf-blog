'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/toast'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

export default function UserNewPostPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [creating, setCreating] = useState(false)
  
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<any>(null)
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(res => res.json() as Promise<{ success: boolean; data: { categories: Category[] } }>),
      fetch('/api/tags').then(res => res.json() as Promise<{ success: boolean; data: { tags: Tag[] } }>)
    ]).then(([categoriesData, tagsData]) => {
      if (categoriesData.success) {
        setCategories(categoriesData.data.categories || [])
      }
      if (tagsData.success) {
        setTags(tagsData.data.tags || [])
      }
    }).catch(() => {
      setError('加载分类和标签失败')
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })

      const data = await res.json() as { success: boolean; data?: { url: string }; error?: string }

      if (data.success && data.data?.url) {
        const imageMarkdown = `![${file.name}](${data.data.url})`
        
        if (editorRef.current?.insertText) {
          editorRef.current.insertText(imageMarkdown)
        } else if (editorRef.current?.textarea) {
          const textarea = editorRef.current.textarea
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const text = textarea.value
          
          const newText = text.substring(0, start) + imageMarkdown + text.substring(end)
          setContent(newText)
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length
          }, 0)
        } else {
          setContent(prev => prev + '\n' + imageMarkdown)
        }
      } else {
        setError(data.error || '上传图片失败')
      }
    } catch {
      setError('上传图片失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })

      const data = await res.json() as { success: boolean; data?: { url: string }; error?: string }

      if (data.success && data.data?.url) {
        setCoverImage(data.data.url)
      } else {
        setError(data.error || '上传图片失败')
      }
    } catch {
      setError('上传图片失败')
    } finally {
      setCoverUploading(false)
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch('/api/user/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || undefined,
          cover_image: coverImage || null,
          category_id: categoryId || null,
          tag_ids: selectedTags.length > 0 ? selectedTags : undefined,
          status
        })
      })

      const data = await res.json() as { success: boolean; error?: string }

      if (data.success) {
        showToast('文章创建成功，等待审核', 'success')
        setTimeout(() => router.push('/user/posts'), 1000)
      } else {
        showToast(data.error || '创建文章失败', 'error')
      }
    } catch {
      showToast('创建文章失败，请稍后重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTagChange = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    
    setCreating(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newTagName.trim() })
      })

      const data = await res.json() as { success: boolean; data?: { tag: Tag }; error?: string }

      if (data.success && data.data?.tag) {
        setTags(prev => [...prev, data.data!.tag])
        setSelectedTags(prev => [...prev, data.data!.tag.id])
        setNewTagName('')
      } else {
        setError(data.error || '创建标签失败')
      }
    } catch {
      setError('创建标签失败')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">新建文章</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                创建新文章，提交后需要管理员审核
              </p>
            </div>
            <Link href="/user/posts">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>文章信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入文章标题"
                required
              />
            </div>

            <div>
              <Label htmlFor="content">内容</Label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                <MDEditor
                  ref={editorRef}
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  height={400}
                  preview="edit"
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '插入图片'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">摘要</Label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="请输入文章摘要（可选）"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <Label htmlFor="cover">封面图片</Label>
              <div className="mt-2">
                {coverImage ? (
                  <div className="relative">
                    <Image
                      src={coverImage}
                      alt="封面"
                      width={800}
                      height={192}
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setCoverImage('')}
                    >
                      删除
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 text-center">
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={coverUploading}
                    >
                      {coverUploading ? '上传中...' : '选择封面图片'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="category">分类</Label>
              <Select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">无分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>标签</Label>
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagChange(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedTags.includes(tag.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="新标签名称"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={creating}
                  >
                    {creating ? '创建中...' : '添加标签'}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="status">状态</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              >
                <option value="draft">草稿</option>
                <option value="published">发布</option>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存文章'}
              </Button>
              <Link href="/user/posts">
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
