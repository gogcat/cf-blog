import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, setAuthCookies, getClientInfo } from '@/lib/api'
import { verifyJWT, signJWT, generateRefreshToken, getTokenExpiration } from '@/lib/auth/jwt'
import { generateUUID } from '@/lib/utils'
import type { User, Session } from '@/types'

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    const refreshToken = request.cookies.get('refresh_token')?.value
    
    if (!refreshToken) {
      return errorResponse('未授权访问', 401, 'UNAUTHORIZED')
    }
    
    const session = await env.DB.prepare(
      'SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > ?'
    ).bind(refreshToken, new Date().toISOString()).first<Session>()
    
    if (!session) {
      const response = errorResponse('会话已过期，请重新登录', 401, 'SESSION_EXPIRED')
      return response
    }
    
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(session.user_id).first<User>()
    
    if (!user) {
      await env.DB.prepare('DELETE FROM sessions WHERE refresh_token = ?').bind(refreshToken).run()
      return errorResponse('用户不存在', 401, 'USER_NOT_FOUND')
    }
    
    await env.DB.prepare('DELETE FROM sessions WHERE refresh_token = ?').bind(refreshToken).run()
    
    const accessToken = await signJWT(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      '15m'
    )
    
    const newRefreshToken = generateRefreshToken()
    const refreshTokenExpires = getTokenExpiration('7d')
    const now = new Date().toISOString()
    const clientInfo = getClientInfo(request)
    
    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(generateUUID(), user.id, newRefreshToken, clientInfo.userAgent, clientInfo.ipAddress, refreshTokenExpires, now).run()
    
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
    
    setAuthCookies(response, accessToken, newRefreshToken)
    
    return response
  } catch (error) {
    console.error('Refresh token error:', error)
    return errorResponse('刷新令牌失败', 500, 'INTERNAL_ERROR')
  }
}
