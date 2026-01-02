# Project Status (2025-12-31)

本文件用于把 `docs/*` 的规划要求与当前仓库实现状态对齐，方便交付与上线。

## 已实现（代码已落地）

### Backend (PocketBase)

- `pb_migrations/`：已包含完整 schema snapshot + 后续增量迁移（含下载架构扩展、GitHub meta 字段）
- `pb_hooks/`：已实现生产可用自定义 API 与自动化
  - 健康检查：`/api/live`、`/api/ready`
  - 插件：列表/详情/精选/趋势/Star/下载计数/视图计数
  - 案例：列表/详情/精选/Vote/视图计数
  - 下载：版本列表/文件列表/统计上报
  - 评论：列表/创建 + 审核保护
  - Newsletter：订阅/确认/退订 + Resend 邮件（可选）
  - Releases：GitHub 同步 + 通知（Resend/Webhook，可选）+ Webhook 触发
  - 审核保护：防止非 staff 修改 `status/featured/author/slug`

### Web (Astro + Starlight)

- 首页 + 社区页面：插件/案例/下载/Newsletter
- 认证：GitHub OAuth（主）、邮箱密码（本地/可选）
- 用户能力：个人资料、我的面板、提交插件、提交案例
- 管理能力：审核队列（moderator/admin）
- SEO：canonical、OG/Twitter meta、JSON-LD、robots.txt、sitemap、OG 图片自动生成
- Search：Pagefind 已以 `zh-cn` 语言构建索引

### CI/CD

- GitHub Actions：`CI`（web test + build；backend migrate 校验）
- Cloudflare Pages 部署 workflow（需要配置 secrets）

## 需要在上线环境完成（非代码项）

- Cloudflare Pages 项目创建、域名绑定、SSL/DNS
- Cloudflare KV：创建并配置 `SESSION` namespace（更新 `apps/web/wrangler.toml`）
- PocketBase 生产部署（VPS/systemd/反向代理）
- R2/Litestream（可选但强烈建议）：创建 bucket、配置密钥与备份验证
- GitHub OAuth App：创建 Client ID/Secret 并在 PocketBase 中配置 provider
- Resend（可选）：配置 API Key 与 From 地址
