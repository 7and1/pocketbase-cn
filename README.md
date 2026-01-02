# PocketBase.cn

PocketBase.cn 是一个面向中文用户的 PocketBase 生态站点，包含：

- 文档站（Astro + Starlight + Pagefind）
- 社区模块（插件市场、案例展示、评论/收藏/投票）
- 下载镜像页（同步官方 Releases，展示校验与统计）
- 后端（PocketBase + pb_hooks + pb_migrations）

## 目录结构

- `apps/backend/`：生产级 PocketBase 实例（hooks/migrations/public/data）
- `apps/web/`：站点前端（Astro + Starlight）
- `docs/`：产品/架构/部署规格（source of truth）

## 本地开发

前置：Node.js、pnpm。

1. 安装依赖：

```bash
pnpm install
```

2. 启动后端（PocketBase）：

```bash
pnpm backend:download
pnpm backend:migrate
pnpm backend:dev
```

3. 启动前端：

```bash
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 pnpm web:dev
```

## 常用命令

- `pnpm web:build`：生成 `apps/web/dist/`（含 OG 图片、sitemap、pagefind）
- `pnpm -C apps/web test`：前端单元测试（vitest）
- `pnpm backend:smoke`：后端 API 冒烟测试（需要后端已启动）
- `pnpm web:smoke`：检查 web build 输出关键文件

## 环境变量

- Web：见 `.env.example`
- Backend：见 `apps/backend/.env.example`

> 注意：不要提交 `.env*` 和 `apps/backend/pb_data/`（本地数据库）。
