# PocketBase.cn SEO & Content Strategy

> **Mission**: 成为国内 PocketBase 搜索第一站
> **Version**: 1.0.0
> **Last Updated**: 2025-12-30

---

## Table of Contents

1. [Keyword Strategy](#1-keyword-strategy)
2. [Content Architecture](#2-content-architecture)
3. [Technical SEO](#3-technical-seo)
4. [Content Plan](#4-content-plan)
5. [Page-level SEO](#5-page-level-seo)
6. [Performance SEO](#6-performance-seo)
7. [Growth Hacking](#7-growth-hacking)

---

## 1. Keyword Strategy

### 1.1 Core Keywords (核心关键词)

| Keyword             | Search Volume (Est.) | Difficulty | Priority |
| ------------------- | -------------------- | ---------- | -------- |
| PocketBase 中文文档 | 800/mo               | Low        | P0       |
| PocketBase 教程     | 600/mo               | Low        | P0       |
| PocketBase 部署     | 400/mo               | Low        | P0       |
| PocketBase 中文     | 1200/mo              | Medium     | P0       |
| PocketBase 入门     | 300/mo               | Low        | P1       |
| PocketBase API      | 200/mo               | Medium     | P1       |
| PocketBase 下载     | 500/mo               | Low        | P1       |
| PocketBase 官网     | 400/mo               | Medium     | P2       |

### 1.2 Long-tail Keywords (长尾关键词)

#### 部署相关 (Deployment)

| Keyword                 | Intent        | Target Page                |
| ----------------------- | ------------- | -------------------------- |
| PocketBase 宝塔面板部署 | Transactional | /docs/deploy/bt-panel      |
| PocketBase 阿里云部署   | Transactional | /docs/deploy/aliyun        |
| PocketBase 腾讯云部署   | Transactional | /docs/deploy/tencent       |
| PocketBase Docker 部署  | Transactional | /docs/deploy/docker        |
| PocketBase Nginx 配置   | Transactional | /docs/deploy/nginx         |
| PocketBase HTTPS 配置   | Transactional | /docs/deploy/https         |
| PocketBase 反向代理     | Transactional | /docs/deploy/reverse-proxy |
| PocketBase 生产环境部署 | Transactional | /docs/deploy/production    |

#### 集成相关 (Integration)

| Keyword                   | Intent        | Target Page                  |
| ------------------------- | ------------- | ---------------------------- |
| PocketBase UniApp 集成    | Transactional | /docs/sdk/uniapp             |
| PocketBase Vue 集成       | Transactional | /docs/sdk/vue                |
| PocketBase React 集成     | Transactional | /docs/sdk/react              |
| PocketBase 微信小程序     | Transactional | /docs/sdk/wechat-miniprogram |
| PocketBase Flutter 集成   | Transactional | /docs/sdk/flutter            |
| PocketBase JavaScript SDK | Informational | /docs/sdk/javascript         |

#### 存储相关 (Storage)

| Keyword               | Intent        | Target Page               |
| --------------------- | ------------- | ------------------------- |
| PocketBase 阿里云 OSS | Transactional | /docs/storage/aliyun-oss  |
| PocketBase 腾讯云 COS | Transactional | /docs/storage/tencent-cos |
| PocketBase S3 存储    | Transactional | /docs/storage/s3          |
| PocketBase 文件上传   | Informational | /docs/files/upload        |
| PocketBase 图片处理   | Informational | /docs/files/images        |

#### 功能相关 (Features)

| Keyword               | Intent        | Target Page       |
| --------------------- | ------------- | ----------------- |
| PocketBase 实时订阅   | Informational | /docs/realtime    |
| PocketBase 用户认证   | Informational | /docs/auth        |
| PocketBase OAuth 登录 | Transactional | /docs/auth/oauth  |
| PocketBase 微信登录   | Transactional | /docs/auth/wechat |
| PocketBase API Rules  | Informational | /docs/api-rules   |
| PocketBase 数据校验   | Informational | /docs/validation  |
| PocketBase 钩子函数   | Informational | /docs/hooks       |
| PocketBase 扩展开发   | Informational | /docs/extending   |

#### 对比/选型 (Comparison)

| Keyword                | Intent        | Target Page                  |
| ---------------------- | ------------- | ---------------------------- |
| PocketBase vs Supabase | Commercial    | /blog/pocketbase-vs-supabase |
| PocketBase vs Firebase | Commercial    | /blog/pocketbase-vs-firebase |
| PocketBase 替代品      | Informational | /blog/baas-comparison        |
| 后端即服务 BaaS 选型   | Informational | /blog/baas-guide             |

### 1.3 Keyword Distribution Matrix (关键词分布矩阵)

```
Homepage (首页)
├── Primary: PocketBase 中文, PocketBase 中文文档
├── Secondary: PocketBase 官网, PocketBase 入门
└── LSI: 后端即服务, BaaS, SQLite, Go

Documentation (文档)
├── Hub Page: PocketBase 教程, PocketBase 文档
├── Category: PocketBase 部署, PocketBase SDK
└── Detail: [Long-tail keywords per page]

Blog (博客)
├── Comparison: PocketBase vs [Competitor]
├── Tutorial: PocketBase [Feature] 教程
└── Case Study: [Company] 使用 PocketBase

Downloads (下载)
├── Primary: PocketBase 下载
├── Secondary: PocketBase 最新版本, PocketBase 历史版本
└── LSI: PocketBase release, PocketBase binary
```

---

## 2. Content Architecture

### 2.1 Content Categories (内容分类)

```
/                           # 首页 - 品牌入口
├── /docs/                  # 文档 - 核心价值
│   ├── /docs/introduction/ # 入门指南
│   ├── /docs/api/          # API 参考
│   ├── /docs/sdk/          # SDK 集成
│   ├── /docs/deploy/       # 部署指南
│   ├── /docs/storage/      # 存储配置
│   ├── /docs/auth/         # 认证系统
│   └── /docs/extending/    # 扩展开发
├── /plugins/               # 插件市场
│   ├── /plugins/sdk/       # SDK 插件
│   ├── /plugins/storage/   # 存储插件
│   └── /plugins/auth/      # 认证插件
├── /showcase/              # 案例展示
├── /blog/                  # 博客
│   ├── /blog/tutorials/    # 教程
│   ├── /blog/comparisons/  # 对比
│   └── /blog/news/         # 新闻
├── /downloads/             # 下载中心
└── /community/             # 社区
```

### 2.2 URL Structure (URL 结构)

**Principles**:

- 使用英文 slug (SEO 友好)
- 层级不超过 3 级
- 语义化命名
- 避免参数和 ID

```
# Good Examples
/docs/deploy/docker
/docs/sdk/uniapp
/blog/pocketbase-vs-supabase
/plugins/aliyun-oss-storage
/showcase/startup-x

# Bad Examples (避免)
/docs/123
/blog?id=456
/docs/部署/docker
```

### 2.3 Internal Linking Strategy (内部链接策略)

#### Hub & Spoke Model (中心辐射模型)

```
                    [首页]
                       │
         ┌─────────────┼─────────────┐
         │             │             │
      [文档]        [博客]       [插件]
         │             │             │
    ┌────┼────┐   ┌────┼────┐   ┌────┼────┐
    │    │    │   │    │    │   │    │    │
 [部署][SDK][API][教程][对比][新闻][存储][认证][SDK]
```

#### Linking Rules (链接规则)

| From   | To         | Anchor Text Pattern       |
| ------ | ---------- | ------------------------- |
| 首页   | 文档首页   | "查看完整文档"            |
| 首页   | 热门教程   | "[教程名称]"              |
| 文档页 | 相关文档   | "了解更多关于 [主题]"     |
| 文档页 | 相关插件   | "推荐插件: [插件名]"      |
| 博客   | 文档页     | "详细配置请参考 [文档名]" |
| 插件页 | 使用文档   | "查看使用指南"            |
| 案例页 | 相关技术栈 | "[技术] 文档"             |

#### Contextual Links (上下文链接)

每个文档页面应包含:

- **Breadcrumb**: 面包屑导航 (Schema.org BreadcrumbList)
- **Previous/Next**: 上一篇/下一篇
- **Related**: 3-5 个相关文档
- **TOC**: 页内目录 (自动生成)

---

## 3. Technical SEO

### 3.1 Meta Tags Template

```html
<!-- Base Meta -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Primary Meta -->
<title>{Page Title} | PocketBase 中文网</title>
<meta name="description" content="{150-160 chars description with keyword}" />
<meta name="keywords" content="{keyword1}, {keyword2}, {keyword3}" />
<meta name="author" content="PocketBase.cn" />

<!-- Canonical -->
<link rel="canonical" href="https://pocketbase.cn/{path}" />

<!-- Language -->
<html lang="zh-CN">
  <meta name="language" content="Chinese" />

  <!-- Robots -->
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="googlebot" content="index, follow" />
</html>
```

### 3.2 Open Graph

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://pocketbase.cn/{path}" />
<meta property="og:title" content="{Title}" />
<meta property="og:description" content="{Description}" />
<meta property="og:image" content="https://pocketbase.cn/og/{page-slug}.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="zh_CN" />
<meta property="og:site_name" content="PocketBase 中文网" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{Title}" />
<meta name="twitter:description" content="{Description}" />
<meta name="twitter:image" content="https://pocketbase.cn/og/{page-slug}.png" />
```

### 3.3 JSON-LD Structured Data

#### Organization (网站级)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PocketBase 中文网",
  "alternateName": "PocketBase.cn",
  "url": "https://pocketbase.cn",
  "logo": "https://pocketbase.cn/logo.png",
  "description": "PocketBase 中文文档、教程与社区",
  "sameAs": [
    "https://github.com/pocketbase-cn",
    "https://space.bilibili.com/xxx"
  ]
}
```

#### WebSite with SearchAction (首页)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PocketBase 中文网",
  "url": "https://pocketbase.cn",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://pocketbase.cn/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

#### TechArticle (文档页)

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "{Document Title}",
  "description": "{Description}",
  "author": {
    "@type": "Organization",
    "name": "PocketBase 中文网"
  },
  "publisher": {
    "@type": "Organization",
    "name": "PocketBase 中文网",
    "logo": {
      "@type": "ImageObject",
      "url": "https://pocketbase.cn/logo.png"
    }
  },
  "datePublished": "{ISO Date}",
  "dateModified": "{ISO Date}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://pocketbase.cn/docs/{slug}"
  },
  "image": "https://pocketbase.cn/og/{slug}.png",
  "articleSection": "{Category}",
  "inLanguage": "zh-CN"
}
```

#### BreadcrumbList (所有页面)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首页",
      "item": "https://pocketbase.cn"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "文档",
      "item": "https://pocketbase.cn/docs"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{Current Page}",
      "item": "https://pocketbase.cn/docs/{slug}"
    }
  ]
}
```

#### SoftwareApplication (下载页)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PocketBase",
  "operatingSystem": "Windows, macOS, Linux",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CNY"
  },
  "softwareVersion": "{Version}",
  "downloadUrl": "https://pocketbase.cn/downloads/{version}",
  "releaseNotes": "https://pocketbase.cn/changelog"
}
```

#### HowTo (教程类博客)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "{Tutorial Title}",
  "description": "{Description}",
  "image": "https://pocketbase.cn/og/{slug}.png",
  "totalTime": "PT{minutes}M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "CNY",
    "value": "0"
  },
  "tool": [
    {
      "@type": "HowToTool",
      "name": "PocketBase"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "{Step Title}",
      "text": "{Step Description}",
      "url": "https://pocketbase.cn/blog/{slug}#step-1"
    }
  ]
}
```

### 3.4 Sitemap Configuration

#### sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://pocketbase.cn/sitemap-pages.xml</loc>
    <lastmod>{date}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://pocketbase.cn/sitemap-docs.xml</loc>
    <lastmod>{date}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://pocketbase.cn/sitemap-blog.xml</loc>
    <lastmod>{date}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://pocketbase.cn/sitemap-plugins.xml</loc>
    <lastmod>{date}</lastmod>
  </sitemap>
</sitemapindex>
```

#### Priority & Frequency Rules

| Page Type    | Priority | Changefreq |
| ------------ | -------- | ---------- |
| Homepage     | 1.0      | daily      |
| Docs Hub     | 0.9      | weekly     |
| Doc Detail   | 0.8      | weekly     |
| Blog Post    | 0.7      | monthly    |
| Plugin Page  | 0.6      | monthly    |
| Showcase     | 0.5      | monthly    |
| Static Pages | 0.3      | yearly     |

### 3.5 robots.txt

```txt
# PocketBase.cn robots.txt
User-agent: *
Allow: /

# Disallow admin and private paths
Disallow: /admin/
Disallow: /api/
Disallow: /_/
Disallow: /search?
Disallow: /*.json$

# Sitemap
Sitemap: https://pocketbase.cn/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Specific bot rules
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: Sogou web spider
Allow: /

User-agent: 360Spider
Allow: /

# Block AI training bots (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /
```

---

## 4. Content Plan

### 4.1 Documentation Translation Priority (文档翻译优先级)

#### Phase 1: Core (Week 1-2) - P0

| Document            | Official Path             | Priority | Est. Hours |
| ------------------- | ------------------------- | -------- | ---------- |
| Introduction        | /docs                     | P0       | 2          |
| Going to Production | /docs/going-to-production | P0       | 4          |
| Collections         | /docs/collections         | P0       | 3          |
| API Overview        | /docs/api-overview        | P0       | 2          |
| Authentication      | /docs/authentication      | P0       | 4          |
| Files Storage       | /docs/files-handling      | P0       | 3          |

#### Phase 2: API & SDK (Week 3-4) - P1

| Document     | Official Path          | Priority | Est. Hours |
| ------------ | ---------------------- | -------- | ---------- |
| API Records  | /docs/api-records      | P1       | 4          |
| API Realtime | /docs/api-realtime     | P1       | 3          |
| API Files    | /docs/api-files        | P1       | 2          |
| Web SDK      | /docs/client-side-sdks | P1       | 4          |
| Dart SDK     | /docs/client-side-sdks | P1       | 3          |

#### Phase 3: Advanced (Week 5-6) - P2

| Document          | Official Path       | Priority | Est. Hours |
| ----------------- | ------------------- | -------- | ---------- |
| Extending with Go | /docs/go-overview   | P2       | 6          |
| Extending with JS | /docs/js-overview   | P2       | 6          |
| Event Hooks       | /docs/event-hooks   | P2       | 4          |
| Custom Routes     | /docs/custom-routes | P2       | 3          |

### 4.2 Original Content Plan (原创内容计划)

#### UniApp Integration Guide (UniApp 集成指南)

**Target**: `/docs/sdk/uniapp`
**Keywords**: PocketBase UniApp, PocketBase 小程序
**Word Count**: 2500+

```markdown
# Outline

1. 为什么选择 PocketBase + UniApp
   - 技术栈对比
   - 适用场景

2. 环境准备
   - PocketBase 服务端配置
   - UniApp 项目初始化
   - 跨域配置

3. SDK 封装
   - HTTP 请求封装
   - Token 管理
   - 类型定义

4. 核心功能实现
   - 用户认证 (手机号/微信)
   - 数据 CRUD
   - 文件上传
   - 实时订阅 (WebSocket)

5. 最佳实践
   - 错误处理
   - 离线缓存
   - 性能优化

6. 完整示例项目
   - GitHub 仓库链接
   - 在线演示
```

#### BT Panel Deployment Guide (宝塔面板部署)

**Target**: `/docs/deploy/bt-panel`
**Keywords**: PocketBase 宝塔, PocketBase 宝塔面板部署
**Word Count**: 2000+

```markdown
# Outline

1. 前置要求
   - 宝塔面板版本
   - 服务器配置要求

2. 安装 PocketBase
   - 下载二进制文件
   - 目录结构规划
   - 权限设置

3. Supervisor 进程管理
   - 安装 Supervisor
   - 配置文件详解
   - 启动与监控

4. Nginx 反向代理
   - 站点配置
   - WebSocket 支持
   - SSL 证书配置

5. 定时备份
   - 数据库备份脚本
   - 宝塔计划任务配置
   - 备份到 OSS

6. 常见问题排查
   - 502 错误
   - WebSocket 连接失败
   - 文件上传限制
```

#### Aliyun OSS Configuration (阿里云 OSS 配置)

**Target**: `/docs/storage/aliyun-oss`
**Keywords**: PocketBase 阿里云 OSS, PocketBase S3 存储
**Word Count**: 1800+

```markdown
# Outline

1. 阿里云 OSS 准备
   - Bucket 创建
   - 访问密钥配置
   - 跨域设置

2. PocketBase S3 配置
   - 环境变量设置
   - S3 兼容性说明
   - Endpoint 格式

3. 高级配置
   - CDN 加速
   - 图片处理 (缩略图)
   - 私有读写权限

4. 迁移指南
   - 本地文件迁移到 OSS
   - 数据库记录更新

5. 费用优化
   - 存储类型选择
   - 流量包购买建议
```

### 4.3 Blog Content Calendar (博客内容日历)

#### Month 1: Foundation

| Week | Title                             | Type       | Keywords                           |
| ---- | --------------------------------- | ---------- | ---------------------------------- |
| W1   | PocketBase 完全入门指南 (2025版)  | Tutorial   | PocketBase 入门, PocketBase 教程   |
| W2   | PocketBase vs Supabase: 深度对比  | Comparison | PocketBase Supabase 对比           |
| W3   | 10分钟用 PocketBase 构建 Todo App | Tutorial   | PocketBase 实战, PocketBase Todo   |
| W4   | PocketBase 0.x 新特性解读         | News       | PocketBase 更新, PocketBase 新版本 |

#### Month 2: Integration

| Week | Title                               | Type      | Keywords                              |
| ---- | ----------------------------------- | --------- | ------------------------------------- |
| W1   | Vue 3 + PocketBase 全栈开发实战     | Tutorial  | PocketBase Vue, Vue PocketBase        |
| W2   | React + PocketBase 认证系统实现     | Tutorial  | PocketBase React, PocketBase 登录     |
| W3   | PocketBase 实时功能详解与最佳实践   | Deep Dive | PocketBase 实时, PocketBase WebSocket |
| W4   | Next.js 14 集成 PocketBase 完整指南 | Tutorial  | PocketBase Next.js, SSR PocketBase    |

#### Month 3: Deployment & Production

| Week | Title                                   | Type     | Keywords                               |
| ---- | --------------------------------------- | -------- | -------------------------------------- |
| W1   | PocketBase 生产环境最佳实践             | Guide    | PocketBase 生产环境, PocketBase 部署   |
| W2   | Docker Compose 部署 PocketBase 完整方案 | Tutorial | PocketBase Docker, Docker PocketBase   |
| W3   | PocketBase 安全配置清单                 | Guide    | PocketBase 安全, PocketBase 配置       |
| W4   | 监控 PocketBase: Prometheus + Grafana   | Tutorial | PocketBase 监控, PocketBase Prometheus |

#### Month 4: Advanced & Case Studies

| Week | Title                                                       | Type       | Keywords                          |
| ---- | ----------------------------------------------------------- | ---------- | --------------------------------- |
| W1   | 用 Go 扩展 PocketBase: 自定义 API                           | Tutorial   | PocketBase Go, PocketBase 扩展    |
| W2   | PocketBase Hooks 实战: 数据校验与自动化                     | Tutorial   | PocketBase Hooks, PocketBase 钩子 |
| W3   | [Case Study] XX 团队如何用 PocketBase 省下 80% 后端开发时间 | Case Study | PocketBase 案例                   |
| W4   | PocketBase vs Firebase: 成本与功能对比                      | Comparison | PocketBase Firebase 对比          |

---

## 5. Page-level SEO

### 5.1 Homepage (首页)

```yaml
URL: https://pocketbase.cn/

Title: "PocketBase 中文网 - 官方文档翻译、教程与社区"
Description: "PocketBase 中文文档站,提供完整的 PocketBase 中文教程、部署指南、SDK 集成和最佳实践。一站式 BaaS 后端解决方案。"

H1: "PocketBase 中文文档与社区"

Sections:
  - Hero: 核心价值主张 + CTA (开始学习 / 立即下载)
  - Features: 6个核心特性 (实时数据库, 认证系统, 文件存储, API Rules, 扩展能力, 单文件部署)
  - Quick Start: 5分钟快速开始代码示例
  - Docs Preview: 热门文档链接
  - Blog Preview: 最新博客文章
  - Community: 社区入口 (GitHub, QQ群, Discord)

Schema: Organization + WebSite (SearchAction)

Internal Links:
  - /docs/introduction (开始学习)
  - /downloads (立即下载)
  - /docs/deploy (部署指南)
  - /blog (博客)
```

### 5.2 Documentation Hub Page (文档首页)

```yaml
URL: https://pocketbase.cn/docs/

Title: "PocketBase 文档 - 完整中文教程与 API 参考 | PocketBase 中文网"
Description: "PocketBase 官方文档中文翻译,包含入门指南、API 参考、SDK 集成、部署教程等完整内容。从零开始学习 PocketBase。"

H1: "PocketBase 文档"

Sections:
  - Search: 文档搜索框
  - Getting Started: 入门指南卡片
  - Core Concepts: 核心概念 (Collections, Records, Auth, Files)
  - API Reference: API 参考链接
  - SDKs: SDK 集成 (JavaScript, Dart, UniApp)
  - Deployment: 部署指南
  - Extending: 扩展开发

Sidebar:
  - 分类导航
  - 版本选择器

Schema: CollectionPage + BreadcrumbList
```

### 5.3 Documentation Detail Page (文档详情页)

```yaml
URL: https://pocketbase.cn/docs/{category}/{slug}/

Title: "{Doc Title} | PocketBase 文档"
Description: "{Auto-generated from first paragraph, 150-160 chars}"

H1: "{Doc Title}"

Structure:
  - Breadcrumb
  - Table of Contents (右侧固定)
  - Content (Markdown rendered)
  - Code Examples (可复制)
  - Related Docs (底部)
  - Edit on GitHub (贡献入口)
  - Previous/Next Navigation

Schema: TechArticle + BreadcrumbList

Features:
  - 代码高亮
  - 一键复制
  - 锚点链接
  - 阅读时间估算
  - 最后更新时间
```

### 5.4 Plugin Detail Page (插件详情页)

```yaml
URL: https://pocketbase.cn/plugins/{slug}/

Title: "{Plugin Name} - PocketBase 插件 | PocketBase 中文网"
Description: "{Plugin description}. 查看安装方法、使用文档和示例代码。"

H1: "{Plugin Name}"

Sections:
  - Header: 名称 + 简介 + 安装命令
  - Badges: 版本, 下载量, 许可证, 兼容性
  - Installation: 安装步骤
  - Usage: 使用方法 + 代码示例
  - Configuration: 配置选项
  - Changelog: 更新日志
  - Related Plugins: 相关插件推荐

Sidebar:
  - GitHub 链接
  - npm/go 包链接
  - 作者信息
  - 标签

Schema: SoftwareSourceCode + BreadcrumbList
```

### 5.5 Showcase Detail Page (案例详情页)

```yaml
URL: https://pocketbase.cn/showcase/{slug}/

Title: "{Project Name} - PocketBase 案例 | PocketBase 中文网"
Description: "{Project name} 使用 PocketBase 构建的 {category} 应用。了解技术架构和实现细节。"

H1: "{Project Name}"

Sections:
  - Hero: 项目截图 + 简介
  - Tech Stack: 技术栈标签
  - Challenge: 面临的挑战
  - Solution: PocketBase 解决方案
  - Results: 成果数据
  - Code Snippets: 关键代码
  - Links: 项目链接, 作者信息

Schema: CreativeWork + BreadcrumbList
```

### 5.6 Downloads Page (下载页)

```yaml
URL: https://pocketbase.cn/downloads/

Title: "PocketBase 下载 - 官方版本与国内镜像 | PocketBase 中文网"
Description: "下载 PocketBase 最新版本,支持 Windows、macOS、Linux。提供国内高速镜像,快速获取 PocketBase 二进制文件。"

H1: "PocketBase 下载"

Sections:
  - Latest Version: 最新稳定版
    - Version Number + Release Date
    - Download Buttons (按平台)
    - Checksums
  - Mirror Options: 镜像选择
    - GitHub (官方)
    - 国内镜像 (加速)
  - All Versions: 历史版本列表
  - Installation: 安装说明
  - Verify: 校验方法

Schema: SoftwareApplication + BreadcrumbList

Features:
  - 自动检测操作系统
  - 下载进度显示
  - 复制 wget/curl 命令
```

---

## 6. Performance SEO

### 6.1 Core Web Vitals Targets

| Metric                             | Target  | Measurement     |
| ---------------------------------- | ------- | --------------- |
| **LCP** (Largest Contentful Paint) | < 2.5s  | 75th percentile |
| **FID** (First Input Delay)        | < 100ms | 75th percentile |
| **CLS** (Cumulative Layout Shift)  | < 0.1   | 75th percentile |
| **TTFB** (Time to First Byte)      | < 600ms | 75th percentile |
| **FCP** (First Contentful Paint)   | < 1.8s  | 75th percentile |

### 6.2 Image Optimization (图片优化)

#### Format Strategy

```
Decision Tree:
├── Photographs → WebP (fallback: JPEG)
├── Screenshots → WebP (fallback: PNG)
├── Logos/Icons → SVG (inline when possible)
├── Animated → WebP animated (fallback: GIF)
└── OG Images → PNG (1200x630, < 300KB)
```

#### Responsive Images

```html
<picture>
  <source
    srcset="
      /images/hero-400.webp   400w,
      /images/hero-800.webp   800w,
      /images/hero-1200.webp 1200w
    "
    sizes="(max-width: 400px) 400px,
           (max-width: 800px) 800px,
           1200px"
    type="image/webp"
  />
  <img
    src="/images/hero-800.jpg"
    alt="{Descriptive alt text}"
    width="1200"
    height="630"
    loading="lazy"
    decoding="async"
  />
</picture>
```

#### Image Checklist

- [ ] All images have `alt` attributes
- [ ] All images have explicit `width` and `height`
- [ ] Above-fold images: `loading="eager"`, `fetchpriority="high"`
- [ ] Below-fold images: `loading="lazy"`, `decoding="async"`
- [ ] WebP format with JPEG/PNG fallback
- [ ] Compressed (< 100KB for content images)
- [ ] CDN delivery with caching headers

### 6.3 Font Optimization (字体优化)

#### Strategy

```css
/* System font stack for body text */
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, "Noto Sans SC", sans-serif;

/* Monospace for code */
font-family:
  "JetBrains Mono", "Fira Code", "SF Mono", Consolas, "Liberation Mono", Menlo,
  monospace;
```

#### Web Font Loading (if needed)

```html
<!-- Preconnect to font origin -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />

<!-- Font with display swap -->
<link
  rel="preload"
  as="font"
  type="font/woff2"
  href="/fonts/inter-var.woff2"
  crossorigin
/>

<style>
  @font-face {
    font-family: "Inter";
    src: url("/fonts/inter-var.woff2") format("woff2");
    font-weight: 100 900;
    font-display: swap;
    unicode-range: U+0000-00FF, U+0131, U+0152-0153;
  }
</style>
```

### 6.4 Performance Checklist

#### Critical Rendering Path

- [ ] Inline critical CSS (< 14KB)
- [ ] Defer non-critical CSS
- [ ] Async/defer JavaScript
- [ ] Preload LCP image
- [ ] Preconnect to required origins

#### Caching Strategy

```nginx
# Static assets (1 year)
location ~* \.(js|css|png|jpg|jpeg|gif|webp|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML (no cache)
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

#### Build Optimizations

- [ ] Code splitting (route-based)
- [ ] Tree shaking
- [ ] Minification (HTML, CSS, JS)
- [ ] Gzip/Brotli compression
- [ ] HTTP/2 or HTTP/3

---

## 7. Growth Hacking

### 7.1 Backlink Acquisition Strategy (外链获取策略)

#### Tier 1: High Authority (高权重)

| Platform     | Strategy                                | Target      |
| ------------ | --------------------------------------- | ----------- |
| GitHub       | PocketBase 仓库 README 添加中文文档链接 | 官方认可    |
| SegmentFault | 发布高质量技术文章                      | 3-5 篇/月   |
| 掘金         | 专栏文章 + 沸点                         | 5-10 篇/月  |
| CSDN         | 博客文章同步                            | 5 篇/月     |
| 知乎         | 问答 + 文章                             | 10+ 回答/月 |

#### Tier 2: Community (社区)

| Platform   | Strategy        | Target    |
| ---------- | --------------- | --------- |
| V2EX       | 分享节点发帖    | 2-3 帖/月 |
| Ruby China | 技术分享        | 1-2 帖/月 |
| LearnKu    | Laravel/Go 社区 | 2-3 帖/月 |
| 开源中国   | 软件收录 + 博客 | 持续      |

#### Tier 3: Resource Sites (资源站)

| Type          | Action                                     |
| ------------- | ------------------------------------------ |
| 技术导航站    | 提交收录 (HelloGitHub, GitHubDaily)        |
| 周刊          | 投稿 (前端周刊, Go周刊, 独立开发者周刊)    |
| Awesome Lists | 提交 PR (awesome-selfhosted, awesome-baas) |

### 7.2 Community Operations (社区运营)

#### Official Channels

```
QQ Group: PocketBase 中文交流群
├── 群规: 禁止广告, 鼓励提问
├── 机器人: 自动回复常见问题
├── 精华: 沉淀优质内容
└── 活动: 每周技术分享

Discord/微信群: 开发者社区
├── 频道: #新手求助 #技术讨论 #资源分享 #项目展示
└── 定期: AMA / 直播 / 代码审查
```

#### Content Distribution

```
Blog Post Published
├── 同步掘金/SegmentFault/CSDN
├── 发布知乎文章
├── 发送公众号推文
├── 分享到 QQ 群/微信群
├── 发布 B站/抖音 短视频 (如适用)
└── 推送 RSS 订阅
```

#### User Engagement

| Action             | Frequency      | Goal         |
| ------------------ | -------------- | ------------ |
| 回复 GitHub Issues | Daily          | < 24h 响应   |
| 回答社区问题       | Daily          | 建立专家形象 |
| 周报/月报          | Weekly/Monthly | 透明运营     |
| 直播教程           | Monthly        | 深度互动     |
| 线下 Meetup        | Quarterly      | 品牌曝光     |

### 7.3 Badge System (徽章系统)

#### User Badges

```yaml
Contributor Badges:
  - name: "文档贡献者"
    icon: "doc"
    requirement: "提交 1+ 文档 PR"
    color: "#3B82F6"

  - name: "代码贡献者"
    icon: "code"
    requirement: "提交 1+ 代码 PR"
    color: "#10B981"

  - name: "社区达人"
    icon: "star"
    requirement: "回答 10+ 问题"
    color: "#F59E0B"

  - name: "内容创作者"
    icon: "pen"
    requirement: "发布 3+ 优质文章"
    color: "#8B5CF6"

  - name: "早期支持者"
    icon: "rocket"
    requirement: "前 100 名注册用户"
    color: "#EC4899"
```

#### Project Badges (for README)

```markdown
<!-- PocketBase 中文网推荐徽章 -->

[![PocketBase 中文文档](https://img.shields.io/badge/docs-PocketBase.cn-blue)](https://pocketbase.cn)

<!-- 使用 PocketBase 构建徽章 -->

[![Built with PocketBase](https://img.shields.io/badge/built%20with-PocketBase-orange)](https://pocketbase.cn)

<!-- 案例收录徽章 -->

[![Featured on PocketBase.cn](https://img.shields.io/badge/featured-PocketBase.cn-success)](https://pocketbase.cn/showcase/your-project)
```

#### Badge API

```
GET https://pocketbase.cn/api/badge/{type}

Types:
- docs: 文档链接徽章
- built-with: 技术栈徽章
- featured: 案例收录徽章
- version: PocketBase 版本徽章

Parameters:
- style: flat, flat-square, plastic, for-the-badge
- color: hex color code
- label: custom label text
```

### 7.4 Growth Metrics (增长指标)

#### North Star Metrics

| Metric           | Month 1 | Month 3 | Month 6 | Month 12 |
| ---------------- | ------- | ------- | ------- | -------- |
| Monthly Visitors | 1,000   | 5,000   | 20,000  | 50,000   |
| Organic Traffic  | 30%     | 50%     | 70%     | 80%      |
| Doc Page Views   | 5,000   | 25,000  | 100,000 | 300,000  |
| GitHub Stars     | 50      | 200     | 500     | 1,000    |
| QQ 群人数        | 100     | 500     | 1,000   | 2,000    |

#### SEO Metrics

| Metric           | Target                              |
| ---------------- | ----------------------------------- |
| Indexed Pages    | 100+ pages in 3 months              |
| Keyword Rankings | Top 3 for core keywords in 6 months |
| Domain Authority | DA 20+ in 6 months                  |
| Backlinks        | 100+ referring domains in 6 months  |

#### Tracking Setup

```javascript
// Google Analytics 4 Events
gtag("event", "page_view", {
  page_title: document.title,
  page_location: window.location.href,
  content_group: "{docs|blog|plugins|showcase}",
});

gtag("event", "click", {
  event_category: "Download",
  event_label: "{platform}_{version}",
});

gtag("event", "search", {
  search_term: "{query}",
});

// Baidu Analytics
_hmt.push(["_trackPageview", window.location.pathname]);
```

---

## Appendix

### A. Meta Tag Templates

#### Homepage

```html
<title>PocketBase 中文网 - 官方文档翻译、教程与社区</title>
<meta
  name="description"
  content="PocketBase 中文文档站,提供完整的 PocketBase 中文教程、部署指南、SDK 集成和最佳实践。一站式 BaaS 后端解决方案,支持实时数据库、用户认证、文件存储。"
/>
```

#### Documentation

```html
<title>{Doc Title} | PocketBase 文档</title>
<meta
  name="description"
  content="学习 PocketBase {topic}。本文档详细介绍了 {feature},包含代码示例和最佳实践。"
/>
```

#### Blog

```html
<title>{Post Title} | PocketBase 中文网</title>
<meta name="description" content="{Post excerpt, 150-160 chars}" />
```

#### Plugin

```html
<title>{Plugin Name} - PocketBase 插件 | PocketBase 中文网</title>
<meta
  name="description"
  content="{Plugin Name}: {short description}. 查看安装方法、配置说明和使用示例。"
/>
```

### B. Checklist for New Content

- [ ] Title contains primary keyword (< 60 chars)
- [ ] Meta description contains keyword + CTA (150-160 chars)
- [ ] URL is clean and semantic
- [ ] H1 is unique and contains keyword
- [ ] Content is > 1200 words (for tutorials)
- [ ] Images have alt text and are optimized
- [ ] Internal links to 3+ related pages
- [ ] Schema.org markup is correct
- [ ] OG image is generated (1200x630)
- [ ] Mobile-friendly
- [ ] Load time < 3s

### C. Quarterly Review Checklist

- [ ] Update keyword research
- [ ] Audit and update old content
- [ ] Check for broken links
- [ ] Review Core Web Vitals
- [ ] Analyze competitor changes
- [ ] Update sitemap
- [ ] Review robots.txt
- [ ] Check indexed pages vs submitted
- [ ] Review backlink profile
- [ ] Update content calendar

---

_Document Version: 1.0.0_
_Last Updated: 2025-12-30_
_Next Review: 2026-03-30_
