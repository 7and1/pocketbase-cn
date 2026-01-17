# PocketBase.cn - Production Server Project

## Overview

PocketBase.cn is a Chinese documentation and community platform for PocketBase, deployed on production server `107.174.42.198`. The project consists of:

- **Backend**: PocketBase instance (API + Admin UI) at `api.pocketbase.cn`
- **Frontend**: Astro + Starlight documentation site at `pocketbase.cn`
- **Storage**: Cloudflare R2 for file uploads and database backups
- **CI/CD**: GitHub Actions for automated deployments

## Server Information

| Property      | Value                               |
| ------------- | ----------------------------------- |
| SSH Host      | `107.174.42.198`                    |
| SSH User      | `root`                              |
| Project Path  | `/opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn` |
| Network       | `nginx-proxy_default` (reverse proxy) |
| Backend Port  | `8090` (internal)                    |

### SSH Access

```bash
ssh root@107.174.42.198
```

## Project Structure

```
/opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn/
├── apps/
│   ├── backend/              # PocketBase backend
│   │   ├── pb_hooks/         # Custom hooks/routes (*.pb.js)
│   │   ├── pb_migrations/    # Database migrations
│   │   ├── pb_public/        # Public static assets
│   │   ├── pb_data/          # SQLite data (git-ignored)
│   │   ├── bin/              # PocketBase binary (git-ignored)
│   │   ├── deploy/           # Deployment configs
│   │   │   ├── docker-compose.yml
│   │   │   ├── production.env.example
│   │   │   └── scripts/      # Deployment/backup scripts
│   │   ├── scripts/          # Development scripts
│   │   │   ├── download-pocketbase.sh
│   │   │   ├── dev.sh
│   │   │   ├── migrate.sh
│   │   │   ├── reset.sh
│   │   │   ├── reset-admin.js
│   │   │   ├── seed-plugins.js
│   │   │   └── smoke.sh
│   │   ├── deploy.sh         # Production deployment script
│   │   ├── backup.sh         # Database backup to R2
│   │   └── monitor.sh        # Health monitoring
│   └── web/                  # Astro frontend
│       ├── src/
│       │   ├── components/   # React/Astro components
│       │   ├── content/      # Docs (Markdown/MDX)
│       │   ├── lib/          # Utilities, stores
│       │   └── pages/        # Route pages
│       ├── public/           # Static assets
│       └── env.mjs           # Environment config
├── docs/                     # Project documentation
│   ├── BLUEPRINT.md
│   ├── DEPLOYMENT.md
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   ├── SCHEMA.md
│   └── ...
├── AGENTS.md                 # AI agent guidelines
└── package.json              # Workspace config
```

## Quick Commands

### Development (Local)

```bash
# Install dependencies
pnpm install

# Start backend (PocketBase)
pnpm backend:dev
# Or: cd apps/backend && bash scripts/dev.sh

# Start frontend (Astro)
pnpm web:dev
# Or: cd apps/web && pnpm dev

# Run database migrations
pnpm backend:migrate

# Seed sample plugins
pnpm backend:seed-plugins
# Or: node apps/backend/scripts/seed-plugins.js

# Reset admin password
PB_ADMIN_PASSWORD="newpassword" node apps/backend/scripts/reset-admin.js
```

### Production Deployment (On Server)

```bash
# SSH into server
ssh root@107.174.42.198

# Navigate to project
cd /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn

# Deploy backend (Docker)
cd apps/backend && ./deploy.sh

# View logs
docker logs -f pocketbase-cn

# Check health
curl https://api.pocketbase.cn/api/health
```

### Database Operations

```bash
# On server, enter container shell
docker exec -it pocketbase-cn sh

# Inside container, run PocketBase CLI
./pocketbase migrate up
./pocketbase migrate status
```

## Environment Variables

### Backend (`apps/backend/deploy/.env`)

```bash
# Required
PB_CSRF_SECRET=                    # 32+ character random string
PUBLIC_SITE_URL=https://pocketbase.cn
PB_CORS_ORIGINS=https://pocketbase.cn,https://www.pocketbase.cn

# Optional (but recommended)
GITHUB_TOKEN=                      # GitHub API token (rate limit)
RESEND_API_KEY=                    # Email service
ALERT_WEBHOOK_URL=                 # Discord/Slack alerts
GITHUB_WEBHOOK_TOKEN=              # GitHub webhook verification

# R2 Backup
LITESTREAM_BUCKET=pocketbase-cn-backups
PB_S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
LITESTREAM_ACCESS_KEY_ID=
LITESTREAM_SECRET_ACCESS_KEY=
```

### Frontend (`apps/web/env.mjs`)

```javascript
export const PUBLIC_SITE_URL = "https://pocketbase.cn";
export const PUBLIC_POCKETBASE_URL = "http://127.0.0.1:8090";  // local
export const PUBLIC_POCKETBASE_URL = "https://api.pocketbase.cn"; // prod
```

## Database Schema

### Collections

