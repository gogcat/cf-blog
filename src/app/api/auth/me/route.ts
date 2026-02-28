import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withAuth } from '@/lib/api'
import type { User } from '@/types'

export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user: User, env) => {
    try {
      const result = await env.DB.prepare(
        'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?'
      ).bind(user.id).first<User>()

      if (!result) {
        return errorResponse('用户不存在', 404)
      }

      return successResponse({ user: result })
    } catch (error) {
      console.error('Get user error:', error)
      return errorResponse('获取用户信息失败', 500)
    }
  })
}
