import { NextRequest, NextResponse } from 'next/server'
import { withRole, successResponse, errorResponse } from '@/lib/api'
import { uploadTheme } from '@/lib/themes/uploader'

export async function POST(request: NextRequest) {
  return withRole(request, ['admin'], async () => {
    try {
      const formData = await request.formData()
      const file = formData.get('theme') as File
      
      if (!file) {
        return errorResponse('未找到上传文件', 400)
      }

      if (!file.name.endsWith('.zip')) {
        return errorResponse('无效的文件类型，仅支持 .zip 文件', 400)
      }

      const theme = await uploadTheme(file)
      
      return successResponse(theme)
    } catch (error) {
      console.error('Theme upload failed:', error)
      return errorResponse(
        error instanceof Error ? error.message : '主题上传失败',
        500
      )
    }
  })
}
