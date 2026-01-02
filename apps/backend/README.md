# Backend (PocketBase)

This folder is a production-ready PocketBase instance with:

- `pb_migrations/`: schema + indexes (via `app.importCollections()` snapshot)
- `pb_hooks/`: custom routes, automation, rate limiting, GitHub integrations
- `pb_public/`: optional public static assets

## Local development

1. Download PocketBase binary:
   - `bash apps/backend/scripts/download-pocketbase.sh`

2. Run migrations:
   - `bash apps/backend/scripts/migrate.sh`

3. Start PocketBase:
   - `bash apps/backend/scripts/dev.sh`

Admin UI: `http://127.0.0.1:8090/_/`
