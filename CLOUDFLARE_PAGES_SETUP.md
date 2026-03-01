# Cloudflare Pages 部署配置指南

## 数据库连接问题诊断

### 当前配置状态

✅ **wrangler.jsonc 配置正确**
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cf-db",
      "database_id": "46b7eee9-0dcb-4f88-9295-f9c807237238"
    }
  ]
}
```

✅ **代码中的环境变量获取正确**
- 优先检查 Cloudflare 上下文中的 DB 绑定
- 有详细的调试日志

### ⚠️ Cloudflare Pages 特殊配置要求

**Cloudflare Pages 与 Cloudflare Workers 不同：**

1. **Workers**: 使用 `wrangler.jsonc` 配置文件，D1 绑定会自动应用
2. **Pages**: D1 数据库绑定**必须在 Dashboard 中手动配置**，配置文件不会自动应用

## 🔧 必须在 Cloudflare Dashboard 中配置

### 步骤 1: 配置 D1 数据库绑定

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 选择 **cf-blog** 项目
4. 点击 **Settings** 标签
5. 滚动到 **Functions** 部分
6. 找到 **D1 database bindings** 配置项
7. 点击 **Add binding** 或 **Edit**
8. 配置如下：
   - **Variable name**: `DB`
   - **D1 database**: 选择 `cf-db` (ID: 46b7eee9-0dcb-4f88-9295-f9c807237238)
9. 点击 **Save**

### 步骤 2: 配置环境变量

在同一页面中，找到 **Environment variables** 部分，添加以下变量：

**必需的环境变量：**
- `JWT_SECRET` - 设置一个强随机字符串（例如：`your-super-secret-jwt-key-change-in-production`）
- `SITE_URL` - 您的网站地址（例如：`https://cf-blog.huoli.fun`）
- `SITE_NAME` - 网站名称（例如：`我的博客`）

**可选的环境变量：**
- `RESEND_API_KEY` - 如果使用邮件功能，添加 Resend API 密钥

### 步骤 3: 应用数据库迁移

配置完成后，需要运行数据库迁移以创建表结构：

#### 方法 A: 使用 Cloudflare Dashboard（推荐）

1. 进入 **Workers & Pages** → **D1**
2. 选择 `cf-db` 数据库
3. 点击 **Console** 标签
4. 复制以下 SQL 并粘贴到控制台执行：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  oauth_providers TEXT DEFAULT '{}',
  email_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 密码重置表
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 邮箱验证表
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 文章表
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  author_id TEXT NOT NULL,
  category_id TEXT,
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  parent_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 网站设置表
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  site_title TEXT,
  site_subtitle TEXT,
  site_description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 插入默认管理员用户
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, created_at, updated_at)
VALUES (
  'admin-001',
  'admin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAcWpQpQ7eR3u8q$Y8sB2$5$X0.3$1.2$3.4$5.6$7.7$8.9$0.1$1.2$3.4$5.6$7.8$9.0.1$2.3$4.5$6.7$8.9',
  '管理员',
  'admin',
  datetime('now'),
  datetime('now')
);

-- 插入默认网站设置
INSERT OR IGNORE INTO site_settings (id, site_title, site_subtitle, site_description, created_at, updated_at)
VALUES (
  'default',
  '我的博客',
  '分享技术，记录生活',
  '一个使用 Next.js 和 Cloudflare Pages 构建的博客系统',
  datetime('now'),
  datetime('now')
);
```

#### 方法 B: 使用 wrangler CLI

```bash
# 在项目目录下运行
cd /Users/ls/Documents/trae_projects/blog

# 应用数据库迁移到生产环境
npx wrangler d1 execute cf-db --remote --file=migrations/001_initial_schema.sql
```

### 步骤 4: 验证配置

配置完成后：

1. **查看部署日志**
   - 进入 Cloudflare Dashboard → Workers & Pages → cf-blog
   - 点击 **Logs** 标签
   - 查看实时日志，应该能看到：
     ```
     === GETENV DEBUG ===
     NODE_ENV: production
     isLocal: false
     Cloudflare context exists: true
     Cloudflare env exists: true
     Using Cloudflare environment
     DB binding: true
     JWT_SECRET exists: true
     ```

2. **测试健康检查端点**
   - 访问：`https://cf-blog.huoli.fun/api/health`
   - 应该返回类似：
     ```json
     {
       "success": true,
       "message": "Server is healthy",
       "userCount": 1,
       "timestamp": "2026-03-01T...",
       "envSource": "cloudflare context"
     }
     ```

3. **测试登录**
   - 访问：`https://cf-blog.huoli.fun/login`
   - 使用默认管理员账号：
     - 邮箱：`admin@example.com`
     - 密码：`admin123`

## 🔧 常见问题排查

### 问题 1: 日志显示 "Using process.env fallback"

**原因**: Cloudflare 上下文未正确初始化

**解决**: 
- 确保 Cloudflare Pages 项目已正确配置
- 重新部署项目

### 问题 2: 日志显示 "DB binding: false"

**原因**: D1 数据库绑定未在 Dashboard 中配置

**解决**: 按照步骤 1 配置 D1 数据库绑定

### 问题 3: 日志显示 "JWT_SECRET exists: false"

**原因**: JWT_SECRET 环境变量未设置

**解决**: 按照步骤 2 添加 JWT_SECRET 环境变量

### 问题 4: 500 错误持续存在

**原因**: 数据库表未创建

**解决**: 按照步骤 3 应用数据库迁移

## 📋 配置检查清单

在完成上述步骤后，请确认：

- [ ] D1 数据库绑定已配置（Variable name: DB）
- [ ] JWT_SECRET 环境变量已设置
- [ ] SITE_URL 环境变量已设置
- [ ] SITE_NAME 环境变量已设置
- [ ] 数据库迁移已执行
- [ ] 部署日志显示 "Using Cloudflare environment"
- [ ] 部署日志显示 "DB binding: true"
- [ ] 部署日志显示 "JWT_SECRET exists: true"
- [ ] /api/health 端点返回成功响应
- [ ] 可以使用默认管理员账号登录
