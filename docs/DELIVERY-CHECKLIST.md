# Delivery Checklist (Production)

This checklist defines “done” for PocketBase.cn across backend, web, content, and SEO.

## Local Verification (Required)

Run from repo root:

- `pnpm -C apps/web test`
- `pnpm web:build`
- `pnpm web:smoke`
- `pnpm backend:download`
- `pnpm backend:migrate`
- `PB_HOOKS_WATCH=0 pnpm backend:dev` (keep running)
- In a second terminal: `pnpm backend:smoke`

## Backend (PocketBase) Readiness

- `apps/backend/pb_hooks/` loads without startup errors.
- Health probes return 200:
  - `GET /api/live`
  - `GET /api/ready`
- CSRF works for cookie/session flows:
  - `GET /api/csrf-token` returns a token when `PB_CSRF_SECRET` is set.
  - State-changing requests without `X-CSRF-Token` are rejected with 403 (when no `Authorization` header is present).
- Rate limit rules return 429 on protected endpoints (e.g. plugin download tracking).

## Web (Astro) Readiness

- `apps/web/dist/` contains:
  - `sitemap-index.xml`
  - `robots.txt`
  - `pagefind/` index
  - `og-image.png`
- Auth-required pages are `noindex` to avoid indexing private user content.

## SEO / Indexing

- `robots.txt` points to `https://pocketbase.cn/sitemap-index.xml`.
- Each public page has:
  - canonical URL
  - `description`
  - OpenGraph + Twitter meta
  - JSON-LD where applicable (articles / plugins / showcase)

## Production Configuration (Required)

- Backend `.env` (server-side) includes:
  - `PB_CSRF_SECRET` (32+ chars)
  - `PB_CORS_ORIGINS` (allowlisted origins)
  - optional: `GITHUB_TOKEN`, `RESEND_API_KEY`, `ALERT_WEBHOOK_URL`, Litestream/R2
- Cloudflare Pages / Workers config:
  - `PUBLIC_POCKETBASE_URL`
  - `PUBLIC_SITE_URL`
  - KV binding: `SESSION` (if using sessions)
