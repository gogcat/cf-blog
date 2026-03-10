import { NextRequest, NextResponse } from 'next/server'
import { withRole, successResponse, errorResponse, getEnv } from '@/lib/api'
import { KV } from '@/lib/kv'

interface ActivateRequest {
  themeId: string
}

export async function POST(request: NextRequest) {
  return withRole(request, ['admin'], async () => {
    try {
      const body = await request.json() as ActivateRequest
      const { themeId } = body
      
      if (!themeId) {
        return errorResponse('主题 ID 不能为空', 400)
      }

      const env = getEnv()
      
      const existingSetting = await env.DB.prepare("SELECT id FROM settings WHERE key = 'theme'")
        .first<{ id: string }>()
      
      if (existingSetting) {
        await env.DB.prepare("UPDATE settings SET value = ? WHERE key = 'theme'")
          .bind(themeId)
          .run()
      } else {
        await env.DB.prepare("INSERT INTO settings (id, key, value) VALUES (?, 'theme', ?)")
          .bind(`setting_${Date.now()}`, themeId)
          .run()
      }
      
      try {
        await KV.delete('settings:current')
      } catch (e) {
        // Ignore KV errors
      }
      
      return successResponse({ success: true, themeId })
    } catch (error) {
      console.error('Failed to activate theme:', error)
      return errorResponse('主题激活失败', 500)
    }
  })
}
