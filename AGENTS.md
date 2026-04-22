Use Bun as the runtime and package manager (not npm, not node).

## Project

Casphé — Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + Leaflet map app that maps WiFi speeds at coffee shops. PostgreSQL backend.

## Commands

- `bun run dev` — Start Next.js dev server
- `bun run build` — Lints first, then builds (`bun run lint && bunx next build`). **Always run this before considering work done** to catch errors.
- `bun run lint` — ESLint with `--fix` (auto-fixes). Checks for errors, unused vars (prefixed `_` ignored), `no-console` (warn, `console.warn/error` allowed), `no-debugger`, `prefer-const`, Prettier formatting as ESLint error, max 400 lines per file.
- `bun run lint:check` — ESLint without auto-fix (read-only check).
- `bun run format` — Prettier write (formats all files in-place). Config: single quotes, trailing comma es5, print width 100, tab width 2, semicolons, LF line endings.
- `bun run format:check` — Prettier check (read-only, fails if unformatted).
- `bun run typecheck` — `tsc --noEmit` (TypeScript type checking, no output).
- `bun run db:migrate` — Runs `db-migrate.js` to apply `src/lib/schema.sql` to PostgreSQL.

## When to run what

1. **After editing code** → run `bun run lint && bun run format && bun run typecheck` to verify everything is clean.
2. **Before finishing a task** → run `bun run build` (this runs lint + Next.js build, the definitive check).
3. **Pre-commit hook** runs `bunx lint-staged` which auto-lints and formats staged `.ts/.tsx` files and formats staged `.json/.css/.md` files.

## Architecture

- `src/app/` — Next.js App Router pages and API routes
  - `src/app/api/places/` — Places API endpoints
  - `src/app/api/speedtests/` — Speedtests API endpoints
- `src/components/` — React components (Map, Speedtest, Icons)
- `src/lib/` — Shared utilities (db, google-places, schema.sql)
- Path alias: `@/*` maps to `./src/*`

## Style

- TypeScript strict mode enabled
- ESLint flat config (`eslint.config.mjs`) with Next.js, TypeScript, and Prettier plugins
- No `console.log` (use `console.warn` or `console.error` if needed)
- Prefix unused variables/args with `_`
- Max 400 lines per file (excluding blanks and comments)
- React hooks rules enforced
