import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getEnv, verifyJWT } from '@/lib/api'
import type { User } from '@/types'

const navItems = [
  { href: '/admin', label: '仪表盘', icon: '📊' },
  { href: '/admin/posts', label: '文章管理', icon: '📝' },
  { href: '/admin/comments', label: '评论管理', icon: '💬' },
  { href: '/admin/media', label: '媒体库', icon: '🖼️' },
  { href: '/admin/categories', label: '分类管理', icon: '📁' },
  { href: '/admin/tags', label: '标签管理', icon: '🏷️' },
  { href: '/admin/friend-links', label: '友链管理', icon: '🔗' },
  { href: '/admin/settings', label: '系统设置', icon: '⚙️' },
]

async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return null
    }
    
    const env = getEnv()
    const payload = await verifyJWT(token, env.JWT_SECRET)
    
    if (!payload) {
      return null
    }
    
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(payload.sub).first<User>()
    
    return user
  } catch {
    return null
  }
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getUser()
  
  if (!user) {
    redirect('/login?redirect=/admin')
  }
  
  const isAdmin = user.role === 'admin'
  
  if (!isAdmin) {
    redirect('/?error=unauthorized')
  }

  const handleLogout = async () => {
    'use server'
    const cookieStore = await cookies()
    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold">
            管理后台
          </Link>
        </div>
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
          >
            <span>🏠</span>
            <span>返回前台</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">管理后台</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.name || user.email}</span>
              <form action={handleLogout}>
                <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
                  退出登录
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
