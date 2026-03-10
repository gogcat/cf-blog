'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  totalPosts: number
  totalUsers: number
  totalComments: number
  publishedPosts: number
  pendingComments: number
}

interface RecentPost {
  id: string
  title: string
  status: string
  view_count: number
  created_at: string
  author_name: string
}

interface PendingComment {
  id: string
  content: string
  post_title: string
  user_name: string | null
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then<{ success: boolean; data: { stats: Stats; recentPosts: RecentPost[] }; error?: string }>(res => res.json()),
      fetch('/api/admin/comments?status=pending&limit=5').then<{ success: boolean; data: { comments: PendingComment[] }; error?: string }>(res => res.json())
    ])
      .then(([statsData, commentsData]) => {
        if (statsData.success) {
          setStats(statsData.data.stats)
          setRecentPosts(statsData.data.recentPosts || [])
        } else {
          setError(statsData.error || '获取数据失败')
        }
        
        if (commentsData.success) {
          setPendingComments(commentsData.data.comments || [])
        }
      })
      .catch(() => {
        setError('获取数据失败')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">仪表盘</h2>
          </CardContent>
        </Card>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  const statsData = [
    { label: '文章总数', value: stats?.totalPosts || 0, icon: '📝' },
    { label: '用户总数', value: stats?.totalUsers || 0, icon: '👥' },
    { label: '评论总数', value: stats?.totalComments || 0, icon: '💬' },
    { label: '已发布文章', value: stats?.publishedPosts || 0, icon: '✅' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">仪表盘</h2>
        </CardContent>
      </Card>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="text-4xl">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近文章</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.length > 0 ? (
              <ul className="space-y-3">
                {recentPosts.map((post) => (
                  <li key={post.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{post.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{post.author_name} · {new Date(post.created_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                      post.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {post.status === 'published' ? '已发布' : post.status === 'draft' ? '草稿' : post.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无文章</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>待审核评论 ({stats?.pendingComments || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingComments.length > 0 ? (
              <ul className="space-y-3">
                {pendingComments.map((comment) => (
                  <li key={comment.id} className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{comment.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {comment.user_name || '匿名用户'} · {comment.post_title}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无待审核评论</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
