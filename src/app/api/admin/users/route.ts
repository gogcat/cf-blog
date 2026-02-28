import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withRole } from '@/lib/api'
import { generateUUID } from '@/lib/utils'
import { z } from 'zod'
import type { User } from '@/types'

const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  role: z.enum(['user', 'author', 'admin']).optional(),
  email_verified_at: z.string().nullable().optional(),
})

export async function GET(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1', 10)
      const limit = parseInt(searchParams.get('limit') || '20', 10)
      const offset = (page - 1) * limit

      const countResult = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
      ).first<{ count: number }>()

      const total = countResult?.count || 0

      const result = await env.DB.prepare(`
        SELECT id, email, name, avatar_url, role, oauth_providers, email_verified_at, created_at, updated_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all()

      const users = result.results.map((row) => ({
        id: (row as { id: string }).id,
        email: (row as { email: string }).email,
        name: (row as { name: string }).name,
        avatar_url: (row as { avatar_url: string | null }).avatar_url,
        role: (row as { role: 'user' | 'author' | 'admin' }).role,
        oauth_providers: (row as { oauth_providers: string | null }).oauth_providers,
        email_verified_at: (row as { email_verified_at: string | null }).email_verified_at,
        created_at: (row as { created_at: string }).created_at,
        updated_at: (row as { updated_at: string }).updated_at,
      }))

      return successResponse({
        users,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Get users error:', error)
      return errorResponse('获取用户列表失败', 500)
    }
  })
}

export async function PUT(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { searchParams } = new URL(request.url)
      const userId = searchParams.get('id')

      if (!userId) {
        return errorResponse('缺少用户ID', 400)
      }

      const body = await request.json()
      const validationResult = updateUserSchema.safeParse(body)

      if (!validationResult.success) {
        return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>)
      }

      const { name, role, email_verified_at } = validationResult.data

      const updates: string[] = []
      const values: unknown[] = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }

      if (role !== undefined) {
        updates.push('role = ?')
        values.push(role)
      }

      if (email_verified_at !== undefined) {
        updates.push('email_verified_at = ?')
        values.push(email_verified_at)
      }

      if (updates.length === 0) {
        return errorResponse('没有要更新的字段', 400)
      }

      updates.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(userId)

      await env.DB.prepare(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run()

      const updatedUser = await env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(userId).first<User>()

      if (!updatedUser) {
        return errorResponse('用户不存在', 404)
      }

      return successResponse({ user: updatedUser })
    } catch (error) {
      console.error('Update user error:', error)
      return errorResponse('更新用户失败', 500)
    }
  })
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { searchParams } = new URL(request.url)
      const userId = searchParams.get('id')

      if (!userId) {
        return errorResponse('缺少用户ID', 400)
      }

      if (userId === user.id) {
        return errorResponse('不能删除自己的账号', 400)
      }

      const now = new Date().toISOString()
      await env.DB.prepare(
        'UPDATE users SET deleted_at = ? WHERE id = ?'
      ).bind(now, userId).run()

      return successResponse({ message: '用户已删除' })
    } catch (error) {
      console.error('Delete user error:', error)
      return errorResponse('删除用户失败', 500)
    }
  })
}
