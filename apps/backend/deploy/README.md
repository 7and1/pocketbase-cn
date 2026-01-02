# Backend Deployment Templates

These files are executable templates for deploying `apps/backend/` to an Ubuntu/VPS server.

## Directory Structure

### Systemd Services

- `systemd/pocketbase.service` - Production PocketBase service (listens on `127.0.0.1:8090`)
- `systemd/pocketbase-staging.service` - Staging PocketBase service (listens on `127.0.0.1:8091`)
- `systemd/litestream.service` - Litestream backup service for production
- `systemd/litestream-staging.service` - Litestream backup service for staging

### Configuration Files

- `litestream.yml` - Litestream configuration for production (R2/S3)
- `litestream-staging.yml` - Litestream configuration for staging
- `../.env.example` - Production environment variables template
- `staging.env.example` - Staging environment variables template

### Deployment Scripts

- `scripts/deploy.sh` - Local deployment script (run on server)
- `scripts/deploy-remote.sh` - Remote deployment script (run from CI/CD)
- `scripts/backup-manual.sh` - Create manual backup archive
- `scripts/restore-manual.sh` - Restore from manual backup archive
- `scripts/backup-to-r2.sh` - Upload backup to R2 storage
- `scripts/health-check.sh` - Run health checks against the API

## CI/CD Workflows

The following GitHub Actions workflows are available:

### `.github/workflows/backend-deploy.yml`

**Production Deployment Workflow**

Triggers:

- Push to `main` branch (backend changes only)
- Manual workflow dispatch

Stages:

1. **Security Scan** - NPM audit with high/critical severity check
2. **Test** - Run migrations and smoke tests
3. **Deploy** - Deploy to production via SSH
4. **Health Check** - Verify deployment health

Required Secrets:

```yaml
PRODUCTION_SSH_HOST        # VPS hostname
PRODUCTION_SSH_PORT        # SSH port (default: 22)
PRODUCTION_SSH_USER        # SSH username
PRODUCTION_SSH_KEY         # SSH private key
PRODUCTION_URL             # https://pocketbase.cn
ALERT_WEBHOOK_URL          # Optional: Discord/Slack webhook
```

### `.github/workflows/backend-staging.yml`

**Staging Deployment Workflow**

Triggers:

- Push to `develop` branch
- Pull requests to `main`
- Manual workflow dispatch

Stages:

1. **Test** - Run migrations and smoke tests
2. **Deploy** - Deploy to staging environment
3. **Health Check** - Verify staging health

Required Secrets:

```yaml
STAGING_SSH_HOST           # VPS hostname
STAGING_SSH_PORT           # SSH port (default: 22)
STAGING_SSH_USER           # SSH username
STAGING_SSH_KEY            # SSH private key
STAGING_URL                # https://staging.pocketbase.cn
```

### `.github/workflows/health-monitor.yml`

**Health Monitoring Workflow**

Triggers:

- Every 5 minutes via cron
- Manual workflow dispatch

Checks:

- `/api/live` endpoint
- `/api/ready` endpoint
- Response time monitoring
- Alert on failure

### `.github/workflows/backup-r2.yml`

**Database Backup Workflow**

Triggers:

- Daily at 2 AM UTC
- Manual workflow dispatch with environment selection

Features:

- Creates compressed backup of `pb_data`
- Uploads to Cloudflare R2
- Keeps 30 days of backups
- Cleanup of old backups

Required Secrets:

```yaml
R2_ACCOUNT_ID              # Cloudflare Account ID
R2_ACCESS_KEY_ID           # R2 Access Key ID
R2_SECRET_ACCESS_KEY       # R2 Secret Access Key
R2_BACKUP_BUCKET           # Bucket name
R2_ENDPOINT                # R2 endpoint URL
```

### `.github/workflows/backup-restore-test.yml`

**Backup Restore Test Workflow**

Triggers:

- Weekly on Sundays at 3 AM UTC
- Manual workflow dispatch

Features:

- Downloads latest backup from R2
- Validates archive integrity
- Restores to test environment
- Runs smoke tests on restored data

### `.github/workflows/security-scan.yml`

**Security Scanning Workflow**

Triggers:

- Push to any branch
- Pull requests
- Daily at 4 AM UTC

Scans:

- NPM audit (fails on high/critical)
- Dependency outdated check
- License compliance check
- CodeQL analysis
- TruffleHog secrets scan

