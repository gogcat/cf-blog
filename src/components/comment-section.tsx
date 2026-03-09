'use client'

import { useState, useCallback } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Turnstile from '@/components/turnstile'

interface User {
  id: string
  name: string
  avatar_url: string | null
}

interface Comment {
  id: string
  content: string
  post_id: string
  user_id: string | null
  parent_id: string | null
  status: string
  created_at: string
  author?: { id: string; name: string; avatar_url: string | null } | null
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
  initialComments: Comment[]
  currentUser: User | null
  turnstileSiteKey?: string
}

function formatCommentDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 30) return `${diffDays} 天前`
  const formattedDate = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  return formattedDate
}

function CommentItem({ 
  comment, 
  postId, 
  currentUser, 
  onReplySuccess,
  depth = 0 
}: { 
  comment: Comment
  postId: string
  currentUser: User | null
  onReplySuccess: () => void
  depth?: number
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [replyName, setReplyName] = useState('')
  const [replyEmail, setReplyEmail] = useState('')

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) {
      setError('请输入回复内容')
      return
    }

    const isGuest = !currentUser
    if (isGuest) {
      if (!replyName.trim()) {
        setError('请输入昵称')
        return
      }
      if (!replyEmail.trim()) {
        setError('请输入邮箱')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(replyEmail)) {
        setError('请输入有效的邮箱地址')
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch(`/api/comments/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          content: replyContent,
          parent_id: comment.id,
          ...(isGuest ? { name: replyName, email: replyEmail } : {})
        })
      })

      const data = await res.json() as { success: boolean; error?: string }

      if (data.success) {
        setReplyContent('')
        setReplyName('')
        setReplyEmail('')
        setShowReplyForm(false)
        onReplySuccess()
      } else {
        setError(data.error || '回复失败')
      }
    } catch {
      setError('回复失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar
          src={comment.author?.avatar_url || ''}
          name={comment.author?.name || ''}
          size={36}
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{comment.author?.name || ''}</span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">{formatCommentDate(comment.created_at)}</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{comment.content}</p>
          
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-gray-500 dark:text-gray-400 text-xs hover:text-primary-600 mt-2"
          >
            回复
          </button>

          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              {!currentUser && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={replyName}
                    onChange={(e) => setReplyName(e.target.value)}
                    placeholder="昵称 *"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-xs"
                    required
                  />
                  <input
                    type="email"
                    value={replyEmail}
                    onChange={(e) => setReplyEmail(e.target.value)}
                    placeholder="邮箱 *"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-xs"
                    required
                  />
                </div>
              )}
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`回复 @${comment.author?.name || ''}...`}
                className="min-h-[80px] text-sm mb-2"
              />
              {error && (
                <p className="text-red-500 text-xs mb-2">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? '提交中...' : '回复'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false)
                    setReplyContent('')
                    setError('')
                  }}
                >
                  取消
                </Button>
              </div>
            </form>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUser={currentUser}
                  onReplySuccess={onReplySuccess}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommentSection({ postId, initialComments, currentUser, turnstileSiteKey }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) {
      setCommentError('请输入评论内容')
      return
    }
    if (!postId) return

    setSubmitting(true)
    setCommentError('')

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch(`/api/comments/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: commentContent })
      })

      const data = await res.json() as { success: boolean; error?: string }

      if (data.success) {
        setCommentContent('')
        const res = await fetch(`/api/comments/posts/${postId}`)
        const newData = await res.json() as { success: boolean; data: { comments: Comment[] } }
        if (newData.success) {
          setComments(newData.data.comments || [])
        }
      } else {
        setCommentError(data.error || '发表评论失败')
      }
    } catch {
      setCommentError('发表评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGuestCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) {
      setCommentError('请输入评论内容')
      return
    }
    if (!guestName.trim()) {
      setCommentError('请输入昵称')
      return
    }
    if (!guestEmail.trim()) {
      setCommentError('请输入邮箱')
      return
    }
    if (!postId) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestEmail)) {
      setCommentError('请输入有效的邮箱地址')
      return
    }

    if (turnstileSiteKey) {
      setTurnstileToken('')
      setShowVerifyDialog(true)
      return
    }

    await submitGuestComment()
  }

  const submitGuestComment = async (token?: string) => {
    setSubmitting(true)
    const finalToken = token || turnstileToken

    try {
      const res = await fetch(`/api/comments/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: commentContent,
          name: guestName,
          email: guestEmail,
          'cf-turnstile-response': finalToken
        })
      })

      const data = await res.json() as { success: boolean; error?: string }

      if (data.success) {
        setCommentContent('')
        setGuestName('')
        setGuestEmail('')
        setTurnstileToken('')
        setShowVerifyDialog(false)
        const res = await fetch(`/api/comments/posts/${postId}`)
        const newData = await res.json() as { success: boolean; data: { comments: Comment[] } }
        if (newData.success) {
          setComments(newData.data.comments || [])
        }
      } else {
        setCommentError(data.error || '发表评论失败')
        if (data.error?.includes('验证')) {
          setTurnstileToken('')
        }
      }
    } catch {
      setCommentError('发表评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 mb-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        评论
      </h3>

      {currentUser ? (
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <div className="flex items-start gap-4">
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.name || 'User'}
              size={40}
            />
            <div className="flex-1">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="写下你的评论..."
                className="min-h-[100px] mb-3"
              />
              {commentError && (
                <p className="text-red-500 text-sm mb-2">{commentError}</p>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? '提交中...' : '发表评论'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleGuestCommentSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">发表评论</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="昵称 *"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="邮箱 * (用于生成头像)"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm"
                required
              />
            </div>
          </div>
          <Textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="写下你的评论..."
            className="min-h-[100px] mb-3"
            required
          />
          {commentError && (
            <p className="text-red-500 text-sm mb-2">{commentError}</p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? '提交中...' : '发表评论'}
          </Button>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">发表评论即表示同意展示您的头像</p>
        </form>
      )}

      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent onClose={() => setShowVerifyDialog(false)}>
          <div className="text-center">
            <h3 className="text-lg font-medium mb-4">人机验证</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">请完成下方验证后提交评论</p>
            {turnstileSiteKey && (
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setShowVerifyDialog(false)
                  submitGuestComment(token)
                }}
                onError={() => setTurnstileToken('')}
                trigger={showVerifyDialog}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUser={currentUser}
              onReplySuccess={() => {
                const res = fetch(`/api/comments/posts/${postId}`)
                res.then(r => r.json()).then(data => {
                  if ((data as { success: boolean; data: { comments: Comment[] } }).success) {
                    setComments((data as { success: boolean; data: { comments: Comment[] } }).data.comments || [])
                  }
                })
              }}
            />
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">暂无评论，快来抢沙发吧！</p>
        )}
      </div>
    </div>
  )
}
