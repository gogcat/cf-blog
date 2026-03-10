import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getEnv, successResponse, errorResponse } from '@/lib/api'

const verifyPasswordChangeSchema = z.object({
  token: z.string().min(1, '验证令牌不能为空'),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    const body = await request.json()
    
    const validationResult = verifyPasswordChangeSchema.safeParse(body)
    
    if (!validationResult.success) {
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    
    const { token } = validationResult.data
    
    const verification = await env.DB.prepare(`
      SELECT * FROM password_change_verifications 
      WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!verification) {
      return errorResponse('验证令牌无效或已过期', 400, 'INVALID_TOKEN')
    }
    
    const now = new Date().toISOString()
    
    await env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `).bind(verification.new_password_hash, now, verification.user_id).run()
    
    await env.DB.prepare('DELETE FROM password_change_verifications WHERE token = ?').bind(token).run()
    
    return successResponse({
      message: '密码修改成功，请重新登录',
    })
  } catch (error) {
    console.error('Verify password change error:', error)
    return errorResponse('验证密码修改失败', 500, 'INTERNAL_ERROR')
  }
}
