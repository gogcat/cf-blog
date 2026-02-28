import { NextRequest, NextResponse } from 'next/server'
import { getEnv, getUserFromRequest } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const env = getEnv()
    const user = await getUserFromRequest(request, env)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const results = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
    
    const settings: Record<string, string> = {}
    results.results.forEach((row) => {
      settings[row.key] = row.value || ''
    })
    
    return NextResponse.json({ success: true, data: { settings } })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const env = getEnv()
    const user = await getUserFromRequest(request, env)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body as { key: string; value: string }
    
    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 })
    }
    
    await env.DB.prepare(`
      UPDATE settings 
      SET value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE key = ?
    `).bind(value, key).run()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
}
