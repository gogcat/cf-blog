export interface Env {
  DB: D1Database
  R2: R2Bucket
  JWT_SECRET: string
  RESEND_API_KEY: string
  SITE_URL: string
  SITE_NAME: string
}

export interface User {
  id: string
  email: string
  password_hash?: string
  name: string
  avatar_url: string | null
  role: 'user' | 'author' | 'admin'
  oauth_providers?: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image: string | null
  author_id: string
  category_id: string | null
  status: 'draft' | 'published' | 'archived'
  view_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface PostTag {
  post_id: string
  tag_id: string
}

export interface Comment {
  id: string
  content: string
  post_id: string
  user_id: string
  parent_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Session {
  id: string
  user_id: string
  refresh_token: string
  user_agent: string | null
  ip_address: string | null
  expires_at: string
  created_at: string
}

export interface PasswordReset {
  id: string
  email: string
  token: string
  expires_at: string
  created_at: string
}

export interface EmailVerification {
  id: string
  email: string
  token: string
  expires_at: string
  created_at: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface JWTPayload {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
}
