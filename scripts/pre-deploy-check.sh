#!/bin/bash
set -uo pipefail

# ============================================
# Pre-Deploy Checklist — SMSOK Clone
# Run before every production deploy
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check() {
  if eval "$2" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $1"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $1"
    FAIL=$((FAIL + 1))
  fi
}

warn_check() {
  if eval "$2" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $1"
    PASS=$((PASS + 1))
  else
    echo -e "  ${YELLOW}⚠${NC} $1"
    WARN=$((WARN + 1))
  fi
}

echo "================================================"
echo "  SMSOK Clone — Pre-Deploy Checklist"
echo "================================================"
echo ""

# --- Code Quality ---
echo "📋 Code Quality"
check "TypeScript compiles" "bunx tsc --noEmit"
check "Lint passes" "bun run lint"
echo ""

# --- Build ---
echo "🔨 Build"
check "Production build succeeds" "bun run build"
echo ""

# --- Database ---
echo "🗄️  Database"
check "Prisma client generated" "test -d node_modules/.prisma/client"
check "Schema in sync" "bunx prisma db push --skip-generate 2>&1 | grep -q 'already in sync'"
echo ""

# --- Environment ---
echo "🔐 Environment"
check ".env.production.template exists" "test -f .env.production.template"
check ".env file exists" "test -f .env"
check "DATABASE_URL in production template" "grep -q '^DATABASE_URL=' .env.production.template"
check "JWT_SECRET in production template" "grep -q '^JWT_SECRET=' .env.production.template"
check "SMTP config in production template" "grep -q '^SMTP_HOST=' .env.production.template && grep -q '^SMTP_PORT=' .env.production.template && grep -q '^SMTP_USER=' .env.production.template && grep -q '^SMTP_PASS=' .env.production.template && grep -q '^SMTP_FROM=' .env.production.template"
check "JWT_SECRET in .env" "grep -q '^JWT_SECRET=' .env"
check "DATABASE_URL in .env" "grep -q '^DATABASE_URL=' .env"
warn_check "SMTP config in .env" "grep -q '^SMTP_HOST=' .env && grep -q '^SMTP_PORT=' .env && grep -q '^SMTP_USER=' .env && grep -q '^SMTP_PASS=' .env && grep -q '^SMTP_FROM=' .env"
warn_check "REDIS_URL in .env" "grep -q 'REDIS_URL' .env"
warn_check "SMS API in .env" "grep -q 'SMS_API' .env"
echo ""

# --- Docker ---
echo "🐳 Docker"
check "Dockerfile exists" "test -f Dockerfile"
check "docker-compose.prod.yml exists" "test -f docker-compose.prod.yml"
check ".dockerignore exists" "test -f .dockerignore"
echo ""

# --- Security ---
echo "🔒 Security"
check "No hardcoded secrets in auth.ts" "! grep -q 'smsok-dev-secret' lib/auth.ts"
check "Middleware exists" "test -f middleware.ts"
check "Rate limiter exists" "test -f lib/rate-limit.ts"
check "Health endpoints exist" "test -f app/api/health/route.ts"
echo ""

# --- Git ---
echo "📦 Git"
check "On main branch" "test '$(git branch --show-current)' = 'main'"
warn_check "No uncommitted changes" "test -z '$(git status --porcelain | grep -v .env)'"
warn_check "Pushed to remote" "test '$(git rev-parse HEAD)' = '$(git rev-parse origin/main 2>/dev/null)'"
echo ""

# --- Scripts ---
echo "📜 Deploy Scripts"
check "deploy.sh exists" "test -x scripts/deploy.sh"
check "backup.sh exists" "test -x scripts/backup.sh"
check "server-setup.sh exists" "test -x scripts/server-setup.sh"
echo ""

# --- Summary ---
echo "================================================"
TOTAL=$((PASS + FAIL + WARN))
echo -e "  ${GREEN}✓ $PASS passed${NC}  ${RED}✗ $FAIL failed${NC}  ${YELLOW}⚠ $WARN warnings${NC}  ($TOTAL total)"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}❌ NOT READY FOR DEPLOY — fix $FAIL issue(s) first${NC}"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo -e "  ${YELLOW}⚠️  DEPLOY WITH CAUTION — $WARN warning(s)${NC}"
else
  echo -e "  ${GREEN}✅ READY FOR PRODUCTION DEPLOY${NC}"
fi
