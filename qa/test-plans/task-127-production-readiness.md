# Task #127 — FINAL Production Readiness Test
**QA ผู้พิพากษา | Deadline: เช้า 2026-03-11**

## Nansen v2 Color Spec (UPDATED!)
```
bg:         #0b1118
card:       #10161c
border:     #20252c (neutral gray, NOT navy)
foreground: #b2bacd (NOT pure white)
accent:     #00E2B5
gradient:   #00E2B3 → #3298DA
BANNED:     glass/blur/glow/violet/pink = ZERO TOLERANCE
```

---

## 6 Test Categories

### CAT-1: Nansen v2 Colors (ทุกหน้า)
```javascript
// Browser evaluate script for color verification
(function() {
  const spec = {
    bg: '#0b1118',
    card: '#10161c',
    border: '#20252c',
    foreground: '#b2bacd',
    accent: '#00e2b5',
  };
  const BANNED = /glass|blur|glow|violet|pink|backdrop-filter|box-shadow.*glow/i;
  const results = { page: location.pathname, pass: true, issues: [] };

  // Check body bg
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  results.bodyBg = bodyBg;

  // Check all stylesheets for banned patterns
  const sheets = document.querySelectorAll('style');
  sheets.forEach(s => {
    if (BANNED.test(s.textContent || '')) {
      results.pass = false;
      results.issues.push('BANNED pattern in stylesheet');
    }
  });

  // Check computed styles for violet/pink
  const allEls = document.querySelectorAll('*');
  let checked = 0;
  for (const el of allEls) {
    if (checked++ > 500) break;
    const style = getComputedStyle(el);
    const color = style.color + style.backgroundColor + style.borderColor;
    if (/violet|pink|fuchsia|magenta/i.test(color)) {
      results.pass = false;
      results.issues.push('Banned color on ' + el.tagName + '.' + el.className);
    }
  }

  return JSON.stringify(results, null, 2);
})();
```

**Pages to check:** ALL 24 pages

### CAT-2: DNA Layout
- [ ] Page: full width, NO max-width constraint
- [ ] Table: padding 12px 16px, sticky header, striped rows
- [ ] Sidebar: 240px fixed width
- [ ] Tags page: redesigned per Nansen DNA
- [ ] Campaigns page: redesigned per Nansen DNA

```javascript
// Table verification script
(function() {
  const tables = document.querySelectorAll('table');
  const results = { tables: [] };
  tables.forEach((t, i) => {
    const thead = t.querySelector('thead, [role="columnheader"]');
    const firstRow = t.querySelector('tbody tr, [role="row"]');
    const theadStyle = thead ? getComputedStyle(thead) : null;
    const cellStyle = firstRow?.querySelector('td') ? getComputedStyle(firstRow.querySelector('td')) : null;
    results.tables.push({
      index: i,
      stickyHeader: theadStyle?.position === 'sticky',
      headerPadding: theadStyle?.padding,
      cellPadding: cellStyle?.padding,
      rows: t.querySelectorAll('tbody tr').length,
    });
  });
  // Sidebar width
  const sidebar = document.querySelector('[data-sidebar], nav, aside');
  if (sidebar) results.sidebarWidth = getComputedStyle(sidebar).width;
  return JSON.stringify(results, null, 2);
})();
```

### CAT-3: All Pages Load (no 500, no runtime errors)
```bash
# Auth pages
for path in /login /register /forgot-password /2fa; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path")
  echo "$path: HTTP $STATUS"
done

# Dashboard pages (need session cookie)
curl -s -c /tmp/qa-prod.txt http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-suite@smsok.test","password":"$E2E_USER_PASSWORD"}' > /dev/null

for path in /dashboard /dashboard/send /dashboard/messages /dashboard/contacts \
  /dashboard/groups /dashboard/templates /dashboard/campaigns /dashboard/scheduled \
  /dashboard/otp /dashboard/analytics /dashboard/credits /dashboard/topup \
  /dashboard/api-keys /dashboard/senders /dashboard/tags /dashboard/logs \
  /dashboard/settings /dashboard/api-docs /dashboard/docs; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/qa-prod.txt "http://localhost:3000$path")
  echo "$path: HTTP $STATUS"
done
```

### CAT-4: Security Regression
```bash
# SSRF (all formats must be blocked)
cd /Users/lambogreny/oracles/smsok-clone && npx tsx --no-cache -e "
import {isObviouslyInternalUrl} from './lib/url-safety.js';
const ssrf = [
  'http://127.0.0.1', 'http://[::1]', 'http://[::ffff:7f00:1]',
  'http://[::ffff:127.0.0.1]', 'http://10.0.0.1', 'http://169.254.169.254',
  'http://[::ffff:a9fe:a9fe]', 'http://localhost',
];
let pass = 0;
for (const url of ssrf) {
  const blocked = isObviouslyInternalUrl(url);
  console.log(blocked ? '✅' : '❌', url);
  if (blocked) pass++;
}
console.log('SSRF:', pass + '/' + ssrf.length);
"

# Rate limiting (before JWT)
for i in $(seq 1 12); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/2fa/verify \
    -X POST -H "Content-Type: application/json" -d '{"code":"000000","challengeToken":"fake"}')
  echo "Request $i: HTTP $STATUS"
done
# Expect: 10x 401, then 429

# OTP cooldown states
curl -s -c /tmp/qa-otp.txt http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-suite@smsok.test","password":"$E2E_USER_PASSWORD"}' > /dev/null
# Generate OTP and check cooldownState in response
```

### CAT-5: Responsive (375/393/768/1440px)
```
Browser MCP tests at each breakpoint:
1. browser_navigate → login page
2. Set viewport width
3. browser_screenshot
4. Check: no horizontal overflow, readable text, functional buttons
5. Repeat for dashboard pages (home, contacts, send)
```

### CAT-6: Backend Logging
```bash
# X-Request-Id header
curl -s -I http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' 2>&1 | grep -i x-request-id

# Structured logs (Pino format)
# Check server terminal output for JSON formatted logs
```

---

## Agent Deployment Plan (5 parallel)

| Agent | Categories | Pages | Est. |
|-------|-----------|-------|------|
| 1 | CAT-3 (All Pages Load) | ALL 24 pages | 10min |
| 2 | CAT-1 (Colors) + CAT-2 (Layout) | Auth 4 + Dashboard core 6 | 15min |
| 3 | CAT-1 (Colors) + CAT-2 (Layout) | Dashboard remaining 14 | 15min |
| 4 | CAT-4 (Security) | SSRF + Rate Limit + OTP | 10min |
| 5 | CAT-5 (Responsive) + CAT-6 (Logging) | Key pages × 4 viewports | 20min |

**Total: ~20min parallel execution**

## Sign-off
ALL PASS = `oracle_task_done(127, "ALL PASS")` + `maw hey lead-dev "✅ PRODUCTION READY"`
ANY FAIL = report to lead-dev immediately with bug details
