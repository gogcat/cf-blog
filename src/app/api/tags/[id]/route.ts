import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withRole } from '@/lib/api'
import { z } from 'zod'
import type { User, Tag } from '@/types'

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const env = getEnv()
    const { id } = await params
    
    const tag = await env.DB.prepare(
      'SELECT * FROM tags WHERE id = ?'
    ).bind(id).first<Tag>()
    
    if (!tag) {
      return errorResponse('标签不存在', 404, 'NOT_FOUND')
    }
    
    return successResponse({ tag })
  } catch (error) {
    console.error('Get tag error:', error)
    return errorResponse('获取标签失败', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  return withRole(request, ['author', 'admin'], async (user: User, env) => {
    try {
      const { id } = await params
      const body = await request.json()
      const validationResult = updateTagSchema.safeParse(body)
      
      if (!validationResult.success) {
        return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>)
      }
      
      const existing = await env.DB.prepare(
        'SELECT * FROM tags WHERE id = ?'
      ).bind(id).first<Tag>()
      
      if (!existing) {
        return errorResponse('标签不存在', 404, 'NOT_FOUND')
      }
      
      const { name, slug } = validationResult.data
      const updates: string[] = []
      const values: unknown[] = []
      
      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      
      if (slug !== undefined) {
        const slugExists = await env.DB.prepare(
          'SELECT id FROM tags WHERE slug = ? AND id != ?'
        ).bind(slug, id).first()
        
        if (slugExists) {
          return errorResponse('标签 Slug 已存在', 400, 'SLUG_EXISTS')
        }
        updates.push('slug = ?')
        values.push(slug)
      }
      
      if (updates.length === 0) {
        return successResponse({ tag: existing })
      }
      
      updates.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id)
      
      await env.DB.prepare(
        `UPDATE tags SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run()
      
      const tag = await env.DB.prepare(
        'SELECT * FROM tags WHERE id = ?'
      ).bind(id).first<Tag>()
      
      return successResponse({ tag })
    } catch (error) {
      console.error('Update tag error:', error)
      return errorResponse('更新标签失败', 500)
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { id } = await params
      
      const existing = await env.DB.prepare(
        'SELECT id FROM tags WHERE id = ?'
      ).bind(id).first()
      
      if (!existing) {
        return errorResponse('标签不存在', 404, 'NOT_FOUND')
      }
      
      await env.DB.prepare('DELETE FROM post_tags WHERE tag_id = ?').bind(id).run()
      await env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(id).run()
      
      return successResponse({ message: '标签已删除' })
    } catch (error) {
      console.error('Delete tag error:', error)
      return errorResponse('删除标签失败', 500)
    }
  })
}
