# Web (Astro + Starlight)

PocketBase.cn 前端站点：

- 文档：Starlight（`src/content/docs/`）
- 社区页面：`src/pages/`（插件/案例/下载/认证/面板等）
- 搜索：Pagefind（`astro-pagefind`）

## 开发

```bash
pnpm -C apps/web dev
```

## 构建

```bash
pnpm -C apps/web build
pnpm -C apps/web smoke:dist
```

## 环境变量

见仓库根目录 `.env.example`。
