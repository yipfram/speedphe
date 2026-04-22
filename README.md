# Casphe

Casphé is a Next.js 15 + TypeScript + Tailwind CSS v4 app for mapping WiFi speeds at coffee shops. It uses Bun for package management/runtime and PostgreSQL for persistence.

## Requirements

- Bun
- PostgreSQL
- Optional: Google Maps Places API key for place enrichment

## Getting Started

1. Copy the example environment file and update values:

```bash
cp .env.example .env
```

2. Start PostgreSQL and make sure `DATABASE_URL` points to it.
3. Apply the schema:

```bash
bun run db:migrate
```

4. Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

The app reads these variables from `.env`:

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/speedphe

# Optional Google Places API key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Bun Commands

```bash
bun run dev
bun run lint
bun run format
bun run typecheck
bun run build
```

`bun run build` is the final verification command and runs linting before the Next.js production build.

## Docker

The repo includes a production-oriented multi-stage `Dockerfile` and a `docker-compose.yml` for running the app with PostgreSQL.

### Start the stack

```bash
docker compose up --build
```

This starts:

- `app` on `http://localhost:3000`
- `db` on `localhost:5432`

### Configure the stack

Compose uses these optional host-side variables:

```bash
APP_PORT=3000
POSTGRES_PORT=5432
POSTGRES_DB=casphe
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

The app container receives its internal `DATABASE_URL` automatically and connects to the `db` service.

### Run the database migration

Migrations are manual by design and are not executed during container startup.

```bash
docker compose run --rm app bun run db:migrate
```

Run that after the database is up for the first time, or after schema changes.

### Build only the app image

```bash
docker build -t casphe .
```

## Production Notes

- The image is built with Bun and runs the standalone Next.js server with Bun.
- `DATABASE_URL` is required at runtime.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is optional.
- No automatic schema migration is performed on startup.

## Verification

Before considering changes complete:

```bash
bun run lint
bun run format
bun run typecheck
bun run build
```

If you are validating the container path as well:

```bash
docker compose up --build
docker compose run --rm app bun run db:migrate
```
