import { NextRequest, NextResponse } from 'next/server'
import { withRole, successResponse, errorResponse } from '@/lib/api'
import { listThemesFromDB } from '@/lib/themes/loader'

export async function GET(request: NextRequest) {
  return withRole(request, ['admin'], async () => {
    try {
      const themes = await listThemesFromDB()
      return successResponse({ themes })
    } catch (error) {
      console.error('Failed to load themes:', error)
      return errorResponse('加载主题列表失败', 500)
    }
  })
}
