'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  interface RegisterResponse {
    success: boolean
    error?: string
    details?: Record<string, string[]>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json() as RegisterResponse

      if (data.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || '注册失败')
        if (data.details) {
          const messages = Object.values(data.details).flat()
          if (messages.length > 0) {
            setError(messages[0])
          }
        }
      }
    } catch {
      setError('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12">
      <Container className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">注册</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
              <Input
                label="用户名"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="请输入用户名"
              />
              <Input
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入邮箱"
              />
              <Input
                label="密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入密码 (至少8位，包含大小写字母和数字)"
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '注册中...' : '注册'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">
              已有账号？{' '}
              <Link href="/login" className="text-primary-600 hover:underline">
                立即登录
              </Link>
            </p>
          </CardFooter>
        </Card>
      </Container>
    </div>
  )
}
