import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getEnv, successResponse, errorResponse, getUserFromRequest } from '@/lib/api'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { generateRefreshToken, getTokenExpiration } from '@/lib/auth/jwt'
import { sendEmail, getPasswordChangeConfirmationHtml } from '@/lib/email'
import { generateUUID } from '@/lib/utils'

const requestPasswordChangeSchema = z.object({
  new_password: z.string().min(8, '密码长度至少8位').max(32, '密码长度不能超过32位'),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    const user = await getUserFromRequest(request, env)
    
    if (!user) {
      return errorResponse('未登录', 401, 'UNAUTHORIZED')
    }

    const emailServiceEnabled = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('email_enabled')
      .first<{ value: string }>()
    
    if (!emailServiceEnabled || emailServiceEnabled.value !== 'true') {
      return errorResponse('邮件服务未启用', 400, 'EMAIL_SERVICE_DISABLED')
    }

    const body = await request.json()
    const validationResult = requestPasswordChangeSchema.safeParse(body)
    
    if (!validationResult.success) {
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    
    const { new_password } = validationResult.data
    
    const passwordValidation = validatePasswordStrength(new_password)
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.errors[0], 400, 'PASSWORD_WEAK')
    }
    
    const newPasswordHash = await hashPassword(new_password)
    const token = generateRefreshToken()
    const expiresAt = getTokenExpiration('1h')
    const now = new Date().toISOString()
    
    await env.DB.prepare(`
      INSERT INTO password_change_verifications (id, user_id, new_password_hash, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(generateUUID(), user.id, newPasswordHash, token, expiresAt, now).run()
    
    const confirmationUrl = `${env.SITE_URL}/verify-password-change?token=${token}`
    await sendEmail(env, {
      to: user.email,
      subject: `确认密码修改 - ${env.SITE_NAME}`,
      html: getPasswordChangeConfirmationHtml(env.SITE_NAME, confirmationUrl),
    })
    
    return successResponse({
      message: '确认邮件已发送到您的邮箱，请查收',
    })
  } catch (error) {
    console.error('Request password change error:', error)
    return errorResponse('发送确认邮件失败', 500, 'INTERNAL_ERROR')
  }
}
