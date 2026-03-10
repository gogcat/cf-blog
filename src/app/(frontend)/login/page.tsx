'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SettingsResponse {
  success: boolean
  data?: {
    settings: Record<string, string>
  }
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setResetSuccess(true)
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((data: unknown) => {
        const settingsData = data as SettingsResponse
        if (settingsData.success && settingsData.data?.settings) {
          setEmailEnabled(settingsData.data.settings.email_enabled === 'true')
        }
      })
      .catch(() => {})
  }, [])

  interface LoginResponse {
    success: boolean
    error?: string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json() as LoginResponse

      if (data.success) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">用户登录</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {resetSuccess && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md">
              密码重置成功，请使用新密码登录
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}
          <Input
            label="邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="请输入邮箱"
          />
          <div className="space-y-1">
            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="请输入密码"
            />
            {emailEnabled && (
              <div className="flex justify-end">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary-600 hover:underline"
                >
                  忘记密码？
                </Link>
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          还没有账号？{' '}
          <Link href="/register" className="text-primary-600 hover:underline">
            立即注册
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

function LoginFallback() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="py-12">
      <Container className="max-w-md">
        <Suspense fallback={<LoginFallback />}>
          <LoginContent />
        </Suspense>
      </Container>
    </div>
  )
}
