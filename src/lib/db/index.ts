import type { Env, User, Post, Category, Tag, Comment, Session, PasswordReset, EmailVerification } from '@/types'

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').bind(id).first<User>()
  return result
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL').bind(email).first<User>()
  return result
}

export async function createUser(db: D1Database, user: Omit<User, 'created_at' | 'updated_at' | 'email_verified_at' | 'avatar_url'> & { password_hash: string }): Promise<User> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, oauth_providers, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    user.id,
    user.email,
    user.password_hash,
    user.name,
    user.role || 'user',
    user.oauth_providers || '{}',
    now,
    now
  ).first<User>()
  
  if (!result) {
    throw new Error('Failed to create user')
  }
  return result
}

export async function updateUser(db: D1Database, id: string, data: Partial<Pick<User, 'name' | 'avatar_url' | 'role' | 'email_verified_at'>>): Promise<User | null> {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.avatar_url !== undefined) {
    fields.push('avatar_url = ?')
    values.push(data.avatar_url)
  }
  if (data.role !== undefined) {
    fields.push('role = ?')
    values.push(data.role)
  }
  if (data.email_verified_at !== undefined) {
    fields.push('email_verified_at = ?')
    values.push(data.email_verified_at)
  }
  
  if (fields.length === 0) return getUserById(db, id)
  
  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  
  const result = await db.prepare(`
    UPDATE users SET ${fields.join(', ')} WHERE id = ?
    RETURNING *
  `).bind(...values).first<User>()
  
  return result
}

export async function createSession(db: D1Database, session: Omit<Session, 'created_at'>): Promise<Session> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    session.id,
    session.user_id,
    session.refresh_token,
    session.user_agent || null,
    session.ip_address || null,
    session.expires_at,
    now
  ).first<Session>()
  
  if (!result) {
    throw new Error('Failed to create session')
  }
  return result
}

export async function getSessionByToken(db: D1Database, token: string): Promise<Session | null> {
  const result = await db.prepare('SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > ?')
    .bind(token, new Date().toISOString())
    .first<Session>()
  return result
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE refresh_token = ?').bind(token).run()
}

export async function deleteUserSessions(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()
}

export async function createPasswordReset(db: D1Database, reset: Omit<PasswordReset, 'created_at'>): Promise<PasswordReset> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO password_resets (id, email, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `).bind(reset.id, reset.email, reset.token, reset.expires_at, now).first<PasswordReset>()
  
  if (!result) {
    throw new Error('Failed to create password reset')
  }
  return result
}

export async function getPasswordResetByToken(db: D1Database, token: string): Promise<PasswordReset | null> {
  const result = await db.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?')
    .bind(token, new Date().toISOString())
    .first<PasswordReset>()
  return result
}

export async function deletePasswordReset(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run()
}

export async function createEmailVerification(db: D1Database, verification: Omit<EmailVerification, 'created_at'>): Promise<EmailVerification> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO email_verifications (id, email, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `).bind(verification.id, verification.email, verification.token, verification.expires_at, now).first<EmailVerification>()
  
  if (!result) {
    throw new Error('Failed to create email verification')
  }
  return result
}

export async function getEmailVerificationByToken(db: D1Database, token: string): Promise<EmailVerification | null> {
  const result = await db.prepare('SELECT * FROM email_verifications WHERE token = ? AND expires_at > ?')
    .bind(token, new Date().toISOString())
    .first<EmailVerification>()
  return result
}

export async function deleteEmailVerification(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM email_verifications WHERE token = ?').bind(token).run()
}

export async function updateUserPassword(db: D1Database, userId: string, passwordHash: string): Promise<void> {
  const now = new Date().toISOString()
  await db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .bind(passwordHash, now, userId)
    .run()
}

export async function getCategories(db: D1Database): Promise<Category[]> {
  const result = await db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, created_at DESC').all<Category>()
  return result.results
}

export async function getCategoryById(db: D1Database, id: string): Promise<Category | null> {
  const result = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first<Category>()
  return result
}

export async function getCategoryBySlug(db: D1Database, slug: string): Promise<Category | null> {
  const result = await db.prepare('SELECT * FROM categories WHERE slug = ?').bind(slug).first<Category>()
  return result
}

export async function createCategory(db: D1Database, category: Omit<Category, 'created_at' | 'updated_at'>): Promise<Category> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO categories (id, name, slug, description, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(category.id, category.name, category.slug, category.description || null, category.sort_order || 0, now, now).first<Category>()
  
  if (!result) {
    throw new Error('Failed to create category')
  }
  return result
}

