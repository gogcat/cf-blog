import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码长度至少8位').max(32, '密码长度不能超过32位'),
  name: z.string().min(2, '用户名长度至少2位').max(50, '用户名长度不能超过50位'),
})

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, '重置令牌无效'),
  password: z.string().min(8, '密码长度至少8位').max(32, '密码长度不能超过32位'),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, '用户名长度至少2位').max(50, '用户名长度不能超过50位').optional(),
  avatar_url: z.string().url('头像URL格式不正确').nullable().optional(),
})

export const createPostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题长度不能超过200位'),
  content: z.string().min(1, '内容不能为空'),
  excerpt: z.string().max(500, '摘要长度不能超过500位').optional(),
  cover_image: z.string().url('封面图片URL格式不正确').nullable().optional(),
  category_id: z.string().uuid('分类ID格式不正确').nullable().optional(),
  tag_ids: z.array(z.string().uuid('标签ID格式不正确')).optional(),
  status: z.enum(['draft', 'published'], { errorMap: () => ({ message: '状态值无效' }) }),
})

export const updatePostSchema = createPostSchema.partial()

export const createCommentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(2000, '评论内容不能超过2000位'),
  post_id: z.string().uuid('文章ID格式不正确'),
  parent_id: z.string().uuid('父评论ID格式不正确').nullable().optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称长度不能超过100位'),
  slug: z.string().min(1, 'Slug不能为空').max(100, 'Slug长度不能超过100位').regex(/^[a-z0-9-]+$/, 'Slug只能包含小写字母、数字和连字符'),
  description: z.string().max(500, '描述长度不能超过500位').optional(),
  sort_order: z.number().int('排序值必须是整数').optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

export const createTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称长度不能超过50位'),
  slug: z.string().min(1, 'Slug不能为空').max(100, 'Slug长度不能超过100位').regex(/^[a-z0-9-]+$/, 'Slug只能包含小写字母、数字和连字符'),
})

export const updateTagSchema = createTagSchema.partial()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
