'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState('')

  interface RegisterResponse {
    success: boolean
    error?: string
    code?: string
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
        const errorMsg = data.details 
          ? Object.values(data.details).flat()[0] || data.error 
          : data.error || '注册失败'
        setErrorDialogMessage(errorMsg || '注册失败')
        setShowErrorDialog(true)
      }
    } catch {
      setErrorDialogMessage('注册失败，请稍后重试')
      setShowErrorDialog(true)
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
        
        {/* 错误提示 Dialog */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent onClose={() => setShowErrorDialog(false)}>
            <DialogHeader>
              <DialogTitle>注册失败</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-400">{errorDialogMessage}</p>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowErrorDialog(false)}>知道了</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </div>
  )
}
