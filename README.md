# SMSOK Clone

Customer-facing SMS platform built with Next.js 16, Bun, Prisma, PostgreSQL, and Redis.

## Stack

- Bun 1.x for package management and scripts
- Next.js 16 + React 19
- Prisma + PostgreSQL
- Redis + BullMQ for queues and rate limiting

## Local Development

### 1. Install dependencies

```bash
bun install
```

### 2. Prepare environment

```bash
cp .env.example .env
```

Review the required variables in [.env.example](/Users/lambogreny/oracles/smsok-clone/.env.example) before running production-like flows.

### 3. Start required services

You need these services running locally:

- PostgreSQL on `localhost:5434`
- Redis on `localhost:6380`

If you use the repo Docker setup:

```bash
docker compose up -d
```

### 4. Prepare the database

```bash
bunx prisma generate
bunx prisma db push
```

### 5. Seed data

Development seed:

```bash
bun prisma/seed.ts
```

QA-only test user seed:

```bash
bun run db:seed:qa
```

Production-safe seed:

```bash
NODE_ENV=production ADMIN_SEED_PASSWORD='change-me' bun prisma/seed.ts
```

### 6. Run the app

```bash
bun dev
```

App URL: `http://localhost:3000`

## Ports

| Service | Port |
| --- | --- |
| smsok-clone | `3000` |
| smsok-backoffice | `3001` |
| PostgreSQL | `5434` |
| Redis | `6380` |

## Useful Commands

```bash
bun dev
bun run build
bun test
bunx tsc --noEmit
bunx prisma generate
bunx prisma db push
bun prisma/seed.ts
bun run db:seed:qa
```

## API Documentation

- Swagger UI: `GET /api/v1/docs`
- OpenAPI JSON: `GET /api/v1/docs/openapi.json`
- Static generator source: [openapi-spec.ts](/Users/lambogreny/oracles/smsok-clone/lib/openapi-spec.ts)

## Docs

- Webhooks: [webhooks.md](/Users/lambogreny/oracles/smsok-clone/docs/webhooks.md)
- SDK examples: [README.md](/Users/lambogreny/oracles/smsok-clone/docs/examples/README.md)
- Deployment: [DEPLOYMENT.md](/Users/lambogreny/oracles/smsok-clone/docs/DEPLOYMENT.md)

## QA Seed Defaults

The QA seed script creates or updates this user unless overridden by `QA_SEED_*` env vars:

- Email: `qa-suite@smsok.test`
- Phone: `+66900000099`
- Password: `(set E2E_USER_PASSWORD env var)`

The QA script is disabled when `NODE_ENV=production`.
