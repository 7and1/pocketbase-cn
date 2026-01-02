#!/usr/bin/env bash
set -euo pipefail

# Remote Deployment Script for PocketBase.cn
# This script is meant to be run from a CI/CD system
# Usage: bash deploy-remote.sh [production|staging]

ENVIRONMENT="${1:-production}"

# Load environment-specific variables
case "$ENVIRONMENT" in
  production)
    SSH_HOST="${PRODUCTION_SSH_HOST:-}"
    SSH_PORT="${PRODUCTION_SSH_PORT:-22}"
    SSH_USER="${PRODUCTION_SSH_USER:-root}"
    ;;
  staging)
    SSH_HOST="${STAGING_SSH_HOST:-}"
    SSH_PORT="${STAGING_SSH_PORT:-22}"
    SSH_USER="${STAGING_SSH_USER:-root}"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# Validate required variables
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ]; then
  echo "Error: SSH_HOST and SSH_USER must be set for $ENVIRONMENT"
  exit 1
fi

echo "Deploying to $ENVIRONMENT ($SSH_USER@$SSH_HOST:$SSH_PORT)"

# Run remote deployment via SSH
ssh -p "$SSH_PORT" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" << 'ENDSSH'
set -euo pipefail

ENVIRONMENT="$1"
DEPLOY_PATH="/opt/pocketbase"
SERVICE_NAME="pocketbase"

if [ "$ENVIRONMENT" = "staging" ]; then
  DEPLOY_PATH="/opt/pocketbase-staging"
  SERVICE_NAME="pocketbase-staging"
fi

echo "Starting deployment to $ENVIRONMENT..."

# Create backup
BACKUP_FILE="/tmp/pocketbase_${ENVIRONMENT}_pre_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
echo "Creating backup: $BACKUP_FILE"
tar -C "$DEPLOY_PATH" -czf "$BACKUP_FILE" pb_data || true

# Update from repo (assumes repo is already cloned)
REPO_PATH="${DEPLOY_PATH}.deploy.repo"
if [ -d "$REPO_PATH" ]; then
  echo "Updating repository..."
  cd "$REPO_PATH"
  git fetch --depth 1 origin "${GITHUB_SHA:-main}"
  git checkout -f "${GITHUB_SHA:-main}"
else
  echo "Error: Repository not found at $REPO_PATH"
  echo "Please clone the repository first:"
  echo "  git clone --depth 1 <repo-url> $REPO_PATH"
  exit 1
fi

# Run the local deploy script
echo "Running deployment..."
bash "$REPO_PATH/apps/backend/deploy/scripts/deploy.sh" "$ENVIRONMENT"

echo "Deployment completed!"
ENDSSH
