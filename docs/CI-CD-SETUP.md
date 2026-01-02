# PocketBase.cn CI/CD Setup

This document provides an overview of the complete CI/CD pipeline for PocketBase.cn.

## Overview

The CI/CD pipeline consists of the following workflows:

1. **Backend Deploy** (`backend-deploy.yml`) - Production deployment
2. **Backend Staging** (`backend-staging.yml`) - Staging deployment
3. **Health Monitor** (`health-monitor.yml`) - Continuous health monitoring
4. **Backup R2** (`backup-r2.yml`) - Daily database backups to R2
5. **Backup Restore Test** (`backup-restore-test.yml`) - Weekly backup verification
6. **Security Scan** (`security-scan.yml`) - Automated security scanning

## Workflow Files

### GitHub Actions Workflows

| File                                        | Purpose               | Triggers                     |
| ------------------------------------------- | --------------------- | ---------------------------- |
| `.github/workflows/backend-deploy.yml`      | Production deployment | Push to main (backend paths) |
| `.github/workflows/backend-staging.yml`     | Staging deployment    | Push to develop, PR to main  |
| `.github/workflows/health-monitor.yml`      | Health monitoring     | Every 5 minutes              |
| `.github/workflows/backup-r2.yml`           | Database backup       | Daily at 2 AM UTC            |
| `.github/workflows/backup-restore-test.yml` | Backup verification   | Weekly on Sundays            |
| `.github/workflows/security-scan.yml`       | Security scanning     | On push, PR, daily           |

### Deployment Scripts

| File                | Purpose                  | Location    |
| ------------------- | ------------------------ | ----------- |
| `deploy.sh`         | Local deployment script  | Server-side |
| `deploy-remote.sh`  | Remote deployment script | CI/CD       |
| `backup-to-r2.sh`   | Upload backup to R2      | Server-side |
| `health-check.sh`   | Run health checks        | Anywhere    |
| `backup-manual.sh`  | Manual backup archive    | Server-side |
| `restore-manual.sh` | Restore from backup      | Server-side |

### Systemd Services

| File                         | Purpose                        |
| ---------------------------- | ------------------------------ |
| `pocketbase.service`         | Production service (port 8090) |
| `pocketbase-staging.service` | Staging service (port 8091)    |
| `litestream.service`         | Production backup service      |
| `litestream-staging.service` | Staging backup service         |

### Configuration Files

| File                     | Purpose                      |
| ------------------------ | ---------------------------- |
| `litestream.yml`         | Production R2 backup config  |
| `litestream-staging.yml` | Staging R2 backup config     |
| `staging.env.example`    | Staging environment template |

## Quick Start

### 1. Configure GitHub Secrets

See `.github/SECRETS.md` for the complete list of required secrets.

### 2. Initial Server Setup

```bash
# Create user and directories
sudo useradd -r -s /bin/false pocketbase
sudo mkdir -p /opt/pocketbase /opt/pocketbase-staging
sudo chown -R pocketbase:pocketbase /opt/pocketbase /opt/pocketbase-staging

# Clone repository
sudo -u pocketbase git clone <repo-url> /opt/pocketbase.deploy.repo

# Configure environment
cp /opt/pocketbase.deploy.repo/apps/backend/.env.example /opt/pocketbase/.env
cp /opt/pocketbase.deploy.repo/apps/backend/deploy/staging.env.example /opt/pocketbase-staging/.env

# Edit with actual values
nano /opt/pocketbase/.env
nano /opt/pocketbase-staging/.env

# Install systemd services
sudo cp /opt/pocketbase.deploy.repo/apps/backend/deploy/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pocketbase pocketbase-staging
sudo systemctl start pocketbase pocketbase-staging
```

### 3. Test Deployment

```bash
# Manual deployment to staging
sudo /opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/deploy.sh staging

# Check health
/opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/health-check.sh staging
```

### 4. Push to Trigger CI/CD

```bash
# Merge to main triggers production deployment
git checkout main
git merge develop
git push origin main
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  GitHub Actions │
│   (main/dev)    │     │     (CI/CD)     │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌───────────────┐         ┌───────────────┐
            │   Production  │         │    Staging    │
            │   :8090       │         │    :8091      │
            │  /opt/pocket- │         │ /opt/pocket-  │
            │     base/     │         │  base-staging/│
            └───────┬───────┘         └───────┬───────┘
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                        ┌─────────────────┐
                        │  Cloudflare R2  │
                        │   (Backups)     │
                        └─────────────────┘
```

## Monitoring

- **Health checks**: Every 5 minutes via `health-monitor.yml`
- **Backups**: Daily at 2 AM UTC via `backup-r2.yml`
- **Backup tests**: Weekly on Sundays via `backup-restore-test.yml`
- **Security scans**: Daily at 4 AM UTC via `security-scan.yml`

## Troubleshooting

### Deployment Failed

1. Check workflow logs in GitHub Actions
2. Verify SSH credentials are correct
3. Ensure systemd service files are installed
4. Check service logs: `journalctl -u pocketbase -n 50`

### Health Check Failed

1. Check if service is running: `systemctl status pocketbase`
2. Check service logs: `journalctl -u pocketbase -f`
3. Verify port is accessible: `curl http://127.0.0.1:8090/api/live`

### Backup Failed

1. Verify R2 credentials in `.env`
2. Check R2 bucket exists
3. Ensure sufficient disk space for backup archive

## Documentation

- `apps/backend/deploy/README.md` - Detailed deployment documentation
- `.github/SECRETS.md` - GitHub secrets reference
- `docs/DEPLOYMENT.md` - General deployment guide
