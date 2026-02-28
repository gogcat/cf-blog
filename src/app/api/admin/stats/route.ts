import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withRole } from '@/lib/api'
import type { User } from '@/types'

export async function GET(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const [postsResult, usersResult, commentsResult, publishedResult] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE status = ? AND deleted_at IS NULL').bind('published').first<{ count: number }>(),
      ])
      
      const [pendingComments, recentPosts] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM comments WHERE status = ? AND deleted_at IS NULL').bind('pending').first<{ count: number }>(),
        env.DB.prepare(`
          SELECT p.id, p.title, p.status, p.view_count, p.created_at, u.name as author_name
          FROM posts p
          JOIN users u ON p.author_id = u.id
          WHERE p.deleted_at IS NULL
          ORDER BY p.created_at DESC
          LIMIT 5
        `).all(),
      ])
      
      return successResponse({
        stats: {
          totalPosts: postsResult?.count || 0,
          totalUsers: usersResult?.count || 0,
          totalComments: commentsResult?.count || 0,
          publishedPosts: publishedResult?.count || 0,
          pendingComments: pendingComments?.count || 0,
        },
        recentPosts: recentPosts.results,
      })
    } catch (error) {
      console.error('Get stats error:', error)
      return errorResponse('获取统计数据失败', 500)
    }
  })
}
