import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getEnv, successResponse, errorResponse, setAuthCookies, getClientInfo } from '@/lib/api'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { signJWT, generateRefreshToken, getTokenExpiration } from '@/lib/auth/jwt'
import { sendEmail, getVerificationEmailHtml } from '@/lib/email'
import { generateUUID } from '@/lib/utils'
import type { ApiResponse, User } from '@/types'

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码长度至少8位').max(32, '密码长度不能超过32位'),
  name: z.string().min(2, '用户名长度至少2位').max(50, '用户名长度不能超过50位'),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    
    // 检查邮件服务是否配置
    const emailServiceEnabled = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('email_enabled')
      .first<{ value: string }>()
    
    if (!emailServiceEnabled || emailServiceEnabled.value !== 'true') {
      return errorResponse('当前注册未开放，请联系管理员', 503, 'REGISTRATION_CLOSED')
    }
    
    const body = await request.json()
    
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR', 
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    
    const { email, password, name } = validationResult.data
    
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.errors[0], 400, 'PASSWORD_WEAK')
    }
    
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(email)
      .first()
    
    if (existingUser) {
      return errorResponse('邮箱已被注册', 400, 'EMAIL_EXISTS')
    }
    
    const userId = generateUUID()
    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()
    
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, oauth_providers, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', '{}', ?, ?)
    `).bind(userId, email, passwordHash, name, now, now).run()
    
    const verificationToken = generateRefreshToken()
    const verificationExpires = getTokenExpiration('24h')
    
    await env.DB.prepare(`
      INSERT INTO email_verifications (id, email, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(generateUUID(), email, verificationToken, verificationExpires, now).run()
    
    const verificationUrl = `${env.SITE_URL}/verify-email?token=${verificationToken}`
    await sendEmail(env, {
      to: email,
      subject: `验证您的邮箱 - ${env.SITE_NAME}`,
      html: getVerificationEmailHtml(env.SITE_NAME, verificationUrl),
    })
    
    const accessToken = await signJWT(
      { sub: userId, email, role: 'user' },
      env.JWT_SECRET,
      '15m'
    )
    
    const refreshToken = generateRefreshToken()
    const refreshTokenExpires = getTokenExpiration('7d')
    const clientInfo = getClientInfo(request)
    
    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(generateUUID(), userId, refreshToken, clientInfo.userAgent, clientInfo.ipAddress, refreshTokenExpires, now).run()
    
    const response = successResponse({
      user: {
        id: userId,
        email,
        name,
        avatar_url: null,
        role: 'user' as const,
        email_verified_at: null,
        created_at: now,
        updated_at: now,
      },
      access_token: accessToken,
    }, 201)
    
    setAuthCookies(response, accessToken, refreshToken)
    
    return response
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('注册失败，请稍后重试', 500, 'INTERNAL_ERROR')
  }
}
