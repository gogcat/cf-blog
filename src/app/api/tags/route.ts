import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withRole } from '@/lib/api'
import { generateUUID, generateSlug } from '@/lib/utils'
import { z } from 'zod'
import type { User, Tag } from '@/types'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
})

export async function GET(): Promise<Response> {
  try {
    const env = getEnv()
    const result = await env.DB.prepare(
      'SELECT * FROM tags ORDER BY created_at DESC'
    ).all<Tag>()
    
    return successResponse({ tags: result.results })
  } catch (error) {
    console.error('Get tags error:', error)
    return errorResponse('获取标签列表失败', 500)
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  return withRole(request, ['author', 'admin'], async (user: User, env) => {
    try {
      const body = await request.json()
      const validationResult = createTagSchema.safeParse(body)
      
      if (!validationResult.success) {
        return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>)
      }
      
      const { name, slug } = validationResult.data
      const tagSlug = slug || generateSlug(name)
      
      const existing = await env.DB.prepare(
        'SELECT id FROM tags WHERE slug = ?'
      ).bind(tagSlug).first()
      
      if (existing) {
        return errorResponse('标签 Slug 已存在', 400, 'SLUG_EXISTS')
      }
      
      const id = generateUUID()
      const now = new Date().toISOString()
      
      await env.DB.prepare(`
        INSERT INTO tags (id, name, slug, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, name, tagSlug, now, now).run()
      
      const tag = await env.DB.prepare(
        'SELECT * FROM tags WHERE id = ?'
      ).bind(id).first<Tag>()
      
      return successResponse({ tag }, 201)
    } catch (error) {
      console.error('Create tag error:', error)
      return errorResponse('创建标签失败', 500)
    }
  })
}
