# SMSOK Platform — Local Testing

## Overview
SMSOK is a Next.js 16 + React 19 full-stack SMS platform using Bun, Prisma 6 (PostgreSQL), Redis + BullMQ.

## Prerequisites
- Bun 1.x (package manager and runtime)
- Docker (for PostgreSQL and Redis)

## Local Development Setup

### 1. Start Docker Services
```bash
docker compose up -d
```
This starts:
- PostgreSQL on port 5434 (user: smsok, db: smsok)
- Redis on port 6380

### 2. Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string (port 5434)
- `JWT_SECRET`, `ADMIN_JWT_SECRET`, `OTP_HASH_SECRET` — 32+ char secrets
- `TWO_FA_ENCRYPTION_KEY` — 64-char hex string
- `REDIS_URL` — redis://localhost:6380

### 3. Database Setup
```bash
bunx prisma db push    # Sync schema to DB
bunx prisma generate   # Generate Prisma client
```

**Known Issue**: If `prisma generate` fails with network errors downloading engines from binaries.prisma.sh, check that `prisma/schema.prisma` does NOT have `engineType = "binary"`. The default library engine works correctly.

### 4. Seed QA Test User
```bash
QA_SEED_PASSWORD="<password-min-10-chars>" bun scripts/seed-qa.ts
```
Creates a user with:
- Email: `qa-suite@smsok.test`
- Organization + package (500 SMS quota)

### 5. Start Dev Server
```bash
bun run dev
```
Starts Next.js on port 3000 + 8 BullMQ workers (sms-otp, sms-single, sms-scheduled, sms-batch, sms-campaign, sms-webhook, slip-verify, sms-dlq).

## Testing Patterns

### Authentication
The login API requires an `Origin` header (CSRF protection):
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -d '{"email":"qa-suite@smsok.test","password":"<password>"}'
```
Returns `set-cookie: session=<JWT>` — use this for authenticated requests.

### API Key Management
```bash
# Create API key (requires session + Origin header for CSRF)
curl -s -X POST http://localhost:3000/api/v1/api-keys \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -H 'Cookie: session=<jwt>' \
  -d '{"name":"Test Key"}'

# Get API key by ID (requires session)
curl -s http://localhost:3000/api/v1/api-keys/<id> \
  -H 'Cookie: session=<jwt>'

# List API keys
curl -s http://localhost:3000/api/v1/api-keys \
  -H 'Cookie: session=<jwt>'
```

### Key Pages to Test
- `/` — Landing page (public)
- `/login` — Login page (public)
- `/register` — Registration page (public, requires OTP)
- `/dashboard` — Main dashboard (authenticated)
- `/dashboard/settings/api-keys` — API key management
- `/dashboard/send-sms` — SMS sending
- `/dashboard/templates` — Message templates

## Known Issues

- **vitest ESM error**: `vitest` may fail with `ERR_REQUIRE_ESM` due to CJS/ESM compatibility between vitest and vite. This is a pre-existing repo configuration issue.
- **CI missing secrets**: GitHub Actions tests require `TEST_DB_PASSWORD` secret to be configured in the repo settings.
- **Registration requires OTP**: Cannot register new users locally without SMS OTP. Use `seed-qa.ts` to create test users instead.
- **Prisma engineType**: Do NOT set `engineType = "binary"` in prisma/schema.prisma — it causes engine download failures. Use the default library engine.

## Devin Secrets Needed
- `QA_SEED_PASSWORD` — Password for seeding QA test user (min 10 chars)
