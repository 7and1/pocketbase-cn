# PocketBase.cn Deployment Guide

Production deployment documentation for PocketBase.cn - a Chinese documentation and community site for PocketBase.

---

## Table of Contents

1. [Infrastructure Overview](#1-infrastructure-overview)
2. [VPS Setup](#2-vps-setup)
3. [PocketBase Deployment](#3-pocketbase-deployment)
4. [Cloudflare Pages Setup](#4-cloudflare-pages-setup)
5. [R2 Storage Setup](#5-r2-storage-setup)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Backup Strategy](#7-backup-strategy)
8. [Monitoring & Alerts](#8-monitoring--alerts)
9. [Rollback Procedures](#9-rollback-procedures)

---

## 1. Infrastructure Overview

### Architecture Diagram

```
                                    +------------------+
                                    |   Cloudflare     |
                                    |   DNS & CDN      |
                                    +--------+---------+
                                             |
                    +------------------------+------------------------+
                    |                        |                        |
                    v                        v                        v
          +-----------------+      +-----------------+      +-----------------+
          | Cloudflare      |      |    VPS          |      | Cloudflare R2   |
          | Pages           |      |  (Ubuntu 22.04) |      | Object Storage  |
          |                 |      |                 |      |                 |
          | +-------------+ |      | +-------------+ |      | +-------------+ |
          | | Astro SSR   | |      | | Caddy       | |      | | Assets      | |
          | | Frontend    | |<---->| | Reverse     | |      | | Backups     | |
          | +-------------+ |      | | Proxy       | |      | | Uploads     | |
          |                 |      | +------+------+ |      | +-------------+ |
          +-----------------+      |        |        |      +-----------------+
                                   | +------v------+ |              ^
                                   | | PocketBase  | |              |
                                   | | Backend     +-+--------------+
                                   | +------+------+ |     Litestream
                                   |        |        |     Replication
                                   | +------v------+ |
                                   | | SQLite DB   | |
                                   | +-------------+ |
                                   +-----------------+

    Users --> Cloudflare DNS --> Pages (Frontend) / VPS (API)
```

### Domain Configuration

| Domain                | Purpose             | Target           |
| --------------------- | ------------------- | ---------------- |
| `pocketbase.cn`       | Main website        | Cloudflare Pages |
| `www.pocketbase.cn`   | Redirect to apex    | Cloudflare Pages |
| `api.pocketbase.cn`   | PocketBase API      | VPS IP           |
| `admin.pocketbase.cn` | PocketBase Admin UI | VPS IP           |

### DNS Settings (Cloudflare)

```
# A Records
api.pocketbase.cn      A     <VPS_IP>      Proxied (Orange Cloud)
admin.pocketbase.cn    A     <VPS_IP>      Proxied (Orange Cloud)

# CNAME Records (Pages)
pocketbase.cn          CNAME  pocketbase-cn.pages.dev    Proxied
www.pocketbase.cn      CNAME  pocketbase.cn              Proxied

# MX Records (if using email)
pocketbase.cn          MX    10 mx1.email-provider.com
pocketbase.cn          MX    20 mx2.email-provider.com

# TXT Records
pocketbase.cn          TXT   "v=spf1 include:_spf.email-provider.com ~all"
_dmarc.pocketbase.cn   TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@pocketbase.cn"
```

### Cloudflare Settings

```yaml
# SSL/TLS
SSL Mode: Full (Strict)
Minimum TLS Version: TLS 1.2
Always Use HTTPS: Enabled
Automatic HTTPS Rewrites: Enabled

# Security
Security Level: Medium
Challenge Passage: 30 minutes
Browser Integrity Check: Enabled

# Performance
Auto Minify: HTML, CSS, JS
Brotli: Enabled
Early Hints: Enabled
HTTP/3 (QUIC): Enabled

# Caching
Browser Cache TTL: 4 hours
Cache Level: Standard
```

---

## 2. VPS Setup

### Server Requirements

| Component | Minimum          | Recommended      |
| --------- | ---------------- | ---------------- |
| CPU       | 1 vCPU           | 2 vCPU           |
| RAM       | 1 GB             | 2 GB             |
| Storage   | 20 GB SSD        | 40 GB NVMe       |
| Network   | 1 Gbps           | 1 Gbps           |
| OS        | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Initial Server Setup

```bash
#!/bin/bash
# initial-setup.sh - Run as root on fresh Ubuntu 22.04

set -e

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y \
    curl \
    wget \
    git \
    unzip \
    ufw \
    fail2ban \
    htop \
    ncdu \
    tmux \
    jq

# Create application user
useradd -m -s /bin/bash pocketbase
usermod -aG sudo pocketbase

# Set timezone
timedatectl set-timezone Asia/Shanghai

# Configure automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### Security Hardening

#### SSH Configuration

```bash
# /etc/ssh/sshd_config.d/hardening.conf

Port 22022
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3
LoginGraceTime 20
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitEmptyPasswords no

# Allow only specific user
AllowUsers pocketbase
```

```bash
# Apply SSH changes
sudo systemctl restart sshd
```

#### Firewall (UFW)

```bash
#!/bin/bash
# firewall-setup.sh

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (custom port)
ufw allow 22022/tcp comment 'SSH'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable UFW
ufw --force enable

# Check status
ufw status verbose
```

#### Fail2Ban Configuration

```ini
# /etc/fail2ban/jail.local

[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = 22022
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Caddy Installation & Configuration

```bash
# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
```

#### Caddyfile

```caddyfile
# /etc/caddy/Caddyfile

{
    email admin@pocketbase.cn
    acme_ca https://acme-v02.api.letsencrypt.org/directory

    servers {
        protocols h1 h2 h3
    }

    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
    }
}

# API endpoint
api.pocketbase.cn {
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Rate limiting
    rate_limit {
        zone api_zone {
            key {remote_host}
            events 100
            window 1m
        }
    }

    # CORS for frontend
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header Access-Control-Allow-Origin "https://pocketbase.cn"
        header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With"
        header Access-Control-Max-Age "86400"
        respond "" 204
    }

    # Proxy to PocketBase
    reverse_proxy localhost:8090 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}

        # Health checks
        health_uri /api/health
        health_interval 30s
        health_timeout 5s
    }

    # Access logs
    log {
        output file /var/log/caddy/api.pocketbase.cn.log
        format json
    }
}

# Admin panel (restricted access)
admin.pocketbase.cn {
    # IP whitelist (optional - add your IPs)
    # @blocked not remote_ip 1.2.3.4 5.6.7.8
    # abort @blocked

    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        -Server
    }

    reverse_proxy localhost:8090 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    log {
        output file /var/log/caddy/admin.pocketbase.cn.log
        format json
    }
}
```

```bash
# Validate and reload Caddy
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

---

## 3. PocketBase Deployment

### Directory Structure

```
/opt/pocketbase/
├── pocketbase              # Binary
├── pb_data/                # Database & uploads
│   ├── data.db             # SQLite database
│   ├── logs.db             # Logs database
│   └── storage/            # File uploads
├── pb_migrations/          # Database migrations
├── pb_hooks/               # JavaScript hooks (optional)
├── .env                    # Environment variables
└── backups/                # Local backup directory
```

### Installation Script

```bash
#!/bin/bash
# install-pocketbase.sh

set -e

POCKETBASE_VERSION="0.22.27"
INSTALL_DIR="/opt/pocketbase"

# Create directory
mkdir -p ${INSTALL_DIR}
cd ${INSTALL_DIR}

# Download PocketBase
wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
unzip -o "pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
rm "pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"

# Set permissions
chmod +x pocketbase
chown -R pocketbase:pocketbase ${INSTALL_DIR}

# Create data directories
mkdir -p pb_data pb_migrations pb_hooks backups

echo "PocketBase ${POCKETBASE_VERSION} installed to ${INSTALL_DIR}"
```

### Environment Variables

```bash
# /opt/pocketbase/.env

# Application
PB_ENCRYPTION_KEY=your-32-character-encryption-key
PB_DATA_DIR=/opt/pocketbase/pb_data

# SMTP Configuration
PB_SMTP_HOST=smtp.resend.com
PB_SMTP_PORT=587
PB_SMTP_USERNAME=resend
PB_SMTP_PASSWORD=re_xxxxxxxxxxxx
PB_SMTP_FROM=noreply@pocketbase.cn

# S3 Storage (Cloudflare R2)
PB_S3_ENABLED=true
PB_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
PB_S3_BUCKET=pocketbase-cn-uploads
PB_S3_REGION=auto
PB_S3_ACCESS_KEY=your-r2-access-key
PB_S3_SECRET_KEY=your-r2-secret-key

# Backup
LITESTREAM_ACCESS_KEY_ID=your-r2-access-key
LITESTREAM_SECRET_ACCESS_KEY=your-r2-secret-key
```

### Systemd Service

```ini
# /etc/systemd/system/pocketbase.service

[Unit]
Description=PocketBase Backend Service
Documentation=https://pocketbase.io/docs
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=pocketbase
Group=pocketbase
WorkingDirectory=/opt/pocketbase

# Environment
EnvironmentFile=/opt/pocketbase/.env

# Start command
ExecStart=/opt/pocketbase/pocketbase serve \
    --http=127.0.0.1:8090 \
    --dir=/opt/pocketbase/pb_data \
    --migrationsDir=/opt/pocketbase/pb_migrations \
    --hooksDir=/opt/pocketbase/pb_hooks \
    --encryptionEnv=PB_ENCRYPTION_KEY

# Restart policy
Restart=always
RestartSec=5
StartLimitInterval=60
StartLimitBurst=3

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/pocketbase/pb_data /opt/pocketbase/backups

# Resource limits
LimitNOFILE=65535
MemoryMax=1G

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=pocketbase

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
systemctl daemon-reload
systemctl enable pocketbase
systemctl start pocketbase
systemctl status pocketbase
```

### Log Configuration

```bash
# /etc/rsyslog.d/pocketbase.conf
if $programname == 'pocketbase' then /var/log/pocketbase/pocketbase.log
& stop
```

```bash
# /etc/logrotate.d/pocketbase
/var/log/pocketbase/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 pocketbase pocketbase
    sharedscripts
    postrotate
        systemctl kill -s HUP rsyslog.service >/dev/null 2>&1 || true
    endscript
}
```

---

## 4. Cloudflare Pages Setup

### Project Connection

1. Go to Cloudflare Dashboard > Pages
2. Click "Create a project" > "Connect to Git"
3. Select your GitHub repository
4. Configure build settings:

### Build Configuration

```yaml
# Build settings in Cloudflare Pages

Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: / (or /frontend if monorepo)
```

### wrangler.toml (for local development)

```toml
# wrangler.toml

name = "pocketbase-cn"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

# Environment variables (non-sensitive)
[vars]
PUBLIC_SITE_URL = "https://pocketbase.cn"
PUBLIC_API_URL = "https://api.pocketbase.cn"

# Production environment
[env.production]
name = "pocketbase-cn"
routes = [
    { pattern = "pocketbase.cn/*", zone_name = "pocketbase.cn" },
    { pattern = "www.pocketbase.cn/*", zone_name = "pocketbase.cn" }
]

[env.production.vars]
PUBLIC_SITE_URL = "https://pocketbase.cn"
PUBLIC_API_URL = "https://api.pocketbase.cn"

# Preview/Staging environment
[env.preview]
name = "pocketbase-cn-preview"

[env.preview.vars]
PUBLIC_SITE_URL = "https://preview.pocketbase-cn.pages.dev"
PUBLIC_API_URL = "https://api.pocketbase.cn"
```

### Environment Variables (Cloudflare Dashboard)

```bash
# Production Environment Variables

# Public (exposed to client)
PUBLIC_SITE_URL=https://pocketbase.cn
PUBLIC_API_URL=https://api.pocketbase.cn
PUBLIC_GA_ID=G-XXXXXXXXXX

# Secret (server-side only)
POCKETBASE_ADMIN_EMAIL=admin@pocketbase.cn
POCKETBASE_ADMIN_PASSWORD=<encrypted-secret>
```

### Custom Domain Setup

1. Go to Pages project > Custom domains
2. Add domain: `pocketbase.cn`
3. Add domain: `www.pocketbase.cn`
4. Cloudflare will auto-configure DNS if using Cloudflare DNS
5. SSL certificate provisioned automatically

### Astro Configuration for Cloudflare

```javascript
// astro.config.mjs

import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    mode: "directory",
    functionPerRoute: true,
    runtime: {
      mode: "local",
      type: "pages",
    },
  }),
  integrations: [tailwind()],
  site: "https://pocketbase.cn",
  vite: {
    define: {
      "import.meta.env.PUBLIC_API_URL": JSON.stringify(
        process.env.PUBLIC_API_URL || "https://api.pocketbase.cn",
      ),
    },
  },
});
```

### \_headers file (static headers)

```
# public/_headers

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
```

### \_redirects file

```
# public/_redirects

# WWW redirect
https://www.pocketbase.cn/* https://pocketbase.cn/:splat 301

# Old URL redirects (examples)
/docs/old-page /docs/new-page 301
/blog/* /articles/:splat 301
```

---

## 5. R2 Storage Setup

### Create R2 Bucket

```bash
# Using Wrangler CLI

# Login to Cloudflare
wrangler login

# Create buckets
wrangler r2 bucket create pocketbase-cn-uploads
wrangler r2 bucket create pocketbase-cn-backups

# List buckets
wrangler r2 bucket list
```

### R2 API Credentials

1. Go to Cloudflare Dashboard > R2 > Manage R2 API Tokens
2. Create API token with:
   - Permission: Object Read & Write
   - Specify bucket: `pocketbase-cn-uploads`, `pocketbase-cn-backups`
3. Save Access Key ID and Secret Access Key

### CORS Configuration

```json
// cors-config.json for pocketbase-cn-uploads bucket

[
  {
    "AllowedOrigins": [
      "https://pocketbase.cn",
      "https://api.pocketbase.cn",
      "https://admin.pocketbase.cn"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "Authorization",
      "X-Requested-With"
    ],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

```bash
# Apply CORS configuration
wrangler r2 bucket cors put pocketbase-cn-uploads --config cors-config.json
```

### Public Access Configuration

```bash
# Enable public access for uploads bucket via custom domain

# 1. In Cloudflare Dashboard > R2 > pocketbase-cn-uploads
# 2. Settings > Public access > Custom domain
# 3. Add: assets.pocketbase.cn

# DNS record will be auto-created:
# assets.pocketbase.cn  CNAME  <bucket-public-url>
```

### PocketBase S3 Configuration

Configure in PocketBase Admin UI (Settings > Files storage):

```
S3 Endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3 Bucket: pocketbase-cn-uploads
S3 Region: auto
S3 Access Key: <R2_ACCESS_KEY>
S3 Secret: <R2_SECRET_KEY>
Force Path Style: true
```

---

## 6. CI/CD Pipeline

### GitHub Repository Structure

```
pocketbase-cn/
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       ├── deploy-backend.yml
│       └── backup.yml
├── frontend/           # Astro project
├── backend/
│   ├── migrations/     # PocketBase migrations
│   └── hooks/          # PocketBase hooks
├── infrastructure/
│   ├── caddy/
│   └── systemd/
└── scripts/
    ├── deploy.sh
    └── rollback.sh
```

### GitHub Secrets Configuration

```
# Repository Settings > Secrets and variables > Actions

# VPS Deployment
VPS_HOST=<your-vps-ip>
VPS_SSH_PORT=22022
VPS_SSH_USER=pocketbase
VPS_SSH_KEY=<private-key-content>

# Cloudflare
CLOUDFLARE_API_TOKEN=<cf-api-token>
CLOUDFLARE_ACCOUNT_ID=<cf-account-id>

# R2 Storage
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>

# Application
POCKETBASE_ADMIN_EMAIL=admin@pocketbase.cn
POCKETBASE_ADMIN_PASSWORD=<admin-password>
```

### Frontend Deployment Workflow

```yaml
# .github/workflows/deploy-frontend.yml

name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy-frontend.yml"
  workflow_dispatch:

env:
  NODE_VERSION: "20"

jobs:
  deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          PUBLIC_SITE_URL: https://pocketbase.cn
          PUBLIC_API_URL: https://api.pocketbase.cn

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/dist --project-name=pocketbase-cn

      - name: Notify deployment
        if: success()
        run: |
          echo "Frontend deployed successfully!"
          echo "URL: https://pocketbase.cn"
```

### Backend Deployment Workflow

```yaml
# .github/workflows/deploy-backend.yml

name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - "infrastructure/**"
      - ".github/workflows/deploy-backend.yml"
  workflow_dispatch:
    inputs:
      pocketbase_version:
        description: "PocketBase version to deploy"
        required: false
        default: "latest"

env:
  DEPLOY_PATH: /opt/pocketbase

jobs:
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -p ${{ secrets.VPS_SSH_PORT }} ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

      - name: Get PocketBase version
        id: version
        run: |
          if [ "${{ github.event.inputs.pocketbase_version }}" = "latest" ] || [ -z "${{ github.event.inputs.pocketbase_version }}" ]; then
            VERSION=$(curl -s https://api.github.com/repos/pocketbase/pocketbase/releases/latest | jq -r .tag_name | sed 's/v//')
          else
            VERSION="${{ github.event.inputs.pocketbase_version }}"
          fi
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Create deployment package
        run: |
          mkdir -p deploy
          cp -r backend/migrations deploy/pb_migrations
          cp -r backend/hooks deploy/pb_hooks
          tar -czf deploy.tar.gz deploy/

      - name: Upload to VPS
        run: |
          scp -P ${{ secrets.VPS_SSH_PORT }} \
              -i ~/.ssh/deploy_key \
              deploy.tar.gz \
              ${{ secrets.VPS_SSH_USER }}@${{ secrets.VPS_HOST }}:/tmp/

      - name: Deploy on VPS
        run: |
          ssh -p ${{ secrets.VPS_SSH_PORT }} \
              -i ~/.ssh/deploy_key \
              ${{ secrets.VPS_SSH_USER }}@${{ secrets.VPS_HOST }} << 'ENDSSH'

          set -e

          # Variables
          DEPLOY_PATH=/opt/pocketbase
          BACKUP_PATH=/opt/pocketbase/backups
          VERSION=${{ steps.version.outputs.version }}
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)

          # Create backup
          echo "Creating backup..."
          sudo systemctl stop pocketbase || true
          cp ${DEPLOY_PATH}/pocketbase ${BACKUP_PATH}/pocketbase_${TIMESTAMP} || true

          # Extract deployment package
          cd /tmp
          tar -xzf deploy.tar.gz

          # Update PocketBase binary if version changed
          CURRENT_VERSION=$(${DEPLOY_PATH}/pocketbase --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' || echo "0.0.0")
          if [ "$VERSION" != "$CURRENT_VERSION" ]; then
            echo "Updating PocketBase from $CURRENT_VERSION to $VERSION..."
            wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_linux_amd64.zip"
            unzip -o "pocketbase_${VERSION}_linux_amd64.zip" -d ${DEPLOY_PATH}/
            rm "pocketbase_${VERSION}_linux_amd64.zip"
          fi

          # Deploy migrations and hooks
          cp -r /tmp/deploy/pb_migrations/* ${DEPLOY_PATH}/pb_migrations/ 2>/dev/null || true
          cp -r /tmp/deploy/pb_hooks/* ${DEPLOY_PATH}/pb_hooks/ 2>/dev/null || true

          # Set permissions
          sudo chown -R pocketbase:pocketbase ${DEPLOY_PATH}

          # Restart service
          sudo systemctl start pocketbase

          # Verify deployment
          sleep 5
          if curl -s http://localhost:8090/api/health | grep -q "ok"; then
            echo "Deployment successful!"
          else
            echo "Deployment verification failed!"
            exit 1
          fi

          # Cleanup
          rm -rf /tmp/deploy /tmp/deploy.tar.gz

          ENDSSH

      - name: Run migrations
        run: |
          ssh -p ${{ secrets.VPS_SSH_PORT }} \
              -i ~/.ssh/deploy_key \
              ${{ secrets.VPS_SSH_USER }}@${{ secrets.VPS_HOST }} << 'ENDSSH'

          cd /opt/pocketbase
          ./pocketbase migrate up

          ENDSSH

      - name: Cleanup SSH
        if: always()
        run: rm -f ~/.ssh/deploy_key
```

### Database Migration Workflow

```yaml
# .github/workflows/migrate.yml

name: Database Migration

on:
  workflow_dispatch:
    inputs:
      action:
        description: "Migration action"
        required: true
        type: choice
        options:
          - up
          - down
          - status
      steps:
        description: "Number of migrations (for down)"
        required: false
        default: "1"

jobs:
  migrate:
    name: Run Migration
    runs-on: ubuntu-latest

    steps:
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -p ${{ secrets.VPS_SSH_PORT }} ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

      - name: Run migration
        run: |
          ssh -p ${{ secrets.VPS_SSH_PORT }} \
              -i ~/.ssh/deploy_key \
              ${{ secrets.VPS_SSH_USER }}@${{ secrets.VPS_HOST }} << 'ENDSSH'

          cd /opt/pocketbase

          case "${{ github.event.inputs.action }}" in
            up)
              ./pocketbase migrate up
              ;;
            down)
              ./pocketbase migrate down ${{ github.event.inputs.steps }}
              ;;
            status)
              ./pocketbase migrate status
              ;;
          esac

          ENDSSH
```

### Version Management Strategy

```yaml
# Version tagging strategy

# Semantic versioning: MAJOR.MINOR.PATCH
# Example: v1.2.3

# Tag creation workflow
name: Create Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, '-rc') || contains(github.ref, '-beta') }}
```

---

## 7. Backup Strategy

### Litestream Configuration

```yaml
# /etc/litestream.yml

dbs:
  - path: /opt/pocketbase/pb_data/data.db
    replicas:
      # Primary: Cloudflare R2
      - type: s3
        bucket: pocketbase-cn-backups
        path: litestream/data
        endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
        region: auto
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
        retention: 72h
        retention-check-interval: 1h
        sync-interval: 1s
        snapshot-interval: 1h

  - path: /opt/pocketbase/pb_data/logs.db
    replicas:
      - type: s3
        bucket: pocketbase-cn-backups
        path: litestream/logs
        endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
        region: auto
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
        retention: 24h
        retention-check-interval: 1h
        sync-interval: 60s
```

### Litestream Installation

```bash
#!/bin/bash
# install-litestream.sh

LITESTREAM_VERSION="0.3.13"

# Download and install
wget https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.deb
sudo dpkg -i litestream-v${LITESTREAM_VERSION}-linux-amd64.deb
rm litestream-v${LITESTREAM_VERSION}-linux-amd64.deb

# Verify installation
litestream version
```

### Litestream Systemd Service

```ini
# /etc/systemd/system/litestream.service

[Unit]
Description=Litestream Replication Service
Documentation=https://litestream.io
After=network.target
Requires=pocketbase.service
After=pocketbase.service

[Service]
Type=simple
User=pocketbase
Group=pocketbase
EnvironmentFile=/opt/pocketbase/.env
ExecStart=/usr/bin/litestream replicate -config /etc/litestream.yml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable litestream
sudo systemctl start litestream
```

### Scheduled Backup Script

```bash
#!/bin/bash
# /opt/pocketbase/scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="/opt/pocketbase/backups"
DATA_DIR="/opt/pocketbase/pb_data"
R2_BUCKET="pocketbase-cn-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Stop PocketBase for consistent backup
echo "Stopping PocketBase..."
sudo systemctl stop pocketbase

# Create local backup
echo "Creating backup..."
tar -czf ${BACKUP_DIR}/pb_data_${TIMESTAMP}.tar.gz -C ${DATA_DIR} .

# Restart PocketBase
echo "Starting PocketBase..."
sudo systemctl start pocketbase

# Upload to R2
echo "Uploading to R2..."
aws s3 cp ${BACKUP_DIR}/pb_data_${TIMESTAMP}.tar.gz \
    s3://${R2_BUCKET}/manual-backups/pb_data_${TIMESTAMP}.tar.gz \
    --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Cleanup old local backups
echo "Cleaning up old backups..."
find ${BACKUP_DIR} -name "pb_data_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# Cleanup old R2 backups
aws s3 ls s3://${R2_BUCKET}/manual-backups/ \
    --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com | \
    while read -r line; do
        createDate=$(echo $line | awk '{print $1}')
        fileName=$(echo $line | awk '{print $4}')
        if [[ $(date -d "$createDate" +%s) -lt $(date -d "-${RETENTION_DAYS} days" +%s) ]]; then
            aws s3 rm s3://${R2_BUCKET}/manual-backups/$fileName \
                --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
        fi
    done

echo "Backup completed: pb_data_${TIMESTAMP}.tar.gz"
```

### Cron Schedule

```bash
# /etc/cron.d/pocketbase-backup

# Daily full backup at 3:00 AM
0 3 * * * pocketbase /opt/pocketbase/scripts/backup.sh >> /var/log/pocketbase/backup.log 2>&1

# Weekly integrity check on Sunday at 4:00 AM
0 4 * * 0 pocketbase sqlite3 /opt/pocketbase/pb_data/data.db "PRAGMA integrity_check;" >> /var/log/pocketbase/integrity.log 2>&1
```

### Recovery Procedures

#### Restore from Litestream

```bash
#!/bin/bash
# /opt/pocketbase/scripts/restore-litestream.sh

set -e

RESTORE_DIR="/opt/pocketbase/pb_data_restored"
R2_BUCKET="pocketbase-cn-backups"

# Stop services
sudo systemctl stop pocketbase
sudo systemctl stop litestream

# Create restore directory
mkdir -p ${RESTORE_DIR}

# Restore from R2
echo "Restoring data.db from Litestream..."
litestream restore -config /etc/litestream.yml \
    -o ${RESTORE_DIR}/data.db \
    /opt/pocketbase/pb_data/data.db

echo "Restoring logs.db from Litestream..."
litestream restore -config /etc/litestream.yml \
    -o ${RESTORE_DIR}/logs.db \
    /opt/pocketbase/pb_data/logs.db

# Verify restoration
echo "Verifying restored database..."
sqlite3 ${RESTORE_DIR}/data.db "PRAGMA integrity_check;"

# Prompt for confirmation
echo "Restoration complete. Files are in ${RESTORE_DIR}"
echo "To apply restoration, run:"
echo "  mv /opt/pocketbase/pb_data /opt/pocketbase/pb_data_old"
echo "  mv ${RESTORE_DIR} /opt/pocketbase/pb_data"
echo "  sudo systemctl start pocketbase"
```

#### Restore from Manual Backup

```bash
#!/bin/bash
# /opt/pocketbase/scripts/restore-manual.sh

set -e

BACKUP_FILE=$1
RESTORE_DIR="/opt/pocketbase/pb_data_restored"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -la /opt/pocketbase/backups/
    exit 1
fi

# Stop services
sudo systemctl stop pocketbase
sudo systemctl stop litestream

# Create restore directory
mkdir -p ${RESTORE_DIR}

# Extract backup
echo "Extracting backup..."
tar -xzf ${BACKUP_FILE} -C ${RESTORE_DIR}

# Verify
echo "Verifying restored database..."
sqlite3 ${RESTORE_DIR}/data.db "PRAGMA integrity_check;"

echo "Restoration ready. Files are in ${RESTORE_DIR}"
```

### Recovery Drill Checklist

```markdown
## Monthly Recovery Drill Checklist

### Pre-Drill

- [ ] Notify team of scheduled drill
- [ ] Document current database size and record count
- [ ] Verify backup timestamps

### Litestream Recovery Test

- [ ] Create test VM or use staging environment
- [ ] Run `restore-litestream.sh`
- [ ] Verify data.db integrity
- [ ] Verify logs.db integrity
- [ ] Compare record counts with production
- [ ] Test application functionality
- [ ] Document recovery time

### Manual Backup Recovery Test

- [ ] Download latest manual backup from R2
- [ ] Run `restore-manual.sh`
- [ ] Verify database integrity
- [ ] Compare record counts
- [ ] Document recovery time

### Post-Drill

- [ ] Document any issues found
- [ ] Update procedures if needed
- [ ] Update recovery time estimates
- [ ] File drill report
```

---

## 8. Monitoring & Alerts

### Health Check Endpoint

PocketBase provides a built-in health endpoint:

```
GET https://api.pocketbase.cn/api/health

Response: { "code": 200, "message": "ok" }
```

### Uptime Monitoring Setup

#### UptimeRobot Configuration

```yaml
# Monitors to configure in UptimeRobot

monitors:
  - name: "PocketBase.cn - Frontend"
    url: https://pocketbase.cn
    type: HTTP
    interval: 60 # seconds
    timeout: 30
    alert_contacts: [email, slack]

  - name: "PocketBase.cn - API"
    url: https://api.pocketbase.cn/api/health
    type: HTTP
    interval: 60
    timeout: 30
    expected_status: 200
    expected_content: "ok"
    alert_contacts: [email, slack]

  - name: "PocketBase.cn - Admin"
    url: https://admin.pocketbase.cn/_/
    type: HTTP
    interval: 300
    timeout: 30
    alert_contacts: [email]
```

### Server Monitoring Script

```bash
#!/bin/bash
# /opt/pocketbase/scripts/monitor.sh

# Configuration
WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
HOSTNAME=$(hostname)

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85

# Check CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > $CPU_THRESHOLD" | bc -l) )); then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Warning: High CPU usage on ${HOSTNAME}: ${CPU_USAGE}%\"}" \
        ${WEBHOOK_URL}
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE > $MEMORY_THRESHOLD" | bc -l) )); then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Warning: High memory usage on ${HOSTNAME}: ${MEMORY_USAGE}%\"}" \
        ${WEBHOOK_URL}
fi

# Check disk usage
DISK_USAGE=$(df -h /opt | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Warning: High disk usage on ${HOSTNAME}: ${DISK_USAGE}%\"}" \
        ${WEBHOOK_URL}
fi

# Check PocketBase service
if ! systemctl is-active --quiet pocketbase; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"CRITICAL: PocketBase service is down on ${HOSTNAME}!\"}" \
        ${WEBHOOK_URL}
fi

# Check Litestream service
if ! systemctl is-active --quiet litestream; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Warning: Litestream service is down on ${HOSTNAME}!\"}" \
        ${WEBHOOK_URL}
fi
```

```bash
# Add to crontab
# */5 * * * * /opt/pocketbase/scripts/monitor.sh
```

### GitHub Actions Monitoring

```yaml
# .github/workflows/monitor.yml

name: Health Check

on:
  schedule:
    - cron: "*/15 * * * *" # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest

    steps:
      - name: Check Frontend
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://pocketbase.cn)
          if [ "$response" != "200" ]; then
            echo "Frontend check failed with status $response"
            exit 1
          fi
          echo "Frontend OK"

      - name: Check API
        run: |
          response=$(curl -s https://api.pocketbase.cn/api/health)
          if [[ "$response" != *"ok"* ]]; then
            echo "API check failed: $response"
            exit 1
          fi
          echo "API OK"

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "PocketBase.cn health check failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*PocketBase.cn Health Check Failed*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Cloudflare Analytics

Enable in Cloudflare Dashboard:

- Web Analytics for frontend
- API Analytics for API endpoints

### Error Alerting

```javascript
// frontend/src/lib/error-tracking.ts

export async function reportError(error: Error, context?: Record<string, unknown>) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error:', error, context);
    return;
  }

  // Send to error tracking service (e.g., Sentry, LogSnag)
  try {
    await fetch('https://api.pocketbase.cn/api/collections/errors/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context: JSON.stringify(context),
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error('Failed to report error:', e);
  }
}
```

---

## 9. Rollback Procedures

### Frontend Rollback (Cloudflare Pages)

#### Via Dashboard

1. Go to Cloudflare Dashboard > Pages > pocketbase-cn
2. Click "Deployments"
3. Find the last working deployment
4. Click the three dots menu > "Rollback to this deployment"

#### Via CLI

```bash
# List deployments
wrangler pages deployment list --project-name=pocketbase-cn

# Rollback to specific deployment
wrangler pages deployment rollback <deployment-id> --project-name=pocketbase-cn
```

#### Via GitHub Actions

```yaml
# .github/workflows/rollback-frontend.yml

name: Rollback Frontend

on:
  workflow_dispatch:
    inputs:
      deployment_id:
        description: "Deployment ID to rollback to"
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback deployment
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deployment rollback ${{ github.event.inputs.deployment_id }} --project-name=pocketbase-cn
```

### Backend Rollback

```bash
#!/bin/bash
# /opt/pocketbase/scripts/rollback.sh

set -e

BACKUP_DIR="/opt/pocketbase/backups"

# List available backups
echo "Available PocketBase backups:"
ls -la ${BACKUP_DIR}/pocketbase_* 2>/dev/null || echo "No binary backups found"

echo ""
echo "Available data backups:"
ls -la ${BACKUP_DIR}/pb_data_* 2>/dev/null || echo "No data backups found"

echo ""
read -p "Enter backup filename to restore (e.g., pocketbase_20240101_120000): " BACKUP_NAME

if [ ! -f "${BACKUP_DIR}/${BACKUP_NAME}" ]; then
    echo "Error: Backup file not found"
    exit 1
fi

# Stop service
echo "Stopping PocketBase..."
sudo systemctl stop pocketbase
sudo systemctl stop litestream

# Backup current state
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Backing up current state..."
cp /opt/pocketbase/pocketbase ${BACKUP_DIR}/pocketbase_pre_rollback_${TIMESTAMP}

# Restore binary
echo "Restoring PocketBase binary..."
cp ${BACKUP_DIR}/${BACKUP_NAME} /opt/pocketbase/pocketbase
chmod +x /opt/pocketbase/pocketbase

# Restart services
echo "Starting services..."
sudo systemctl start pocketbase
sudo systemctl start litestream

# Verify
sleep 5
if curl -s http://localhost:8090/api/health | grep -q "ok"; then
    echo "Rollback successful!"
else
    echo "Rollback verification failed. Check logs: journalctl -u pocketbase -n 50"
    exit 1
fi
```

### Database Rollback

#### Point-in-Time Recovery with Litestream

```bash
#!/bin/bash
# /opt/pocketbase/scripts/restore-point-in-time.sh

set -e

TIMESTAMP=$1

if [ -z "$TIMESTAMP" ]; then
    echo "Usage: $0 <timestamp>"
    echo "Example: $0 2024-01-15T10:30:00Z"
    exit 1
fi

RESTORE_DIR="/opt/pocketbase/pb_data_pit_restore"

# Stop services
sudo systemctl stop pocketbase
sudo systemctl stop litestream

# Restore to point in time
echo "Restoring to ${TIMESTAMP}..."
litestream restore -config /etc/litestream.yml \
    -timestamp "${TIMESTAMP}" \
    -o ${RESTORE_DIR}/data.db \
    /opt/pocketbase/pb_data/data.db

# Verify
echo "Verifying restored database..."
sqlite3 ${RESTORE_DIR}/data.db "PRAGMA integrity_check;"
sqlite3 ${RESTORE_DIR}/data.db "SELECT COUNT(*) FROM _users;"

echo ""
echo "Restoration complete. Review the restored database at ${RESTORE_DIR}/data.db"
echo "To apply, run:"
echo "  mv /opt/pocketbase/pb_data /opt/pocketbase/pb_data_backup"
echo "  mkdir /opt/pocketbase/pb_data"
echo "  mv ${RESTORE_DIR}/data.db /opt/pocketbase/pb_data/"
echo "  sudo systemctl start pocketbase"
```

### Emergency Rollback Runbook

```markdown
## Emergency Rollback Runbook

### Severity Assessment

- **P1 (Critical)**: Complete service outage, data loss
- **P2 (High)**: Major functionality broken, significant user impact
- **P3 (Medium)**: Minor functionality issues, workaround available
- **P4 (Low)**: Cosmetic issues, no functional impact

### P1/P2 Response (< 15 minutes)

#### Frontend Issues

1. Verify issue: `curl -I https://pocketbase.cn`
2. Check Cloudflare status page
3. Rollback via Cloudflare Dashboard (fastest)
4. Notify team in Slack

#### Backend Issues

1. SSH to VPS: `ssh -p 22022 pocketbase@<VPS_IP>`
2. Check service: `systemctl status pocketbase`
3. Check logs: `journalctl -u pocketbase -n 100`
4. If binary issue: Run `/opt/pocketbase/scripts/rollback.sh`
5. If data issue: Run Litestream restore
6. Notify team

#### Database Corruption

1. Stop all services
2. Assess damage: `sqlite3 /opt/pocketbase/pb_data/data.db "PRAGMA integrity_check;"`
3. Restore from Litestream (automatic recovery)
4. If Litestream fails, restore from manual backup
5. Document data loss window

### Post-Incident

1. Create incident report
2. Update runbook if needed
3. Schedule post-mortem
```

---

## Appendix A: Quick Reference Commands

```bash
# Service Management
sudo systemctl status pocketbase
sudo systemctl restart pocketbase
sudo systemctl stop pocketbase
journalctl -u pocketbase -f

# Litestream
sudo systemctl status litestream
litestream snapshots -config /etc/litestream.yml /opt/pocketbase/pb_data/data.db

# Database
sqlite3 /opt/pocketbase/pb_data/data.db "PRAGMA integrity_check;"
sqlite3 /opt/pocketbase/pb_data/data.db ".tables"

# Logs
tail -f /var/log/caddy/api.pocketbase.cn.log
tail -f /var/log/pocketbase/pocketbase.log

# Disk Usage
ncdu /opt/pocketbase
df -h

# SSL Certificate
caddy reload --config /etc/caddy/Caddyfile
```

---

## Appendix B: Environment Variables Reference

| Variable                       | Description            | Example                                |
| ------------------------------ | ---------------------- | -------------------------------------- |
| `PB_ENCRYPTION_KEY`            | 32-char encryption key | `abc123...`                            |
| `PB_SMTP_HOST`                 | SMTP server            | `smtp.resend.com`                      |
| `PB_SMTP_PORT`                 | SMTP port              | `587`                                  |
| `PB_S3_ENDPOINT`               | R2 endpoint            | `https://xxx.r2.cloudflarestorage.com` |
| `PB_S3_BUCKET`                 | R2 bucket name         | `pocketbase-cn-uploads`                |
| `LITESTREAM_ACCESS_KEY_ID`     | R2 access key          | `xxx`                                  |
| `LITESTREAM_SECRET_ACCESS_KEY` | R2 secret              | `xxx`                                  |

---

## Appendix C: Cost Estimation

| Service               | Tier      | Monthly Cost      |
| --------------------- | --------- | ----------------- |
| VPS (2 vCPU, 2GB RAM) | Basic     | $10-20            |
| Cloudflare Pages      | Free      | $0                |
| Cloudflare R2 (10GB)  | Free tier | $0                |
| Domain (.cn)          | Annual    | ~$10/year         |
| UptimeRobot           | Free      | $0                |
| **Total**             |           | **~$15-25/month** |

---

_Document Version: 1.0.0_
_Last Updated: 2024-01_
_Maintainer: DevOps Team_
