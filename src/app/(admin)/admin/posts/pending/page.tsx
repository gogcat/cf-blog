'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/toast'

interface Post {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  moderation_status: 'pending' | 'approved' | 'rejected'
  moderation_note: string | null
  view_count: number
  created_at: string
  author_name: string
  author_email: string
  category_name?: string
}

export default function AdminPostModerationPage() {
  const { showToast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [moderationNote, setModerationNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchPosts = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/posts/pending?moderation_status=${filter}&limit=100`)
      .then(res => res.json() as Promise<{ success: boolean; data: { posts: Post[] }; error?: string }>)
      .then(data => {
        if (data.success) {
          setPosts(data.data.posts || [])
        } else {
          setError(data.error || '获取文章列表失败')
        }
      })
      .catch(() => {
        setError('获取文章列表失败')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [filter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleApprove = async (post: Post) => {
    if (!confirm(`确定要审核通过文章"${post.title}"吗？`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/posts/${post.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: moderationNote || undefined })
      })
      
      const data = await res.json() as { success: boolean; error?: string }
      
      if (data.success) {
        showToast('文章审核通过', 'success')
        setSelectedPost(null)
        setModerationNote('')
        fetchPosts()
      } else {
        showToast(data.error || '审核失败', 'error')
      }
    } catch {
      showToast('审核失败', 'error')
    }
  }

  const handleReject = async (post: Post) => {
    if (!moderationNote.trim()) {
      showToast('请提供拒绝原因', 'error')
      return
    }

    if (!confirm(`确定要拒绝文章"${post.title}"吗？`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/posts/${post.id}/moderate`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: moderationNote })
      })
      
      const data = await res.json() as { success: boolean; error?: string }
      
      if (data.success) {
        showToast('文章已拒绝', 'success')
        setSelectedPost(null)
        setModerationNote('')
        fetchPosts()
      } else {
        showToast(data.error || '拒绝失败', 'error')
      }
    } catch {
      showToast('拒绝失败', 'error')
    }
  }

  const handleUpdateNote = async (post: Post) => {
    if (!moderationNote.trim()) {
      showToast('请提供审核备注', 'error')
      return
    }

    try {
      const res = await fetch(`/api/admin/posts/${post.id}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: moderationNote })
      })
      
      const data = await res.json() as { success: boolean; error?: string }
      
      if (data.success) {
        showToast('审核备注已更新', 'success')
        setSelectedPost(null)
        setModerationNote('')
        fetchPosts()
      } else {
        showToast(data.error || '更新失败', 'error')
      }
    } catch {
      showToast('更新失败', 'error')
    }
  }

  const getModerationStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待审核'
      case 'approved': return '已通过'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  const getModerationStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      case 'approved': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'rejected': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'draft': return '草稿'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">文章审核</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              审核用户提交的文章，批准或拒绝发布
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>文章列表</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'pending' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                待审核
              </Button>
              <Button
                variant={filter === 'approved' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                已通过
              </Button>
              <Button
                variant={filter === 'rejected' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                已拒绝
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">加载中...</div>
            ) : posts.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      标题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      作者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      审核状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {post.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {post.author_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {post.author_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {post.category_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getStatusLabel(post.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getModerationStatusClass(post.moderation_status)}`}>
                          {getModerationStatusLabel(post.moderation_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedPost(post)
                            setModerationNote(post.moderation_note || '')
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                        >
                          {post.moderation_status === 'pending' ? '审核' : '查看'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                暂无文章
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPost?.moderation_status === 'pending' ? '审核文章' : '文章详情'}
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedPost.title}</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>作者：{selectedPost.author_name} ({selectedPost.author_email})</span>
                  <span className="ml-4">分类：{selectedPost.category_name || '无'}</span>
                </div>
              </div>

              {selectedPost.moderation_note && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    审核备注：
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPost.moderation_note}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  审核备注
                </label>
                <textarea
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="请输入审核备注（拒绝时必填）"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {selectedPost.moderation_status === 'pending' && (
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="danger"
                    onClick={() => handleReject(selectedPost)}
                    disabled={processing}
                  >
                    拒绝
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedPost)}
                    disabled={processing}
                  >
                    通过
                  </Button>
                </div>
              )}

              {selectedPost.moderation_status !== 'pending' && (
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPost(null)}
                  >
                    关闭
                  </Button>
                  <Button
                    onClick={() => handleUpdateNote(selectedPost)}
                    disabled={processing}
                  >
                    更新备注
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