| Collection      | Type    | Description                    |
| --------------- | ------- | ------------------------------ |
| `users`         | auth    | User accounts (GitHub OAuth)    |
| `plugins`       | base    | Plugin marketplace listings     |
| `plugin_stats`  | base    | Download/view statistics        |
| `plugin_versions` | base  | Version history                 |
| `showcase`      | base    | Community project gallery       |
| `mirrors`       | base    | Download mirror configuration   |
| `newsletter`    | base    | Email subscriptions             |

See `docs/SCHEMA.md` for detailed schema documentation.

## Admin Credentials

### Initial Setup

```bash
# Create/reset admin account
cd /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn
PB_ADMIN_EMAIL="admin@pocketbase.cn" \
PB_ADMIN_PASSWORD="your_secure_password" \
node apps/backend/scripts/reset-admin.js
```

### Admin UI Access

- URL: `https://admin.pocketbase.cn/_/`
- Email: `admin@pocketbase.cn` (or whatever was set)
- Password: (set during initial setup)

### Admin Password Reset

```bash
# On server, via script
docker exec -it pocketbase-cn sh
./pocketbase admin reset
```

Or via the API script:

```bash
PB_ADMIN_PASSWORD="newpassword" node apps/backend/scripts/reset-admin.js
```

## API Endpoints

| Method | Endpoint                      | Purpose                     |
| ------ | ----------------------------- | --------------------------- |
| GET    | `/api/health`                 | Health check                |
| GET    | `/api/health/backup`          | Backup status (Litestream)  |
| GET    | `/api/ready`                  | Readiness check             |
| POST   | `/api/admin/rate-limits/cleanup` | Clean expired rate limits |
| GET    | `/api/search/fts`             | Full-text search            |

## CI/CD Workflows

### GitHub Actions

| Workflow                    | Trigger                          | Purpose              |
| --------------------------- | -------------------------------- | -------------------- |
| `deploy.yml`                | Push to main                     | Deploy frontend      |
| `backend-deploy.yml`        | Push to main (backend changes)   | Deploy backend       |
| `backend-staging.yml`       | Push to develop                  | Deploy staging       |
| `health-monitor.yml`        | Every 5 minutes (cron)           | Health checks        |
| `backup-r2.yml`             | Daily 2 AM UTC (cron)            | Database backups     |
| `security-scan.yml`         | Push, PR, daily                  | Security scanning    |

## Backup & Recovery

### Database Backups

1. **Litestream** (continuous replication to R2)
   - Syncs every 1 second
   - 72-hour retention

2. **Daily snapshots** (cron job)
   - Runs at 2 AM UTC
   - 30-day retention

### Manual Backup

```bash
# On server
cd /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn
./apps/backend/backup.sh
```

### Restore from Backup

See `docs/DEPLOYMENT.md` for detailed recovery procedures.

## Security Checklist

- [x] No hardcoded secrets in code
- [x] `.gitignore` excludes `.env`, `pb_data/`, `bin/`
- [x] CSRF protection enabled
- [x] Rate limiting on public endpoints
- [x] GitHub webhook token validation
- [x] CORS configured for allowed origins only
- [x] Admin UI restricted to IP whitelist (optional)

## Monitoring

### Health Checks

```bash
# API health
curl https://api.pocketbase.cn/api/health

# Backup status
curl https://api.pocketbase.cn/api/health/backup

# Container status
docker ps | grep pocketbase
```

### Logs

```bash
# Container logs
docker logs -f pocketbase-cn

# Caddy logs (reverse proxy)
tail -f /var/log/caddy/api.pocketbase.cn.log
```

### Monitoring Script

```bash
./apps/backend/monitor.sh
```

Outputs warnings for:
- Backup staleness
- Disk usage >80%
- Service down

## Deployment Procedure

### Backend

1. Push code to `main` branch
2. GitHub Action `backend-deploy.yml` runs automatically
3. Or manually run on server:

```bash
cd /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn/apps/backend
./deploy.sh
```

### Frontend

1. Push code to `main` branch
2. GitHub Action `deploy.yml` builds and deploys to Cloudflare Pages
3. Or manually:

```bash
cd apps/web
pnpm build
# Deploy dist/ via wrangler or Cloudflare dashboard
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs pocketbase-cn

# Check disk space
df -h

# Check network
docker network inspect nginx-proxy_default
```

### Database locked

```bash
# Stop container
docker stop pocketbase-cn

# Check for lock files
ls -la apps/backend/pb_data/

# Remove lock files (cautiously)
rm apps/backend/pb_data/*.lock
```

### Migration fails

```bash
# Check migration status
docker exec -it pocketbase-cn ./pocketbase migrate status

# Manually apply pending migrations
docker exec -it pocketbase-cn ./pocketbase migrate up
```

## Related Documentation

- `AGENTS.md` - AI agent guidelines
- `docs/DEPLOYMENT.md` - Full deployment guide
- `docs/SCHEMA.md` - Database schema reference
- `docs/BACKEND.md` - Backend architecture
- `docs/FRONTEND.md` - Frontend architecture
- `DEPLOYMENT_SUMMARY.md` - Recent deployment changes

## VPS Server Context

This project is part of the larger VPS infrastructure at `107.174.42.198`. See parent server documentation:

```
/Volumes/SSD/skills/server-ops/vps/107.174.42.198/CLAUDE.md
```

For network templates, Docker standards, and emergency procedures, refer to the server-level documentation.