export async function updateCategory(db: D1Database, id: string, data: Partial<Pick<Category, 'name' | 'slug' | 'description' | 'sort_order'>>): Promise<Category | null> {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?')
    values.push(data.slug)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.sort_order !== undefined) {
    fields.push('sort_order = ?')
    values.push(data.sort_order)
  }
  
  if (fields.length === 0) return getCategoryById(db, id)
  
  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  
  const result = await db.prepare(`
    UPDATE categories SET ${fields.join(', ')} WHERE id = ?
    RETURNING *
  `).bind(...values).first<Category>()
  
  return result
}

export async function deleteCategory(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE posts SET category_id = NULL WHERE category_id = ?').bind(id).run()
  await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
}

export async function getTags(db: D1Database): Promise<Tag[]> {
  const result = await db.prepare('SELECT * FROM tags ORDER BY created_at DESC').all<Tag>()
  return result.results
}

export async function getTagById(db: D1Database, id: string): Promise<Tag | null> {
  const result = await db.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first<Tag>()
  return result
}

export async function getTagBySlug(db: D1Database, slug: string): Promise<Tag | null> {
  const result = await db.prepare('SELECT * FROM tags WHERE slug = ?').bind(slug).first<Tag>()
  return result
}

export async function createTag(db: D1Database, tag: Omit<Tag, 'created_at' | 'updated_at'>): Promise<Tag> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO tags (id, name, slug, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `).bind(tag.id, tag.name, tag.slug, now, now).first<Tag>()
  
  if (!result) {
    throw new Error('Failed to create tag')
  }
  return result
}

export async function updateTag(db: D1Database, id: string, data: Partial<Pick<Tag, 'name' | 'slug'>>): Promise<Tag | null> {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?')
    values.push(data.slug)
  }
  
  if (fields.length === 0) return getTagById(db, id)
  
  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  
  const result = await db.prepare(`
    UPDATE tags SET ${fields.join(', ')} WHERE id = ?
    RETURNING *
  `).bind(...values).first<Tag>()
  
  return result
}

export async function deleteTag(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM post_tags WHERE tag_id = ?').bind(id).run()
  await db.prepare('DELETE FROM tags WHERE id = ?').bind(id).run()
}

export async function getPosts(db: D1Database, options: {
  page?: number
  limit?: number
  status?: string
  authorId?: string
  categoryId?: string
}): Promise<{ posts: Post[]; total: number }> {
  const page = options.page || 1
  const limit = options.limit || 10
  const offset = (page - 1) * limit
  
  let whereClause = 'WHERE deleted_at IS NULL'
  const params: unknown[] = []
  
  if (options.status) {
    whereClause += ' AND status = ?'
    params.push(options.status)
  }
  if (options.authorId) {
    whereClause += ' AND author_id = ?'
    params.push(options.authorId)
  }
  if (options.categoryId) {
    whereClause += ' AND category_id = ?'
    params.push(options.categoryId)
  }
  
  const countResult = await db.prepare(`SELECT COUNT(*) as count FROM posts ${whereClause}`).bind(...params).first<{ count: number }>()
  const total = countResult?.count || 0
  
  const result = await db.prepare(`
    SELECT * FROM posts ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all<Post>()
  
  return { posts: result.results, total }
}

