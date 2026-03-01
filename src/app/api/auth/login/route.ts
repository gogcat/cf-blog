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

    console.log('=== LOGIN DEBUG START ===')
    console.log('1. Starting login process')

    const body = await request.json() as any
    console.log('2. Request body:', { email: body.email })

    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('3. Validation failed:', validationResult.error.flatten().fieldErrors)
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    console.log('3. Validation passed')

    const { email, password, remember } = validationResult.data
    console.log('4. Parsed data:', { email, remember })

    console.log('5. Querying database for user...')
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(email)
      .first<User>()

    if (!user) {
      console.log('5. User NOT found in database')
      return errorResponse('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    if (!user.password_hash) {
      console.log('5. User has no password hash')
      return errorResponse('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    console.log('5. User found:', {
      email: user.email,
      name: user.name,
      role: user.role,
      password_hash_length: user.password_hash.length
    })

    console.log('6. Verifying password...')
    const isValidPassword = await verifyPassword(password, user.password_hash)
    console.log('6. Password valid:', isValidPassword)

    if (!isValidPassword) {
      console.log('6. Password mismatch')
      return errorResponse('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    console.log('7. Generating JWT token...')
    const accessToken = await signJWT(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      '15m'
    )

    const refreshToken = generateRefreshToken()
    const refreshTokenExpires = getTokenExpiration(remember ? '30d' : '7d')
    const now = new Date().toISOString()
    const clientInfo = getClientInfo(request)

    console.log('8. Creating session...')
    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(generateUUID(), user.id, refreshToken, clientInfo.userAgent, clientInfo.ipAddress, refreshTokenExpires, now).run()

    console.log('9. Creating response...')
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

    console.log('=== LOGIN DEBUG END ===')
    return response
  } catch (error: any) {
    console.error('=== LOGIN ERROR ===')
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Error:', error)
    return errorResponse('登录失败，请稍后重试', 500, 'INTERNAL_ERROR')
  }
}
