#!/bin/bash
# Task #127 FINAL RETEST — 3 HIGH bugs
# Run: cd /Users/lambogreny/oracles/smsok-clone && bash qa/test-plans/task-127-final-retest.sh

echo "═══════════════════════════════════════"
echo "Task #127 FINAL RETEST — 3 HIGH bugs"
echo "═══════════════════════════════════════"
echo ""

PASS=0
FAIL=0

# ── H1: BANNED backdrop-blur ──
echo "=== H1: backdrop-blur (must be ZERO) ==="
BLUR=$(grep -rn "backdrop-blur\|blur-\[" \
  components/ui/CustomSelect.tsx \
  app/\(dashboard\)/dashboard/credits/page.tsx \
  app/\(dashboard\)/dashboard/settings/page.tsx \
  2>/dev/null | grep -v "//.*blur" | wc -l | tr -d ' ')
if [ "$BLUR" = "0" ]; then
  echo "✅ H1 PASS — zero backdrop-blur found"
  PASS=$((PASS+1))
else
  echo "❌ H1 FAIL — $BLUR backdrop-blur references found:"
  grep -rn "backdrop-blur\|blur-\[" \
    components/ui/CustomSelect.tsx \
    app/\(dashboard\)/dashboard/credits/page.tsx \
    app/\(dashboard\)/dashboard/settings/page.tsx \
    2>/dev/null | grep -v "//.*blur"
  FAIL=$((FAIL+1))
fi
echo ""

# ── H2: BANNED violet ──
echo "=== H2: violet color (must be ZERO) ==="
VIOLET=$(grep -rn "violet" \
  components/ui/CustomSelect.tsx \
  components/ui/SenderDropdown.tsx \
  app/\(dashboard\)/dashboard/analytics/AnalyticsContent.tsx \
  app/\(dashboard\)/dashboard/credits/page.tsx \
  app/\(dashboard\)/dashboard/api-docs/page.tsx \
  2>/dev/null | grep -v "//.*violet" | wc -l | tr -d ' ')
if [ "$VIOLET" = "0" ]; then
  echo "✅ H2 PASS — zero violet references found"
  PASS=$((PASS+1))
else
  echo "❌ H2 FAIL — $VIOLET violet references found:"
  grep -rn "violet" \
    components/ui/CustomSelect.tsx \
    components/ui/SenderDropdown.tsx \
    app/\(dashboard\)/dashboard/analytics/AnalyticsContent.tsx \
    app/\(dashboard\)/dashboard/credits/page.tsx \
    app/\(dashboard\)/dashboard/api-docs/page.tsx \
    2>/dev/null | grep -v "//.*violet"
  FAIL=$((FAIL+1))
fi
echo ""

# ── H3: X-Request-Id wired ──
echo "=== H3: X-Request-Id in responses ==="
curl -s -c /tmp/qa-final.txt http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-suite@smsok.test","password":"$E2E_USER_PASSWORD"}' > /dev/null 2>&1

REQID=$(curl -s -D - http://localhost:3000/api/v1/tos \
  -H "Authorization: Bearer sk_live_qa_test_live_key_abcdef1234567890" 2>&1 | grep -i "x-request-id")
if [ -n "$REQID" ]; then
  echo "✅ H3 PASS — X-Request-Id found: $REQID"
  PASS=$((PASS+1))
else
  echo "❌ H3 FAIL — no X-Request-Id header in response"
  FAIL=$((FAIL+1))
fi
echo ""

# ── BONUS: Full banned pattern scan ──
echo "=== BONUS: Full banned pattern scan ==="
FULL_BANNED=$(grep -rn "backdrop-blur\|violet\|pink\|fuchsia\|magenta" \
  app/ components/ --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|\.next\|//.*violet\|//.*blur\|dialog.tsx\|sheet.tsx\|alert-dialog.tsx" \
  | wc -l | tr -d ' ')
echo "Total banned patterns in app/+components/: $FULL_BANNED"
if [ "$FULL_BANNED" = "0" ]; then
  echo "✅ BONUS PASS — zero banned patterns"
else
  echo "⚠️  $FULL_BANNED banned patterns remain (may include shadcn defaults)"
  grep -rn "backdrop-blur\|violet\|pink\|fuchsia\|magenta" \
    app/ components/ --include="*.tsx" 2>/dev/null \
    | grep -v "node_modules\|\.next\|//.*violet\|//.*blur\|dialog.tsx\|sheet.tsx\|alert-dialog.tsx" \
    | head -15
fi
echo ""

# ── SUMMARY ──
echo "═══════════════════════════════════════"
echo "SCORE: $PASS PASS / $FAIL FAIL"
if [ "$FAIL" = "0" ]; then
  echo "🟢 ALL CLEAR — PRODUCTION READY!"
else
  echo "🔴 $FAIL bugs remaining — NOT ready"
fi
echo "═══════════════════════════════════════"
