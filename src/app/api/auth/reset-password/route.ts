import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getEnv, successResponse, errorResponse } from '@/lib/api'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { generateUUID } from '@/lib/utils'

const resetPasswordSchema = z.object({
  token: z.string().min(1, '重置令牌无效'),
  password: z.string().min(8, '密码长度至少8位').max(32, '密码长度不能超过32位'),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv()
    const body = await request.json()
    
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>)
    }
    
    const { token, password } = validationResult.data
    
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.errors[0], 400, 'PASSWORD_WEAK')
    }
    
    const resetRecord = await env.DB.prepare(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > ?'
    ).bind(token, new Date().toISOString()).first<{ id: string; email: string }>()
    
    if (!resetRecord) {
      return errorResponse('重置链接已过期或无效', 400, 'INVALID_TOKEN')
    }
    
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL'
    ).bind(resetRecord.email).first<{ id: string }>()
    
    if (!user) {
      return errorResponse('用户不存在', 400, 'USER_NOT_FOUND')
    }
    
    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()
    
    await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(passwordHash, now, user.id)
      .run()
    
    await env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run()
    
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run()
    
    return successResponse({
      message: '密码重置成功，请使用新密码登录',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return errorResponse('重置密码失败，请稍后重试', 500, 'INTERNAL_ERROR')
  }
}
