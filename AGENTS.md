# Repository Guidelines

## Project Structure & Module Organization

- `apps/backend/`: production PocketBase instance.
  - `pb_hooks/`: custom JS hooks/routes (`*.pb.js`) executed by PocketBase.
  - `pb_migrations/`: schema + indexes snapshots (migration JS files).
  - `pb_public/`: optional public static assets served by PocketBase.
  - `pb_data/`: local SQLite data (ignored by git; don’t commit).
  - `scripts/`: local tooling for download/dev/migrate/reset.
- `apps/web/`: Astro + Starlight documentation site.
  - `src/content/docs/`: docs pages (`.md`/`.mdx`) → routes.
  - `src/assets/`, `public/`: images and static assets.
- `docs/`: product/architecture specs and requirements (treat as source of truth).

## Build, Test, and Development Commands

Run commands from repo root (requires `pnpm`, see `package.json`):

- `pnpm install`: install dependencies.
- `pnpm dev`: run workspace dev servers (currently the web app; backend runs via scripts below).
- `pnpm backend:download`: download PocketBase binary into `apps/backend/bin/`.
- `pnpm backend:migrate`: apply migrations from `apps/backend/pb_migrations/`.
- `pnpm backend:dev`: start PocketBase (default: `http://127.0.0.1:8090/_/`).
- `pnpm web:dev`: start Astro dev server (default: `http://localhost:4321`).
- `pnpm web:build`: build the static site.
- `pnpm web:preview`: preview the built site locally.

## Coding Style & Naming Conventions

- Follow `.editorconfig`: UTF-8, LF, 2-space indentation, trim trailing whitespace.
- Keep PocketBase hook file ordering via numeric prefixes (e.g. `10_health.pb.js`).
- Use kebab-case filenames under `apps/web/src/content/docs/` to match route patterns.

## Testing Guidelines

- There is no dedicated unit-test harness in this repo yet.
- Minimum checks before PR:
  - `pnpm web:build` succeeds.
  - Backend boots via `pnpm backend:dev` and core endpoints/pages load.
  - Smoke test key docs pages locally in `pnpm web:preview`.

## Commit & Pull Request Guidelines

- This checkout may not include git history; use Conventional Commits (e.g. `feat(web): add pricing page`).
- PRs should include: a brief summary, linked `docs/*.md` requirement(s), screenshots for UI/docs changes, and any migration/runbook notes.

## Security & Configuration Tips

- Never commit secrets or local databases. `.env*` is ignored; `apps/backend/pb_data/` and `apps/backend/bin/` must stay untracked.
