import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/api'
import type { User } from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { status } = body as { status: string }

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }

      const newStatus = status as 'pending' | 'approved' | 'rejected'
      const now = new Date().toISOString()

      await env.DB.prepare(
        'UPDATE comments SET status = ?, updated_at = ? WHERE id = ?'
      ).bind(newStatus, now, id).run()

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Update comment error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update comment' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  return withRole(request, ['admin'], async (user: User, env) => {
    try {
      const { id } = await params

      await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run()

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete comment error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete comment' }, { status: 500 })
    }
  })
}