## Setup Instructions

### Initial Server Setup

1. **Create user and directories:**

```bash
sudo useradd -r -s /bin/false pocketbase
sudo mkdir -p /opt/pocketbase
sudo mkdir -p /opt/pocketbase-staging
sudo chown -R pocketbase:pocketbase /opt/pocketbase
sudo chown -R pocketbase:pocketbase /opt/pocketbase-staging
```

2. **Clone repository:**

```bash
sudo -u pocketbase git clone <repo-url> /opt/pocketbase.deploy.repo
```

3. **Configure environment:**

```bash
# Production
cp apps/backend/.env.example /opt/pocketbase/.env
nano /opt/pocketbase/.env

# Staging
cp apps/backend/deploy/staging.env.example /opt/pocketbase-staging/.env
nano /opt/pocketbase-staging/.env
```

4. **Install systemd services:**

```bash
# Production
cp apps/backend/deploy/systemd/pocketbase.service /etc/systemd/system/
cp apps/backend/deploy/systemd/litestream.service /etc/systemd/system/

# Staging
cp apps/backend/deploy/systemd/pocketbase-staging.service /etc/systemd/system/
cp apps/backend/deploy/systemd/litestream-staging.service /etc/systemd/system/

# Enable and start
systemctl daemon-reload
systemctl enable pocketbase pocketbase-staging
systemctl start pocketbase pocketbase-staging
```

5. **Setup reverse proxy (Nginx example):**

```nginx
server {
    listen 443 ssl http2;
    server_name pocketbase.cn;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name staging.pocketbase.cn;

    # Same SSL config as above
    # ...

    location / {
        proxy_pass http://127.0.0.1:8091;
        # Same proxy headers as above
    }
}
```

### GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

#### Production Secrets

| Secret Name           | Description               |
| --------------------- | ------------------------- |
| `PRODUCTION_SSH_HOST` | VPS hostname or IP        |
| `PRODUCTION_SSH_PORT` | SSH port (default: 22)    |
| `PRODUCTION_SSH_USER` | SSH username (e.g., root) |
| `PRODUCTION_SSH_KEY`  | SSH private key           |
| `PRODUCTION_URL`      | https://pocketbase.cn     |

#### Staging Secrets

| Secret Name        | Description                   |
| ------------------ | ----------------------------- |
| `STAGING_SSH_HOST` | VPS hostname or IP            |
| `STAGING_SSH_PORT` | SSH port (default: 22)        |
| `STAGING_SSH_USER` | SSH username (e.g., root)     |
| `STAGING_SSH_KEY`  | SSH private key               |
| `STAGING_URL`      | https://staging.pocketbase.cn |

#### R2 Backup Secrets

| Secret Name            | Description                            |
| ---------------------- | -------------------------------------- |
| `R2_ACCOUNT_ID`        | Cloudflare Account ID                  |
| `R2_ACCESS_KEY_ID`     | R2 API Token Access Key ID             |
| `R2_SECRET_ACCESS_KEY` | R2 API Token Secret Access Key         |
| `R2_BACKUP_BUCKET`     | Bucket name (e.g., pocketbase-backups) |
| `R2_ENDPOINT`          | R2 endpoint URL                        |

#### Alert Secrets (Optional)

| Secret Name         | Description               |
| ------------------- | ------------------------- |
| `ALERT_WEBHOOK_URL` | Discord/Slack webhook URL |

## Manual Deployment

To deploy manually from the server:

```bash
# Production
sudo /opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/deploy.sh production

# Staging
sudo /opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/deploy.sh staging
```

## Manual Backup

```bash
# Create backup archive
sudo /opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/backup-manual.sh

# Upload to R2
sudo /opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/backup-to-r2.sh production

# Restore from backup
sudo /opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/restore-manual.sh /path/to/backup.tar.gz
```

## Health Check

```bash
# Production
/opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/health-check.sh production

# Staging
/opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/health-check.sh staging

# Custom URL
/opt/pocketbase.deploy.repo/apps/backend/deploy/scripts/health-check.sh production https://pocketbase.cn
```

## Notes

- Staging uses port 8091 to avoid conflicts with production (8090)
- Both environments use the same VPS with separate data directories
- Litestream provides continuous backup to R2
- Daily backups provide additional restore points
- Health checks run every 5 minutes
- Security scans run daily and on every push
