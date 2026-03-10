import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getEnv, successResponse, errorResponse, getUserFromRequest } from '@/lib/api'
import { generateRefreshToken, getTokenExpiration } from '@/lib/auth/jwt'
import { sendEmail, getEmailChangeVerificationHtml } from '@/lib/email'
import { generateUUID } from '@/lib/utils'

const requestEmailChangeSchema = z.object({
  new_email: z.string().email('邮箱格式不正确'),
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
    const validationResult = requestEmailChangeSchema.safeParse(body)
    
    if (!validationResult.success) {
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    
    const { new_email } = validationResult.data
    
    if (new_email === user.email) {
      return errorResponse('新邮箱不能与当前邮箱相同', 400, 'SAME_EMAIL')
    }
    
    const emailExists = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(new_email)
      .first()
    
    if (emailExists) {
      return errorResponse('该邮箱已被注册', 400, 'EMAIL_EXISTS')
    }
    
    const token = generateRefreshToken()
    const expiresAt = getTokenExpiration('1h')
    const now = new Date().toISOString()
    
    await env.DB.prepare(`
      INSERT INTO email_change_verifications (id, user_id, old_email, new_email, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(generateUUID(), user.id, user.email, new_email, token, expiresAt, now).run()
    
    const verificationUrl = `${env.SITE_URL}/verify-email-change?token=${token}`
    await sendEmail(env, {
      to: new_email,
      subject: `确认邮箱变更 - ${env.SITE_NAME}`,
      html: getEmailChangeVerificationHtml(env.SITE_NAME, user.email, new_email, verificationUrl),
    })
    
    return successResponse({
      message: '验证邮件已发送到新邮箱，请查收',
    })
  } catch (error) {
    console.error('Request email change error:', error)
    return errorResponse('发送验证邮件失败', 500, 'INTERNAL_ERROR')
  }
}
