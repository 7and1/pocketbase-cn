// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import pagefind from "astro-pagefind";
import tsconfigPaths from "vite-tsconfig-paths";

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://pocketbase.cn";

export default defineConfig({
  site: SITE_URL,
  // Astro v5: default output supports per-route `prerender` (SSR where needed).
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "compile",
    routes: {
      strategy: "include",
      include: [
        "/plugins/*",
        "/showcase/*",
        "/downloads/*",
        "/api/*",
        "/auth/*",
        "/newsletter/*",
      ],
    },
  }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    sitemap(),
    pagefind(),
    starlight({
      title: "PocketBase.cn",
      description: "PocketBase 中文文档、插件市场、案例展示与下载镜像",
      disable404Route: true,
      defaultLocale: "root",
      locales: {
        root: { label: "中文", lang: "zh-CN" },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/pocketbase/pocketbase",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/pocketbase",
        },
      ],
      customCss: ["./src/styles/global.css", "./src/styles/starlight.css"],
      sidebar: [
        {
          label: "开始",
          items: [
            { label: "简介", slug: "docs/guides/getting-started" },
            { label: "安装", slug: "docs/guides/installation" },
            { label: "快速开始", slug: "docs/guides/quick-start" },
          ],
        },
        {
          label: "核心概念",
          items: [
            { label: "集合与字段", slug: "docs/guides/collections" },
            { label: "字段类型", slug: "docs/guides/field-types" },
            { label: "API 规则", slug: "docs/guides/api-rules" },
            { label: "认证与授权", slug: "docs/guides/authentication" },
            { label: "文件处理", slug: "docs/guides/files-handling" },
            { label: "数据库迁移", slug: "docs/guides/migrations" },
            { label: "查询优化", slug: "docs/guides/query-optimization" },
            { label: "生产环境", slug: "docs/guides/going-to-production" },
          ],
        },
        {
          label: "API",
          items: [
            { label: "概览", slug: "docs/api/api-overview" },
            { label: "Records", slug: "docs/api/api-records" },
            { label: "Realtime", slug: "docs/api/api-realtime" },
            { label: "Files", slug: "docs/api/api-files" },
          ],
        },
        {
          label: "前端集成",
          items: [
            { label: "Vue", slug: "sdk/vue" },
            { label: "React", slug: "sdk/react" },
            { label: "Next.js", slug: "sdk/nextjs" },
            { label: "UniApp", slug: "sdk/uniapp" },
            { label: "微信小程序", slug: "sdk/miniprogram" },
          ],
        },
        {
          label: "部署指南",
          items: [
            { label: "Docker", slug: "deploy/docker" },
            { label: "Docker Compose", slug: "deploy/docker-compose" },
            { label: "阿里云 ECS", slug: "deploy/aliyun-ecs" },
            { label: "腾讯云", slug: "deploy/tencent-cloud" },
            { label: "宝塔面板", slug: "deploy/bt-panel" },
            {
              label: "Cloudflare Workers",
              slug: "deploy/cloudflare-workers",
            },
          ],
        },
        {
          label: "高级（P2）",
          items: [
            { label: "Go 扩展", slug: "docs/advanced/go-overview" },
            { label: "JS 扩展", slug: "docs/advanced/js-overview" },
            { label: "事件 Hooks", slug: "docs/advanced/event-hooks" },
            { label: "自定义 Routes", slug: "docs/advanced/custom-routes" },
          ],
        },
        {
          label: "社区",
          items: [
            { label: "插件市场", link: "/plugins" },
            { label: "案例展示", link: "/showcase" },
            { label: "下载", link: "/downloads" },
          ],
        },
      ],
    }),
  ],
  vite: {
    plugins: [tsconfigPaths()],
    define: {
      __SITE_URL__: JSON.stringify(SITE_URL),
    },
  },
});
