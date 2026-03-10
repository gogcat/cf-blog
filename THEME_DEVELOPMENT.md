# 主题开发指南

本指南将帮助你为 CF-blog 开发自定义主题。

## 主题系统概述

CF-blog 采用灵活的主题系统，允许你通过配置文件和自定义样式来定制博客的外观和感觉。主题系统支持：

- 自定义颜色方案
- 自定义字体
- 自定义 CSS 样式
- 组件级样式覆盖
- 主题预览和快速切换

## 主题文件结构

一个完整的主题包应该包含以下文件：

```
my-theme.zip
├── config.json       # 主题配置文件（必需）
├── theme.css         # 自定义样式文件（可选）
└── assets/          # 静态资源（可选）
    ├── logo.png
    └── background.jpg
```

## 主题配置文件 (config.json)

`config.json` 是主题的核心配置文件，定义了主题的基本信息和样式。

### 配置示例

```json
{
  "id": "my-custom-theme",
  "name": "我的自定义主题",
  "description": "一个简洁优雅的自定义主题",
  "author": "Your Name",
  "version": "1.0.0",
  "isDefault": false,
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#6b7280",
    "background": "#ffffff",
    "foreground": "#1f2937",
    "card": "#ffffff",
    "cardForeground": "#1f2937",
    "border": "#e5e7eb",
    "input": "#e5e7eb",
    "ring": "#3b82f6"
  },
  "fonts": {
    "body": "Inter, system-ui, sans-serif",
    "heading": "Inter, system-ui, sans-serif"
  }
}
```

### 配置字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 主题唯一标识符，只能包含小写字母、数字和连字符 |
| `name` | string | 是 | 主题显示名称 |
| `description` | string | 否 | 主题描述 |
| `author` | string | 是 | 主题作者 |
| `version` | string | 是 | 主题版本号（遵循语义化版本） |
| `isDefault` | boolean | 否 | 是否为内置主题（自定义主题设为 false） |
| `colors` | object | 是 | 颜色配置对象 |
| `fonts` | object | 否 | 字体配置对象 |

### 颜色配置

颜色配置使用 CSS 变量，系统会自动将配置的颜色应用到全局 CSS 变量中。

| 颜色变量 | 说明 | 示例 |
|----------|------|------|
| `primary` | 主色调，用于按钮、链接等主要元素 | `#3b82f6` |
| `secondary` | 次要色调 | `#6b7280` |
| `background` | 页面背景色 | `#ffffff` |
| `foreground` | 前景色（文本颜色） | `#1f2937` |
| `card` | 卡片背景色 | `#ffffff` |
| `cardForeground` | 卡片文本颜色 | `#1f2937` |
| `border` | 边框颜色 | `#e5e7eb` |
| `input` | 输入框背景色 | `#e5e7eb` |
| `ring` | 焦点环颜色 | `#3b82f6` |

### 字体配置

| 字段 | 说明 | 示例 |
|------|------|------|
| `body` | 正文字体 | `Inter, system-ui, sans-serif` |
| `heading` | 标题字体 | `Inter, system-ui, sans-serif` |

## 自定义样式 (theme.css)

你可以在 `theme.css` 中添加自定义 CSS 样式来进一步定制主题。

### 示例

```css
/* 自定义文章卡片样式 */
.post-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.post-card:hover {
  transform: translateY(-2px);
}

/* 自定义按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

/* 自定义导航栏 */
.navbar {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
}
```

### 可用的 CSS 变量

系统会自动注入以下 CSS 变量，你可以在 `theme.css` 中使用：

```css
/* 颜色变量 */
--theme-primary
--theme-secondary
--theme-background
--theme-foreground
--theme-card
--theme-card-foreground
--theme-border
--theme-input
--theme-ring

/* 字体变量 */
--font-body
--font-heading
```

使用示例：

```css
.my-element {
  color: var(--theme-primary);
  font-family: var(--font-body);
  border: 1px solid var(--theme-border);
}
```

## 打包主题

将主题文件打包成 ZIP 格式：

