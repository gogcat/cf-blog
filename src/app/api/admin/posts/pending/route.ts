import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withRole } from '@/lib/api'
import type { User, Post } from '@/types'

export async function GET(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const url = new URL(request.url)
      const moderationStatus = url.searchParams.get('moderation_status') as 'pending' | 'approved' | 'rejected' | null
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const offset = (page - 1) * limit

      let query = `
        SELECT p.*, 
               u.name as author_name,
               u.email as author_email,
               c.name as category_name,
               c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.deleted_at IS NULL
      `
      const params: any[] = []

      if (moderationStatus) {
        query += ' AND p.moderation_status = ?'
        params.push(moderationStatus)
      }

      query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const postsResult = await env.DB.prepare(query).bind(...params).all()
      const posts = (postsResult.results || []) as unknown as (Post & { author_name: string; author_email: string; category_name?: string; category_slug?: string })[]

      let countQueryStr = `
        SELECT COUNT(*) as total
        FROM posts
        WHERE deleted_at IS NULL
      `
      const countParams: any[] = []

      if (moderationStatus) {
        countQueryStr += ' AND moderation_status = ?'
        countParams.push(moderationStatus)
      }

      const countResult = await env.DB.prepare(countQueryStr).bind(...countParams).first<{ total: number }>()
      const total = countResult?.total || 0

      const postsWithTags = []
      for (const post of posts) {
        const tagsResult = await env.DB.prepare(`
          SELECT t.* FROM tags t
          JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `).bind(post.id).all()
        const postWithTags = { ...post, tags: (tagsResult.results || []) as unknown as { id: string; name: string; slug: string }[] }
        postsWithTags.push(postWithTags)
      }

      return successResponse({
        posts: postsWithTags,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Get pending posts error:', error)
      return errorResponse('获取待审核文章失败', 500, 'INTERNAL_ERROR')
    }
  })
}
