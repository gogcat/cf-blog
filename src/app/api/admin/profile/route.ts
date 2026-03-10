import { NextRequest, NextResponse } from 'next/server'
import { withRole, successResponse, errorResponse } from '@/lib/api'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { generateRefreshToken, getTokenExpiration } from '@/lib/auth/jwt'
import { sendEmail, getPasswordChangeConfirmationHtml } from '@/lib/email'
import { generateUUID } from '@/lib/utils'
import type { User } from '@/types'

export async function PUT(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const body = await request.json() as { name?: string; email?: string; avatar_url?: string; currentPassword?: string; newPassword?: string }
      const { name, email, avatar_url, currentPassword, newPassword } = body

      if (!name && !email && !avatar_url && !newPassword) {
        return errorResponse('没有要更新的字段', 400)
      }

      const emailServiceEnabled = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
        .bind('email_enabled')
        .first<{ value: string }>()
      
      const isEmailEnabled = emailServiceEnabled?.value === 'true'

      if (newPassword) {
        if (!currentPassword) {
          return errorResponse('请输入当前密码', 400)
        }

        const userRecord: any = await env.DB.prepare(
          'SELECT password_hash FROM users WHERE id = ?'
        ).bind(user.id).first()

        if (!userRecord) {
          return errorResponse('用户不存在', 404)
        }

        const currentPasswordHash = await hashPassword(currentPassword)
        const validPassword = currentPasswordHash === userRecord.password_hash
        
        if (!validPassword) {
          return errorResponse('当前密码错误', 400)
        }

        const passwordValidation = validatePasswordStrength(newPassword)
        if (!passwordValidation.valid) {
          return errorResponse(passwordValidation.errors[0], 400, 'PASSWORD_WEAK')
        }

        if (isEmailEnabled) {
          const hashedPassword = await hashPassword(newPassword)
          const token = generateRefreshToken()
          const expiresAt = getTokenExpiration('1h')
          const now = new Date().toISOString()
          
          await env.DB.prepare(`
            INSERT INTO password_change_verifications (id, user_id, new_password_hash, token, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(generateUUID(), user.id, hashedPassword, token, expiresAt, now).run()
          
          const confirmationUrl = `${env.SITE_URL}/verify-password-change?token=${token}`
          await sendEmail(env, {
            to: user.email,
            subject: `确认密码修改 - ${env.SITE_NAME}`,
            html: getPasswordChangeConfirmationHtml(env.SITE_NAME, confirmationUrl),
          })
          
          return successResponse({
            message: '确认邮件已发送到您的邮箱，请查收',
            requireEmailVerification: true,
          })
        }

        const hashedPassword = await hashPassword(newPassword)
        await env.DB.prepare(
          'UPDATE users SET name = ?, email = ?, avatar_url = ?, password_hash = ?, updated_at = ? WHERE id = ?'
        ).bind(name || user.name, email || user.email, avatar_url || user.avatar_url, hashedPassword, new Date().toISOString(), user.id).run()
        
        return successResponse({ message: '密码修改成功' })
      } else {
        await env.DB.prepare(
          'UPDATE users SET name = ?, email = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
        ).bind(name || user.name, email || user.email, avatar_url || user.avatar_url, new Date().toISOString(), user.id).run()
        
        return successResponse({ message: '保存成功' })
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      return errorResponse('更新失败', 500)
    }
  })
}
