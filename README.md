# CF-blog （Cloudflare Blog）

基于 Cloudflare 全家桶构建的现代化博客系统

A modern, serverless blog system built entirely on Cloudflare's ecosystem

这是一个完全运行在 Cloudflare 生态上的开源博客程序，使用 Pages、Workers、D1 等服务实现，依托 Cloudflare 慷慨的免费额度即可稳定运行。
没有复杂环境、无需服务器、低成本、高可用、全球极速访问。
适合想零成本拥有独立博客，又不想折腾主机、运维的用户。

A clean, full-featured blog platform powered by Cloudflare Pages, Workers, and D1 Database. Runs completely free on Cloudflare's generous free tier, with global edge acceleration, zero server maintenance, and no hosting costs.

## 亮点
- 纯 Cloudflare 原生架构，免费额度就能跑满性能
- 全球边缘节点加速，访问速度快、稳定性强
- 无需数据库服务器、无需域名备案、无需运维
- 界面简洁，文章管理方便，适合长期使用

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
- Cloudflare KV (缓存)

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/gogcat/cf-blog.git
cd cf-blog
pnpm install
```

### 2. 本地开发

```bash
pnpm dev
```

访问 http://localhost:3000

### 3. 部署到 Cloudflare

**📖 详细部署指南请查看 [DEPLOY.md](DEPLOY.md)**

本项目必须使用本地 wrangler 部署，不支持 Cloudflare Dashboard 的 GitHub 集成。

**快速部署命令**：

```bash
# 构建项目
pnpm run build:workers

# 部署到 Cloudflare Workers
npx wrangler deploy
```

或者使用 npm script：

```bash
pnpm deploy
```

**⚠️ 重要**：首次部署前，请务必阅读 [DEPLOY.md](DEPLOY.md) 了解完整的配置和部署步骤。

## 默认管理员账号

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
└── wrangler.jsonc.example # Cloudflare Workers 配置示例
```

## 环境变量

参考 `.env.example` 配置必要的环境变量。

在 Cloudflare Dashboard 中设置环境变量（Settings > Variables）。

详细配置说明请查看 [DEPLOY.md](DEPLOY.md)。

## 联系

如有问题或建议，欢迎通过邮箱联系我们：i@lishiqi.cn

## License

MIT License - see [LICENSE](LICENSE) file for details.
