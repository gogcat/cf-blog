import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv()

    // 测试数据库连接
    const users = await env.DB.prepare('SELECT id, email, name, role FROM users WHERE deleted_at IS NULL')
      .all<any>()

    return NextResponse.json({
      success: true,
      users: users.results,
      count: users.results.length,
      envSource: 'process.env' in globalThis && process.env.DB ? 'process.env' : 'cloudflare context'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 })
  }
}
