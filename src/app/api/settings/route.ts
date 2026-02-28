import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv()
    
    const settings = await env.DB.prepare(
      'SELECT key, value FROM settings WHERE deleted_at IS NULL'
    ).all<{ key: string; value: string }>()
    
    const settingsMap: Record<string, string> = {}
    for (const setting of settings.results || []) {
      settingsMap[setting.key] = setting.value
    }
    
    return NextResponse.json({
      success: true,
      data: { settings: settingsMap },
    })
  } catch (error) {
    console.error('Get public settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
