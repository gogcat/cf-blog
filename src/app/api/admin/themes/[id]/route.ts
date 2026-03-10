import { NextRequest, NextResponse } from 'next/server'
import { withRole, successResponse, errorResponse } from '@/lib/api'
import { loadThemeServer } from '@/lib/themes/loader'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(request, ['admin'], async () => {
    try {
      const { id } = await params
      const theme = await loadThemeServer(id)
      return successResponse(theme)
    } catch (error) {
      console.error('Failed to load theme:', error)
      return errorResponse('加载主题失败', 500)
    }
  })
}
