import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv()

    // 简单测试数据库连接
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
      .first<{ count: number }>()

    return NextResponse.json({
      success: true,
      message: 'Server is healthy',
      userCount: result?.count || 0,
      timestamp: new Date().toISOString(),
      envSource: 'process.env' in globalThis && process.env.DB ? 'process.env' : 'cloudflare context'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
