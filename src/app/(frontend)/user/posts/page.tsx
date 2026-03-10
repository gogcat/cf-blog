'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  moderation_status: 'pending' | 'approved' | 'rejected'
  view_count: number
  created_at: string
  category_name?: string
}

export default function UserPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const fetchPosts = useCallback(() => {
    setLoading(true)
    const url = filter === 'all' 
      ? '/api/user/posts?limit=100' 
      : `/api/user/posts?moderation_status=${filter}&limit=100`
      
    fetch(url)
      .then(res => res.json())
      .then((data: unknown) => {
        const response = data as { success: boolean; data?: { posts: Post[] }; error?: string }
        if (response.success) {
          setPosts(response.data?.posts || [])
        } else {
          setError(response.error || '获取文章列表失败')
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

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) {
      return
    }

    try {
      const res = await fetch(`/api/user/posts/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json() as { success: boolean; error?: string }
      
      if (data.success) {
        fetchPosts()
      } else {
        setError(data.error || '删除失败')
      }
    } catch {
      setError('删除失败')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'draft': return '草稿'
      default: return status
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'draft': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">我的文章</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                管理您的文章，创建新文章或编辑现有文章
              </p>
            </div>
            <Link href="/user/posts/new">
              <Button>新建文章</Button>
            </Link>
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
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                全部
              </Button>
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
                      分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      审核状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      浏览量
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {post.category_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(post.status)}`}>
                          {getStatusLabel(post.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getModerationStatusClass(post.moderation_status)}`}>
                          {getModerationStatusLabel(post.moderation_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {post.view_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/user/posts/${post.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
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
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                暂无文章
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
