import { NextRequest } from 'next/server'
import { getEnv, errorResponse, successResponse, withRole } from '@/lib/api'
import type { User } from '@/types'
import { generateUUID } from '@/lib/utils'

export async function GET(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { searchParams } = new URL(request.url)
      const prefix = searchParams.get('prefix') || ''
      const limit = parseInt(searchParams.get('limit') || '50', 10)
      const cursor = searchParams.get('cursor') || undefined

      if (!env.R2) {
        return errorResponse('R2 未配置', 500)
      }

      const list = await env.R2.list({
        prefix,
        limit,
        cursor,
      })

      const mediaFiles = list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        httpEtag: obj.httpEtag,
        publicUrl: env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL}/${obj.key}` : `/assets/${obj.key}`,
      }))

      return successResponse({
        files: mediaFiles,
        cursor: list.truncated ? (list as { cursor?: string }).cursor || null : null,
        truncated: list.truncated,
      })
    } catch (error) {
      console.error('List media error:', error)
      return errorResponse('获取媒体列表失败', 500)
    }
  })
}

export async function POST(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return errorResponse('请选择要上传的文件', 400)
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      if (!allowedTypes.includes(file.type)) {
        return errorResponse('仅支持 JPG、PNG、GIF、WebP、SVG 格式的图片', 400)
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return errorResponse('文件大小不能超过 10MB', 400)
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${generateUUID()}.${ext}`

      if (!env.R2) {
        return errorResponse('R2 未配置', 500)
      }

      await env.R2.put(filename, buffer, {
        httpMetadata: {
          contentType: file.type,
        },
      })

      const publicUrl = env.R2_PUBLIC_URL 
        ? `${env.R2_PUBLIC_URL}/${filename}` 
        : `/assets/${filename}`

      return successResponse({
        filename,
        url: publicUrl,
        size: file.size,
      })
    } catch (error) {
      console.error('Upload media error:', error)
      return errorResponse('上传文件失败', 500)
    }
  })
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { searchParams } = new URL(request.url)
      const key = searchParams.get('key')

      if (!key) {
        return errorResponse('缺少文件 key', 400)
      }

      if (!env.R2) {
        return errorResponse('R2 未配置', 500)
      }

      await env.R2.delete(key)

      return successResponse({ message: '删除成功' })
    } catch (error) {
      console.error('Delete media error:', error)
      return errorResponse('删除文件失败', 500)
    }
  })
}
