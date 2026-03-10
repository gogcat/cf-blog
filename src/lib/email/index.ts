import type { Env } from '@/types'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(env: Env, options: EmailOptions): Promise<boolean> {
  let apiKey = env.RESEND_API_KEY
  
  if (!apiKey) {
    const resendApiKeySetting = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('resend_api_key')
      .first<{ value: string }>()
    
    if (resendApiKeySetting?.value) {
      apiKey = resendApiKeySetting.value
    }
  }
  
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, email not sent')
    return false
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${env.SITE_NAME} <noreply@${new URL(env.SITE_URL).hostname}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    })
    
    return response.ok
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function getVerificationEmailHtml(
  siteName: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>验证您的邮箱</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f9f9f9; border-radius: 10px; padding: 30px; margin-top: 20px;">
        <h1 style="color: #0ea5e9; margin-top: 0;">验证您的邮箱地址</h1>
        <p>您好！</p>
        <p>感谢您注册 ${siteName}。请点击下方按钮验证您的邮箱地址：</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">验证邮箱</a>
        </p>
        <p style="color: #666; font-size: 14px;">或者复制以下链接到浏览器：<br><a href="${verificationUrl}" style="word-break: break-all; color: #0ea5e9;">${verificationUrl}</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">此链接将在 24 小时后失效。如果您没有注册账号，请忽略此邮件。</p>
      </div>
    </body>
    </html>
  `
}

export function getPasswordResetEmailHtml(
  siteName: string,
  resetUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>重置您的密码</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f9f9f9; border-radius: 10px; padding: 30px; margin-top: 20px;">
        <h1 style="color: #0ea5e9; margin-top: 0;">重置您的密码</h1>
        <p>您好！</p>
        <p>我们收到了重置您 ${siteName} 账号密码的请求。请点击下方按钮设置新密码：</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">重置密码</a>
        </p>
        <p style="color: #666; font-size: 14px;">或者复制以下链接到浏览器：<br><a href="${resetUrl}" style="word-break: break-all; color: #0ea5e9;">${resetUrl}</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">此链接将在 1 小时后失效。如果您没有请求重置密码，请忽略此邮件。</p>
      </div>
    </body>
    </html>
  `
}

export function getEmailChangeVerificationHtml(
  siteName: string,
  oldEmail: string,
  newEmail: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>确认邮箱变更</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f9f9f9; border-radius: 10px; padding: 30px; margin-top: 20px;">
        <h1 style="color: #0ea5e9; margin-top: 0;">确认邮箱变更</h1>
        <p>您好！</p>
        <p>您在 ${siteName} 请求将账号邮箱从 <strong>${oldEmail}</strong> 变更为 <strong>${newEmail}</strong>。</p>
        <p>请点击下方按钮确认此变更：</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">确认邮箱变更</a>
        </p>
        <p style="color: #666; font-size: 14px;">或者复制以下链接到浏览器：<br><a href="${verificationUrl}" style="word-break: break-all; color: #0ea5e9;">${verificationUrl}</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">此链接将在 1 小时后失效。如果您没有请求变更邮箱，请忽略此邮件。</p>
      </div>
    </body>
    </html>
  `
}

export function getPasswordChangeConfirmationHtml(
  siteName: string,
  confirmationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>确认密码修改</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f9f9f9; border-radius: 10px; padding: 30px; margin-top: 20px;">
        <h1 style="color: #0ea5e9; margin-top: 0;">确认密码修改</h1>
        <p>您好！</p>
        <p>您在 ${siteName} 请求修改账号密码。请点击下方按钮确认此操作：</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">确认密码修改</a>
        </p>
        <p style="color: #666; font-size: 14px;">或者复制以下链接到浏览器：<br><a href="${confirmationUrl}" style="word-break: break-all; color: #0ea5e9;">${confirmationUrl}</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">此链接将在 1 小时后失效。如果您没有请求修改密码，请忽略此邮件。</p>
      </div>
    </body>
    </html>
  `
}

export function getPostModerationNotificationHtml(
  siteName: string,
  postTitle: string,
  status: 'approved' | 'rejected',
  reason?: string
): string {
  const statusText = status === 'approved' ? '审核通过' : '审核拒绝'
  const statusColor = status === 'approved' ? '#22c55e' : '#ef4444'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>文章审核通知</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f9f9f9; border-radius: 10px; padding: 30px; margin-top: 20px;">
        <h1 style="color: ${statusColor}; margin-top: 0;">文章${statusText}</h1>
        <p>您好！</p>
        <p>您在 ${siteName} 提交的文章 <strong>《${postTitle}》</strong> 已被${statusText}。</p>
        ${reason ? `<p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;"><strong>原因：</strong>${reason}</p>` : ''}
        ${status === 'approved' ? '<p style="color: #22c55e; font-weight: bold;">您的文章现已发布，可以在网站上查看。</p>' : '<p style="color: #ef4444;">请根据拒绝原因修改文章后重新提交审核。</p>'}
      </div>
    </body>
    </html>
  `
}
