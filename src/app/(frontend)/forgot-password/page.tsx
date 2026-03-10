'use client'

import { useState, useEffect } from 'react'
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

interface ForgotPasswordResponse {
  success: boolean
  error?: string
  message?: string
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((data: unknown) => {
        const settingsData = data as SettingsResponse
        if (settingsData.success && settingsData.data?.settings) {
          setEmailEnabled(settingsData.data.settings.email_enabled === 'true')
        } else {
          setEmailEnabled(false)
        }
      })
      .catch(() => {
        setEmailEnabled(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json() as ForgotPasswordResponse

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || '发送失败')
      }
    } catch {
      setError('发送失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (emailEnabled === null) {
    return (
      <div className="py-12">
        <Container className="max-w-md">
          <Card>
            <CardContent className="py-12">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </div>
    )
  }

  if (!emailEnabled) {
    return (
      <div className="py-12">
        <Container className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">忘记密码</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                邮件服务未开启
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                请联系管理员重置密码
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Link href="/login" className="text-primary-600 hover:underline">
                返回登录
              </Link>
            </CardFooter>
          </Card>
        </Container>
      </div>
    )
  }

  if (success) {
    return (
      <div className="py-12">
        <Container className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">邮件已发送</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                如果该邮箱已注册，您将收到密码重置邮件。
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                请检查您的收件箱（包括垃圾邮件文件夹）
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Link href="/login" className="text-primary-600 hover:underline">
                返回登录
              </Link>
            </CardFooter>
          </Card>
        </Container>
      </div>
    )
  }

  return (
    <div className="py-12">
      <Container className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">忘记密码</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                  {error}
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                请输入您的注册邮箱，我们将发送密码重置链接到您的邮箱。
              </p>
              <Input
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入注册邮箱"
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '发送中...' : '发送重置邮件'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              想起密码了？{' '}
              <Link href="/login" className="text-primary-600 hover:underline">
                返回登录
              </Link>
            </p>
          </CardFooter>
        </Card>
      </Container>
    </div>
  )
}
