import { NextRequest } from 'next/server'
import { getEnv, successResponse, errorResponse, withRole } from '@/lib/api'
import { z } from 'zod'
import type { User, Post } from '@/types'
import { sendEmail, getPostModerationNotificationHtml } from '@/lib/email'

const approveSchema = z.object({
  note: z.string().optional(),
})

const rejectSchema = z.object({
  note: z.string().min(1, '请提供拒绝原因'),
})

const moderationNoteSchema = z.object({
  note: z.string().min(1, '请提供审核备注'),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const post = await env.DB.prepare('SELECT p.*, u.email as author_email FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ? AND p.deleted_at IS NULL')
        .bind(id)
        .first<Post & { author_email: string }>()
      
      if (!post) {
        return errorResponse('文章不存在', 404, 'NOT_FOUND')
      }

      if (post.moderation_status === 'approved') {
        return errorResponse('文章已审核通过', 400, 'ALREADY_APPROVED')
      }

      const body = await request.json()
      const validationResult = approveSchema.safeParse(body)
      
      if (!validationResult.success) {
        return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>)
      }
      
      const { note } = validationResult.data
      const now = new Date().toISOString()
      
      await env.DB.prepare(`
        UPDATE posts 
        SET moderation_status = 'approved', 
            moderation_note = ?,
            moderated_by = ?,
            moderated_at = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(note || null, user.id, now, now, id).run()
      
      const emailServiceEnabled = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
        .bind('email_enabled')
        .first<{ value: string }>()
      
      if (emailServiceEnabled?.value === 'true' && post.author_email) {
        await sendEmail(env, {
          to: post.author_email,
          subject: `文章审核通过 - ${env.SITE_NAME}`,
          html: getPostModerationNotificationHtml(env.SITE_NAME, post.title, 'approved', note),
        })
      }
      
      return successResponse({ message: '文章已审核通过' })
    } catch (error) {
      console.error('Approve post error:', error)
      return errorResponse('审核通过失败', 500, 'INTERNAL_ERROR')
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const post = await env.DB.prepare('SELECT p.*, u.email as author_email FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ? AND p.deleted_at IS NULL')
        .bind(id)
        .first<Post & { author_email: string }>()
      
      if (!post) {
        return errorResponse('文章不存在', 404, 'NOT_FOUND')
      }

      if (post.moderation_status === 'rejected') {
        return errorResponse('文章已审核拒绝', 400, 'ALREADY_REJECTED')
      }

      const body = await request.json()
      const validationResult = rejectSchema.safeParse(body)
      
      if (!validationResult.success) {
        return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>)
      }
      
      const { note } = validationResult.data
      const now = new Date().toISOString()
      
      await env.DB.prepare(`
        UPDATE posts 
        SET moderation_status = 'rejected', 
            moderation_note = ?,
            moderated_by = ?,
            moderated_at = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(note, user.id, now, now, id).run()
      
      const emailServiceEnabled = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
        .bind('email_enabled')
        .first<{ value: string }>()
      
      if (emailServiceEnabled?.value === 'true' && post.author_email) {
        await sendEmail(env, {
          to: post.author_email,
          subject: `文章审核拒绝 - ${env.SITE_NAME}`,
          html: getPostModerationNotificationHtml(env.SITE_NAME, post.title, 'rejected', note),
        })
      }
      
      return successResponse({ message: '文章已审核拒绝' })
    } catch (error) {
      console.error('Reject post error:', error)
      return errorResponse('审核拒绝失败', 500, 'INTERNAL_ERROR')
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL')
        .bind(id)
        .first<Post>()
      
      if (!post) {
        return errorResponse('文章不存在', 404, 'NOT_FOUND')
      }

      const body = await request.json()
      const validationResult = moderationNoteSchema.safeParse(body)
      
      if (!validationResult.success) {
        return errorResponse('参数验证失败', 400, 'VALIDATION_ERROR',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>)
      }
      
      const { note } = validationResult.data
      const now = new Date().toISOString()
      
      await env.DB.prepare(`
        UPDATE posts 
        SET moderation_note = ?,
            moderated_by = ?,
            moderated_at = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(note, user.id, now, now, id).run()
      
      return successResponse({ message: '审核备注已更新' })
    } catch (error) {
      console.error('Update moderation note error:', error)
      return errorResponse('更新审核备注失败', 500, 'INTERNAL_ERROR')
    }
  })
}