export async function getPostById(db: D1Database, id: string): Promise<Post | null> {
  const result = await db.prepare('SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL').bind(id).first<Post>()
  return result
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<Post | null> {
  const result = await db.prepare('SELECT * FROM posts WHERE slug = ? AND deleted_at IS NULL').bind(slug).first<Post>()
  return result
}

export async function createPost(db: D1Database, post: Omit<Post, 'created_at' | 'updated_at' | 'view_count' | 'deleted_at'>): Promise<Post> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO posts (id, title, slug, content, excerpt, cover_image, author_id, category_id, status, view_count, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    RETURNING *
  `).bind(
    post.id,
    post.title,
    post.slug,
    post.content,
    post.excerpt || null,
    post.cover_image || null,
    post.author_id,
    post.category_id || null,
    post.status,
    post.published_at || null,
    now,
    now
  ).first<Post>()
  
  if (!result) {
    throw new Error('Failed to create post')
  }
  return result
}

export async function updatePost(db: D1Database, id: string, data: Partial<Pick<Post, 'title' | 'slug' | 'content' | 'excerpt' | 'cover_image' | 'category_id' | 'status' | 'published_at'>>): Promise<Post | null> {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (data.title !== undefined) {
    fields.push('title = ?')
    values.push(data.title)
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?')
    values.push(data.slug)
  }
  if (data.content !== undefined) {
    fields.push('content = ?')
    values.push(data.content)
  }
  if (data.excerpt !== undefined) {
    fields.push('excerpt = ?')
    values.push(data.excerpt)
  }
  if (data.cover_image !== undefined) {
    fields.push('cover_image = ?')
    values.push(data.cover_image)
  }
  if (data.category_id !== undefined) {
    fields.push('category_id = ?')
    values.push(data.category_id)
  }
  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }
  if (data.published_at !== undefined) {
    fields.push('published_at = ?')
    values.push(data.published_at)
  }
  
  if (fields.length === 0) return getPostById(db, id)
  
  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  
  const result = await db.prepare(`
    UPDATE posts SET ${fields.join(', ')} WHERE id = ?
    RETURNING *
  `).bind(...values).first<Post>()
  
  return result
}

export async function deletePost(db: D1Database, id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.prepare('UPDATE posts SET deleted_at = ? WHERE id = ?').bind(now, id).run()
}

export async function incrementPostViewCount(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').bind(id).run()
}

export async function getPostTags(db: D1Database, postId: string): Promise<Tag[]> {
  const result = await db.prepare(`
    SELECT t.* FROM tags t
    JOIN post_tags pt ON t.id = pt.tag_id
    WHERE pt.post_id = ?
  `).bind(postId).all<Tag>()
  return result.results
}

export async function setPostTags(db: D1Database, postId: string, tagIds: string[]): Promise<void> {
  await db.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(postId).run()
  
  for (const tagId of tagIds) {
    await db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)').bind(postId, tagId).run()
  }
}

export async function getComments(db: D1Database, options: {
  postId?: string
  userId?: string
  status?: string
  page?: number
  limit?: number
}): Promise<{ comments: Comment[]; total: number }> {
  const page = options.page || 1
  const limit = options.limit || 20
  const offset = (page - 1) * limit
  
  let whereClause = 'WHERE deleted_at IS NULL'
  const params: unknown[] = []
  
  if (options.postId) {
    whereClause += ' AND post_id = ?'
    params.push(options.postId)
  }
  if (options.userId) {
    whereClause += ' AND user_id = ?'
    params.push(options.userId)
  }
  if (options.status) {
    whereClause += ' AND status = ?'
    params.push(options.status)
  }
  
  const countResult = await db.prepare(`SELECT COUNT(*) as count FROM comments ${whereClause}`).bind(...params).first<{ count: number }>()
  const total = countResult?.count || 0
  
  const result = await db.prepare(`
    SELECT * FROM comments ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all<Comment>()
  
  return { comments: result.results, total }
}

export async function getCommentById(db: D1Database, id: string): Promise<Comment | null> {
  const result = await db.prepare('SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL').bind(id).first<Comment>()
  return result
}

export async function createComment(db: D1Database, comment: Omit<Comment, 'created_at' | 'updated_at' | 'deleted_at' | 'status'>): Promise<Comment> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    INSERT INTO comments (id, content, post_id, user_id, parent_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    RETURNING *
  `).bind(
    comment.id,
    comment.content,
    comment.post_id,
    comment.user_id,
    comment.parent_id || null,
    now,
    now
  ).first<Comment>()
  
  if (!result) {
    throw new Error('Failed to create comment')
  }
  return result
}

export async function updateCommentStatus(db: D1Database, id: string, status: 'pending' | 'approved' | 'rejected'): Promise<Comment | null> {
  const now = new Date().toISOString()
  const result = await db.prepare(`
    UPDATE comments SET status = ?, updated_at = ? WHERE id = ?
    RETURNING *
  `).bind(status, now, id).first<Comment>()
  
  return result
}

export async function deleteComment(db: D1Database, id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.prepare('UPDATE comments SET deleted_at = ? WHERE id = ?').bind(now, id).run()
}

export async function getStats(db: D1Database): Promise<{
  totalPosts: number
  totalUsers: number
  totalComments: number
  publishedPosts: number
}> {
  const [postsResult, usersResult, commentsResult, publishedResult] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM posts WHERE status = ? AND deleted_at IS NULL').bind('published').first<{ count: number }>(),
  ])
  
  return {
    totalPosts: postsResult?.count || 0,
    totalUsers: usersResult?.count || 0,
    totalComments: commentsResult?.count || 0,
    publishedPosts: publishedResult?.count || 0,
  }
}