```bash
# 创建主题目录
mkdir my-theme
cd my-theme

# 创建配置文件
cat > config.json << EOF
{
  "id": "my-theme",
  "name": "我的主题",
  "description": "自定义主题",
  "author": "Your Name",
  "version": "1.0.0",
  "isDefault": false,
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#6b7280",
    "background": "#ffffff",
    "foreground": "#1f2937",
    "card": "#ffffff",
    "cardForeground": "#1f2937",
    "border": "#e5e7eb",
    "input": "#e5e7eb",
    "ring": "#3b82f6"
  },
  "fonts": {
    "body": "Inter, system-ui, sans-serif",
    "heading": "Inter, system-ui, sans-serif"
  }
}
EOF

# 返回上级目录并打包
cd ..
zip -r my-theme.zip my-theme
```

或者使用图形界面工具（如 macOS 的 Finder、Windows 的资源管理器）将主题文件夹压缩为 ZIP 文件。

## 上传主题

1. 登录后台管理系统
2. 进入 **主题管理** 页面
3. 点击 **选择主题包 (.zip)** 按钮
4. 选择你的主题 ZIP 文件
5. 等待上传完成
6. 在主题列表中找到你的主题
7. 点击 **使用此主题** 按钮激活

## 主题开发最佳实践

### 1. 颜色选择

- 使用对比度检查工具确保文本可读性
- 保持一致的色彩方案
- 考虑暗色模式支持（系统会自动处理）

### 2. 字体选择

- 优先使用系统字体以提升加载速度
- 确保字体在不同设备上都有良好表现
- 标题和正文字体可以不同

### 3. 性能优化

- 避免在 `theme.css` 中使用大量复杂的选择器
- 使用 CSS 变量而不是硬编码颜色值
- 压缩图片资源

### 4. 响应式设计

- 确保样式在不同屏幕尺寸下都能正常显示
- 使用相对单位（rem、em、%）而不是固定像素

### 5. 浏览器兼容性

- 避免使用实验性 CSS 特性
- 测试主流浏览器的兼容性

## 内置主题参考

系统提供了两个内置主题作为参考：

### 默认主题

- **ID**: `default`
- **风格**: 简约现代
- **特点**: 蓝色主色调，白色背景

### 暗色主题

- **ID**: `dark`
- **风格**: 暗黑模式
- **特点**: 深色背景，高对比度文本

你可以在 `src/themes/default/` 和 `src/themes/dark/` 目录下查看内置主题的配置。

## 主题调试

### 本地测试

1. 在本地开发环境中创建主题
2. 将主题配置添加到 `src/lib/store/theme.ts` 的 `availableThemes` 数组中
3. 重启开发服务器
4. 在主题管理页面测试主题

### 查看应用效果

主题激活后，系统会：
1. 将颜色配置应用到 CSS 变量
2. 加载 `theme.css` 文件
3. 应用自定义样式

你可以使用浏览器的开发者工具检查：
- CSS 变量是否正确应用
- 自定义样式是否加载
- 颜色是否符合预期

## 常见问题

### Q: 主题上传后没有显示？

A: 检查以下几点：
- ZIP 文件是否包含 `config.json`
- `config.json` 格式是否正确
- 主题 ID 是否与现有主题冲突

### Q: 自定义样式没有生效？

A: 确保：
- CSS 文件命名为 `theme.css`
- CSS 语法正确
- 选择器优先级足够高

### Q: 如何更新已上传的主题？

A: 目前系统不支持直接更新主题。你需要：
1. 上传新版本（使用不同的 ID 或版本号）
2. 激活新主题
3. 删除旧主题

### Q: 主题支持图片资源吗？

A: 支持。将图片放在 `assets/` 目录中，然后在 `theme.css` 中引用：

```css
.my-element {
  background-image: url('/themes/my-theme/assets/background.jpg');
}
```

## 获取帮助

如有主题开发相关的问题，欢迎：
- 查看内置主题的源代码
- 提交 Issue 到 GitHub
- 通过邮箱联系我们：i@lishiqi.cn

## 许可证

你开发的主题可以自由分发和使用。建议遵循 MIT License。
