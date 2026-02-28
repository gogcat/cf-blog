import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/api'
import type { User } from '@/types'

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const body = await request.json() as { name?: string; email?: string; avatar_url?: string; currentPassword?: string; newPassword?: string }
      const { name, email, avatar_url, currentPassword, newPassword } = body

      if (!name && !email && !avatar_url && !newPassword) {
        return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
      }

      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json({ success: false, error: '请输入当前密码' }, { status: 400 })
        }

        const [userRecord]: any = await env.DB.prepare(
          'SELECT password FROM users WHERE id = ?'
        ).bind(user.id).first()

        if (!userRecord) {
          return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
        }

        const bcrypt = await import('bcryptjs')
        const validPassword = await bcrypt.compare(currentPassword, userRecord.password)
        
        if (!validPassword) {
          return NextResponse.json({ success: false, error: '当前密码错误' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        
        await env.DB.prepare(
          'UPDATE users SET name = ?, email = ?, avatar_url = ?, password = ?, updated_at = ? WHERE id = ?'
        ).bind(name || user.name, email || user.email, avatar_url || user.avatar_url, hashedPassword, new Date().toISOString(), user.id).run()
      } else {
        await env.DB.prepare(
          'UPDATE users SET name = ?, email = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
        ).bind(name || user.name, email || user.email, avatar_url || user.avatar_url, new Date().toISOString(), user.id).run()
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Update profile error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
    }
  })
}
