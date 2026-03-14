#!/bin/bash
# ============================================
# SMSOK Smoke Test — Pre/Post-Deploy Quality Gate
# Run: bash tests/smoke-test.sh [BASE_URL] [ADMIN_URL]
# Local:  bash tests/smoke-test.sh
# Prod:   bash tests/smoke-test.sh https://smsok.9phum.me https://admin.smsok.9phum.me
# ============================================
set -e

BASE="${1:-http://localhost:3000}"
ADMIN="${2:-http://localhost:3001}"
PASS=0
FAIL=0
TOTAL=0

green() { printf "\033[32m✓ %s\033[0m\n" "$1"; }
red() { printf "\033[31m✗ %s\033[0m\n" "$1"; }

check() {
  TOTAL=$((TOTAL + 1))
  local name="$1" url="$2" expected="${3:-200}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    green "$name (HTTP $status)"
    PASS=$((PASS + 1))
  else
    red "$name — expected $expected, got $status"
    FAIL=$((FAIL + 1))
  fi
}

check_json() {
  TOTAL=$((TOTAL + 1))
  local name="$1" url="$2" key="$3"
  local body
  body=$(curl -s --max-time 10 "$url" 2>/dev/null || echo "{}")
  if echo "$body" | grep -q "$key"; then
    green "$name"
    PASS=$((PASS + 1))
  else
    red "$name — key '$key' not found in response"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=========================================="
echo "  SMSOK Smoke Test"
echo "  Clone: $BASE"
echo "  Admin: $ADMIN"
echo "=========================================="
echo ""

# --- 0. SSL Check (production only) ---
if [[ "$BASE" == https://* ]]; then
  echo "--- SSL Certificate ---"
  TOTAL=$((TOTAL + 1))
  SSL_EXPIRY=$(echo | openssl s_client -servername "${BASE#https://}" -connect "${BASE#https://}:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$SSL_EXPIRY" ]; then
    green "SSL certificate valid (expires: $SSL_EXPIRY)"
    PASS=$((PASS + 1))
  else
    red "SSL certificate check failed"
    FAIL=$((FAIL + 1))
  fi
  echo ""
fi

# --- 1. Health & Static Pages ---
echo "--- Health & Static Pages ---"
check "Homepage" "$BASE/"
check "Login page" "$BASE/login"
check "Register page" "$BASE/register"
check "Pricing page" "$BASE/pricing"
check "Terms page" "$BASE/terms"
check "Privacy page" "$BASE/privacy"
check "Help page" "$BASE/help"
check "Status page" "$BASE/status"

# --- 2. API Health ---
echo ""
echo "--- API Health ---"
check "API health" "$BASE/api/health"
check_json "API health JSON" "$BASE/api/health" "status"

# --- 3. Auth Endpoints ---
echo ""
echo "--- Auth Endpoints ---"
check "Login API (GET = 405 Method Not Allowed)" "$BASE/api/auth/login" "405"
check "Register API (GET = 405 Method Not Allowed)" "$BASE/api/auth/register" "405"

# --- 4. Protected Routes (should redirect/401) ---
echo ""
echo "--- Protected Routes ---"
check "Dashboard (no auth = redirect)" "$BASE/dashboard" "307"
check "Send SMS (no auth = redirect)" "$BASE/dashboard/send" "307"

# --- 5. Backoffice ---
echo ""
echo "--- Backoffice ---"
check "Admin login page (auth guard redirect)" "$ADMIN/" "307"
check "Admin API (no auth = 401)" "$ADMIN/api/admin/customers" "401"

# --- Summary ---
echo ""
echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed (total: $TOTAL)"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  echo ""
  red "SMOKE TEST FAILED — $FAIL issues found. DO NOT DEPLOY."
  exit 1
else
  echo ""
  green "ALL SMOKE TESTS PASSED — ready for deploy."
  exit 0
fi
