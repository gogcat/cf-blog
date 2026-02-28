import { NextRequest } from 'next/server'
import { getEnv, successResponse, clearAuthCookies, getTokenFromRequest } from '@/lib/api'

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    const refreshToken = request.cookies.get('refresh_token')?.value
    
    if (refreshToken) {
      await env.DB.prepare('DELETE FROM sessions WHERE refresh_token = ?')
        .bind(refreshToken)
        .run()
    }
    
    const response = successResponse({ message: '已成功登出' })
    clearAuthCookies(response)
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = successResponse({ message: '已成功登出' })
    clearAuthCookies(response)
    return response
  }
}
