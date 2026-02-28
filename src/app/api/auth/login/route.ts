import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getEnv, successResponse, errorResponse, setAuthCookies, getClientInfo } from '@/lib/api'
import { verifyPassword } from '@/lib/auth/password'
import { signJWT, generateRefreshToken, getTokenExpiration } from '@/lib/auth/jwt'
import { generateUUID } from '@/lib/utils'
import type { User } from '@/types'

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean().optional(),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    const body = await request.json()
    
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    
    const { email, password, remember } = validationResult.data
    
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(email)
      .first<User>()
    
    if (!user || !user.password_hash) {
      return errorResponse('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }
    
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return errorResponse('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }
    
    const accessToken = await signJWT(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      '15m'
    )
    
    const refreshToken = generateRefreshToken()
    const refreshTokenExpires = getTokenExpiration(remember ? '30d' : '7d')
    const now = new Date().toISOString()
    const clientInfo = getClientInfo(request)
    
    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(generateUUID(), user.id, refreshToken, clientInfo.userAgent, clientInfo.ipAddress, refreshTokenExpires, now).run()
    
    const response = successResponse({
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
      access_token: accessToken,
    })
    
    setAuthCookies(response, accessToken, refreshToken, remember)
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('登录失败，请稍后重试', 500, 'INTERNAL_ERROR')
  }
}
