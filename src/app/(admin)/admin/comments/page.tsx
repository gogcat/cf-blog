'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/toast'

interface Comment {
  id: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  post_id: string
  user_id: string
  created_at: string
  post_title: string | null
  user_name: string | null
}

interface Settings {
  comment_moderation: string
  comment_keywords: string
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  const [settings, setSettings] = useState<Settings>({
    comment_moderation: 'false',
    comment_keywords: '',
  })
  const [settingsLoading, setSettingsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/comments?limit=100')
      .then<{ success: boolean; data: { comments: Comment[] }; error?: string }>(res => res.json())
      .then(data => {
        if (data.success) {
          setComments(data.data.comments || [])
        } else {
          setError(data.error || '获取评论列表失败')
        }
      })
      .catch(() => {
        setError('获取评论列表失败')
      })
      .finally(() => {
        setLoading(false)
      })

    fetch('/api/admin/settings')
      .then<{ success: boolean; data: { settings: Settings }; error?: string }>(res => res.json())
      .then(data => {
        if (data.success && data.data.settings) {
          setSettings({
            comment_moderation: data.data.settings.comment_moderation || 'false',
            comment_keywords: data.data.settings.comment_keywords || '',
          })
        }
      })
      .catch(console.error)
  }, [])

  const handleSettingChange = async (key: string, value: string) => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json() as { success: boolean }
      if (data.success) {
        setSettings(prev => ({ ...prev, [key]: value }))
        showToast('设置保存成功', 'success')
      }
    } catch (error) {
      console.error('Failed to update setting:', error)
      showToast('设置保存失败', 'error')
    } finally {
      setSettingsLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待审核'
      case 'approved': return '已通过'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      case 'approved': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'rejected': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      const data = await res.json() as { success: boolean }
      if (data.success) {
        setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
        showToast('评论已通过', 'success')
      }
    } catch (error) {
      console.error('Failed to approve comment:', error)
      showToast('操作失败', 'error')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })
      const data = await res.json() as { success: boolean }
      if (data.success) {
        setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
        showToast('评论已拒绝', 'success')
      }
    } catch (error) {
      console.error('Failed to reject comment:', error)
      showToast('操作失败', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条评论吗？')) return
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
      const data = await res.json() as { success: boolean }
      if (data.success) {
        setComments(prev => prev.filter(c => c.id !== id))
        showToast('评论已删除', 'success')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      showToast('删除失败', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">评论管理</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              管理博客评论，审核、回复或删除用户评论
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>评论设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">评论审核</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">开启后，新评论需要管理员审核后才能显示</p>
            </div>
            <button
              onClick={() => handleSettingChange('comment_moderation', settings.comment_moderation === 'true' ? 'false' : 'true')}
              disabled={settingsLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.comment_moderation === 'true' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.comment_moderation === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block font-medium text-gray-900 dark:text-gray-100 mb-1">
              关键词过滤
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">包含这些关键词的评论将被自动拒绝，多个关键词用逗号分隔</p>
            <div className="flex gap-2">
              <textarea
                value={settings.comment_keywords}
                onChange={(e) => setSettings(prev => ({ ...prev, comment_keywords: e.target.value }))}
                placeholder="请输入关键词，多个用逗号分隔"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
              />
              <button
                onClick={() => handleSettingChange('comment_keywords', settings.comment_keywords)}
                disabled={settingsLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
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
          <CardTitle>评论列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">加载中...</div>
            ) : comments.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      内容
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      文章
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {comment.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {comment.user_name || '匿名用户'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {comment.post_title || '未知文章'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(comment.status)}`}>
                          {getStatusLabel(comment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {comment.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(comment.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              通过
                            </button>
                            <button 
                              onClick={() => handleReject(comment.id)}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">暂无评论</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
