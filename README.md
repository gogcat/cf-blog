# CF-blog

基于 Next.js 15 + Cloudflare Workers/D1/R2 搭建的博客系统。

## 功能特性

- **文章管理** - Markdown 文章发布、编辑、分类、标签
- **评论系统** - 访客评论、回复、审核机制
- **用户系统** - 注册登录、角色权限（用户/作者/管理员）
- **后台管理** - 文章、评论、用户、分类、标签、系统设置
- **图片存储** - Cloudflare R2 对象存储
- **响应式设计** - 移动端适配

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Cloudflare Workers (通过 OpenNext)
- Cloudflare D1 (SQLite)
- Cloudflare R2

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/gogcat/cf-blog.git
cd cf-blog
pnpm install
```

### 2. 配置 Cloudflare

```bash
# 登录
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create blog-db

# 创建 R2 存储储桶
npx wrangler r2 bucket create blog-assets

# 创建 KV 命名空间（用于缓存）
npx wrangler kv:namespace create CACHE
```

### 3. 更新配置

编辑 `wrangler.jsonc`，替换相关 ID：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "blog-db",
      "database_id": "your-database-id"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

### 4. 初始化数据库

```bash
# 本地
npx wrangler d1 execute blog-db --local --file=migrations/001_initial_schema.sql

# 生产环境
npx wrangler d1 execute blog-db --remote --file=migrations/001_initial_schema.sql
```

### 5. 本地开发

```bash
pnpm dev
```

访问 http://localhost:3000

### 6. 部署

```bash
# 构建并部署
npx @opennextjs/cloudflare build
npx @opennextjs/cloudflare deploy
```

或者使用 npm script：

```bash
pnpm deploy
```

## 默认管理员

| 邮箱 | 密码 |
|------|------|
| admin@example.com | admin123 |

> 部署后请及时修改密码！

## 项目结构

```
├── migrations/          # 数据库迁移
├── public/             # 静态资源
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── (admin)/    # 后台管理
│   │   ├── (frontend)/ # 前台页面
│   │   └── api/        # API 路由
│   ├── components/     # 组件
│   └── lib/           # 工具函数
├── open-next.config.ts # OpenNext 配置
└── wrangler.jsonc      # Cloudflare Workers 配置
```

## 环境变量

参考 `.env.example` 配置必要的环境变量。

在 Cloudflare Dashboard 中设置环境变量（Settings > Variables）。

## 联系

如有问题或建议，欢迎通过邮箱联系我们：i@lishiqi.cn

## License

MIT License - see [LICENSE](LICENSE) file for details.
