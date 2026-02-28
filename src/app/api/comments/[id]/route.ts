import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withAuth, withRole } from '@/lib/api'
import type { User } from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  return withAuth(request, async (user: User, env) => {
    try {
      const { id } = await params
      
      const comment = await env.DB.prepare(
        'SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL'
      ).bind(id).first<{ id: string; user_id: string; post_id: string }>()
      
      if (!comment) {
        return errorResponse('评论不存在', 404, 'NOT_FOUND')
      }
      
      if (comment.user_id !== user.id && user.role !== 'admin') {
        return errorResponse('无权删除此评论', 403, 'FORBIDDEN')
      }
      
      await env.DB.prepare(
        'UPDATE comments SET deleted_at = ? WHERE id = ?'
      ).bind(new Date().toISOString(), id).run()
      
      return successResponse({ message: '评论已删除' })
    } catch (error) {
      console.error('Delete comment error:', error)
      return errorResponse('删除评论失败', 500)
    }
  })
}
