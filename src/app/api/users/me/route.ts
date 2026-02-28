import { NextRequest, NextResponse } from 'next/server'
import { withAuth, successResponse, errorResponse } from '@/lib/api'
import type { User, Env } from '@/types'

interface UpdateUserBody {
  name?: string
  avatar_url?: string
}

export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user: User) => {
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
        email_verified_at: user.email_verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    })
  })
}

export async function PUT(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user: User, env: Env) => {
    try {
      const body = await request.json() as UpdateUserBody
      const { name, avatar_url } = body
      
      const updates: string[] = []
      const values: unknown[] = []
      
      if (name !== undefined) {
        if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
          return errorResponse('用户名长度必须在2-50位之间', 400)
        }
        updates.push('name = ?')
        values.push(name)
      }
      
      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?')
        values.push(avatar_url)
      }
      
      if (updates.length === 0) {
        return successResponse({ user })
      }
      
      updates.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(user.id)
      
      await env.DB.prepare(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run()
      
      const updatedUser = await env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(user.id).first<User>()
      
      return successResponse({
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          name: updatedUser!.name,
          avatar_url: updatedUser!.avatar_url,
          role: updatedUser!.role,
          email_verified_at: updatedUser!.email_verified_at,
          created_at: updatedUser!.created_at,
          updated_at: updatedUser!.updated_at,
        },
      })
    } catch (error) {
      console.error('Update user error:', error)
      return errorResponse('更新用户信息失败', 500)
    }
  })
}
