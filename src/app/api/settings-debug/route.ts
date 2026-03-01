import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv()
    console.log('Settings API called')

    // 测试数据库连接
    const settings = await env.DB.prepare('SELECT key, value FROM settings WHERE deleted_at IS NULL')
      .all<any>()

    console.log('Settings fetched:', settings.results.length)

    return NextResponse.json({
      success: true,
      settings: settings.results,
      count: settings.results.length
    })
  } catch (error: any) {
    console.error('Settings API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
