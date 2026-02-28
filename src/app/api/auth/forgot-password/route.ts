import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getEnv, successResponse, errorResponse } from '@/lib/api'
import { generateRefreshToken, getTokenExpiration } from '@/lib/auth/jwt'
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email'
import { generateUUID } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    const body = await request.json()
    
    const validationResult = forgotPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    
    const { email } = validationResult.data
    
    const user = await env.DB.prepare('SELECT id, email, name FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(email)
      .first()
    
    if (user) {
      const resetToken = generateRefreshToken()
      const resetExpires = getTokenExpiration('1h')
      const now = new Date().toISOString()
      
      await env.DB.prepare(`
        INSERT INTO password_resets (id, email, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(generateUUID(), email, resetToken, resetExpires, now).run()
      
      const resetUrl = `${env.SITE_URL}/reset-password?token=${resetToken}`
      await sendEmail(env, {
        to: email,
        subject: `重置您的密码 - ${env.SITE_NAME}`,
        html: getPasswordResetEmailHtml(env.SITE_NAME, resetUrl),
      })
    }
    
    return successResponse({
      message: '如果该邮箱已注册，您将收到密码重置邮件',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return errorResponse('发送重置邮件失败，请稍后重试', 500, 'INTERNAL_ERROR')
  }
}
