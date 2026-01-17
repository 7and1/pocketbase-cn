# Admin Credentials Setup Guide

This guide explains how to set up admin credentials for the PocketBase.cn project on the production server.

## Production Server

- **SSH**: `ssh root@107.174.42.198`
- **Project Path**: `/opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn`
- **Admin UI**: `https://admin.pocketbase.cn/_/`

---

## Initial Admin Setup

### Option 1: Using the Reset Script (Recommended)

This script creates or updates the admin account using the PocketBase API.

```bash
# SSH into the server
ssh root@107.174.42.198

# Navigate to project
cd /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn

# Set environment variables and run the script
export POCKETBASE_URL="http://127.0.0.1:8090"
export PB_ADMIN_EMAIL="admin@pocketbase.cn"
export PB_ADMIN_PASSWORD="your_secure_password_here"

node apps/backend/scripts/reset-admin.js
```

**Security Note**: Use a strong password (16+ characters, mixed case, numbers, symbols).

### Option 2: Using PocketBase CLI

```bash
# SSH into the server and enter the container
ssh root@107.174.42.198
cd /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn
docker exec -it pocketbase-cn sh

# Inside the container
./pocketbase admin reset

# Follow prompts to enter email and password
exit
```

### Option 3: Via Admin UI (First Time Only)

1. Navigate to `https://admin.pocketbase.cn/_/`
2. You should see the initial setup screen
3. Enter email and password
4. Click "Create"

---

## Database Seeding

### Seed Sample Plugins

The project includes a script to seed the database with sample plugin data.

```bash
# Set admin credentials for authentication
export PB_ADMIN_EMAIL="admin@pocketbase.cn"
export PB_ADMIN_PASSWORD="your_password"
export POCKETBASE_URL="http://127.0.0.1:8090"

# Run the seed script
node apps/backend/scripts/seed-plugins.js
```

**Sample Plugins Included**:
- pocketbase (framework reference)
- pocketbase-ui (admin UI components)
- pb_uploads_s3 (S3 storage)
- pb_hooks_tester (dev tools)
- pocketbase-typescript (TypeScript definitions)
- pb_admin (custom admin UI)
- pb_social_auth (OAuth providers)
- pb_rate_limit (rate limiting)

---

## Environment Variables for Scripts

| Variable           | Description                              | Example                      |
| ------------------ | ---------------------------------------- | ---------------------------- |
| `POCKETBASE_URL`   | PocketBase API endpoint                  | `http://127.0.0.1:8090`      |
| `PB_ADMIN_EMAIL`   | Admin account email                      | `admin@pocketbase.cn`        |
| `PB_ADMIN_PASSWORD`| Admin account password                   | `your_secure_password`       |

---

## Database Structure

After initial setup, the following collections are created:

| Collection      | Purpose                                  |
| --------------- | ---------------------------------------- |
| `users`         | User accounts (GitHub OAuth)              |
| `plugins`       | Plugin marketplace listings               |
| `plugin_stats`  | Download/view statistics                  |
| `plugin_versions` | Version history                          |
| `showcase`      | Community project gallery                 |
| `mirrors`       | Download mirror configuration             |
| `newsletter`    | Email subscriptions                       |

See `docs/SCHEMA.md` for complete schema documentation.

---

## Resetting Admin Password

### If You Know the Current Password

```bash
export PB_ADMIN_EMAIL="admin@pocketbase.cn"
export PB_ADMIN_PASSWORD="new_password"
node apps/backend/scripts/reset-admin.js
```

### If You Forgot the Password

```bash
# Stop the container
docker stop pocketbase-cn

# Access the database directly
docker exec -it pocketbase-cn sqlite3 /pb_data/data.db

# In SQLite, delete the admin record
DELETE FROM _superusers WHERE email = 'admin@pocketbase.cn';

# Exit SQLite and restart container
exit
docker start pocketbase-cn

# Recreate admin using the script
node apps/backend/scripts/reset-admin.js
```

---

## Verifying Setup

### Check Admin Access

```bash
# Test authentication
curl -X POST https://api.pocketbase.cn/api/admins/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@pocketbase.cn","password":"your_password"}'
```

Expected response:
```json
{
  "token": "...",
  "record": {
    "id": "...",
    "email": "admin@pocketbase.cn",
    "avatar": 0
  }
}
```

### Check Database Collections

```bash
# Via PocketBase CLI inside container
docker exec -it pocketbase-cn ./pocketbase migrate status
```

---

## Security Best Practices

1. **Use Strong Passwords**
   - Minimum 16 characters
   - Mixed case, numbers, symbols
   - Use a password manager

2. **Enable 2FA** (when available)
   - Configure in admin UI settings

3. **Limit Admin UI Access**
   - Use IP whitelist in nginx/Caddy config
   - Example: only allow office IPs

4. **Rotate Credentials Regularly**
   - Change passwords quarterly
   - Update after any security incident

5. **Monitor Access Logs**
   ```bash
   # Check recent admin logins
   docker logs pocketbase-cn | grep "admin"
   ```

---

## Troubleshooting

### "Admin already exists" Error

This means an admin account is already set up. Use the password reset option instead.

### Script Hangs/Times Out

1. Check if PocketBase is running:
   ```bash
   docker ps | grep pocketbase
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:8090/api/health
   ```

3. Check logs:
   ```bash
   docker logs pocketbase-cn
   ```

### Permission Denied

Ensure you're running as root or with proper Docker permissions:
```bash
sudo node apps/backend/scripts/reset-admin.js
```

---

## Related Documentation

- `../CLAUDE.md` - Project overview and quick commands
- `../docs/SCHEMA.md` - Database schema reference
- `../docs/DEPLOYMENT.md` - Full deployment guide
- `apps/backend/deploy.sh` - Deployment script
