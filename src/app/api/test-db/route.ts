import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv()

    // 测试数据库连接
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind('admin@example.com')
      .first<any>()

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found in database',
        envSource: 'process.env' in globalThis && process.env.DB ? 'process.env' : 'cloudflare context'
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        password_hash_length: user.password_hash?.length || 0,
        password_hash_prefix: user.password_hash?.substring(0, 20) || 'N/A'
      },
      envSource: 'process.env' in globalThis && process.env.DB ? 'process.env' : 'cloudflare context'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
