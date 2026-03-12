# EMERGENCY Browser Test Checklist — Deadline เช้า 2026-03-11
**QA ผู้พิพากษา | Zero bugs before Human wakes up!**

---

## Test Criteria (ทุกหน้าต้องผ่านทั้ง 6 ข้อ)

| # | Criteria | Method |
|---|----------|--------|
| 1 | หน้าเข้าได้ ไม่มี runtime error | Navigate + console check |
| 2 | สี Nansen DNA ตาม spec | Visual + CSS inspect |
| 3 | Layout consistent ทุกหน้า | Screenshot compare |
| 4 | Table spacious + sticky header | Scroll test |
| 5 | Zero bugs | Full functional test |
| 6 | Responsive 375/768/1440px | Viewport resize |

### Nansen DNA Color Spec
- bg-primary: #06080b
- accent: #00E2B5
- table-header: #093A57
- table-stripe: #042133
- hover: #000
- font: Inter
- NO glass/blur/glow effects

---

## Pages to Test (24 pages)

### AUTH PAGES (4)
| # | Page | URL | Priority |
|---|------|-----|----------|
| A1 | Login | /login | P0 |
| A2 | Register | /register | P0 |
| A3 | Forgot Password | /forgot-password | P1 |
| A4 | 2FA | /2fa | P1 |

### DASHBOARD PAGES (20)
| # | Page | URL | Priority |
|---|------|-----|----------|
| D1 | Dashboard Home | /dashboard | P0 |
| D2 | Send SMS | /dashboard/send | P0 |
| D3 | Messages | /dashboard/messages | P0 |
| D4 | Contacts | /dashboard/contacts | P0 |
| D5 | Groups | /dashboard/groups | P0 |
| D6 | Templates | /dashboard/templates | P1 |
| D7 | Campaigns | /dashboard/campaigns | P1 |
| D8 | Scheduled | /dashboard/scheduled | P1 |
| D9 | OTP | /dashboard/otp | P1 |
| D10 | Analytics | /dashboard/analytics | P1 |
| D11 | Credits | /dashboard/credits | P1 |
| D12 | Top Up | /dashboard/topup | P1 |
| D13 | API Keys | /dashboard/api-keys | P1 |
| D14 | Senders | /dashboard/senders | P1 |
| D15 | Tags | /dashboard/tags | P1 |
| D16 | Logs | /dashboard/logs | P1 |
| D17 | Settings | /dashboard/settings | P0 |
| D18 | API Docs | /dashboard/api-docs | P2 |
| D19 | Docs | /dashboard/docs | P2 |
| D20 | Group Detail | /dashboard/groups/[id] | P1 |

---

## Execution Plan — 5 Parallel Agents

### Agent 1: Auth Pages (A1-A4)
```
For each page:
1. browser_navigate(url)
2. browser_screenshot() — full page
3. browser_evaluate("JSON.stringify(console.errors || [])")
4. Check Nansen colors: bg #06080b, accent #00E2B5, Inter font
5. Check responsive: resize 375px, 768px, 1440px → screenshot each
6. Functional: form inputs, buttons, validation messages
```

### Agent 2: Dashboard Core (D1-D5)
```
1. Login first → get session
2. Navigate each page → screenshot
3. Console error check
4. Table tests: sticky header (scroll down), spacious rows, stripe colors
5. Nansen color verification
6. Responsive 3 breakpoints
```

### Agent 3: Dashboard SMS/Campaign (D6-D9, D2)
```
1. Login → navigate templates, campaigns, scheduled, OTP, send
2. Screenshot each
3. Form interactions: create template, schedule SMS
4. Table/list layouts
5. Responsive check
```

### Agent 4: Dashboard Finance/API (D10-D16)
```
1. Login → navigate analytics, credits, topup, api-keys, senders, tags, logs
2. Screenshot each
3. Chart/graph rendering (analytics)
4. Table layouts + pagination
5. Responsive check
```

### Agent 5: Settings + Docs + Edge Cases (D17-D20)
```
1. Login → settings, api-docs, docs, group detail
2. Screenshot each
3. Settings form: profile edit, password change
4. Navigation: sidebar active state, breadcrumbs
5. Empty states: pages with no data
6. Edge: double-click buttons, back button after form submit
```

---

## Per-Page Test Script Template

```javascript
// Run via browser_evaluate on each page
(function() {
  const results = {
    url: window.location.href,
    title: document.title,
    errors: [],
    warnings: [],
    colors: {},
    layout: {}
  };

  // 1. Console errors
  // (captured by browser MCP)

  // 2. Nansen DNA colors
  const body = getComputedStyle(document.body);
  results.colors.bg = body.backgroundColor;
  results.colors.font = body.fontFamily;

  // 3. Check for hardcoded colors (non-variable)
  const allElements = document.querySelectorAll('*');
  let hardcodedCount = 0;
  // (sample check)

  // 4. Tables
  const tables = document.querySelectorAll('table');
  tables.forEach((t, i) => {
    const thead = t.querySelector('thead');
    if (thead) {
      const pos = getComputedStyle(thead).position;
      results.layout['table_' + i + '_sticky'] = pos === 'sticky';
    }
  });

  // 5. Interactive elements
  const buttons = document.querySelectorAll('button');
  const links = document.querySelectorAll('a');
  results.layout.buttons = buttons.length;
  results.layout.links = links.length;

  return JSON.stringify(results, null, 2);
})();
```

---

## Responsive Breakpoints

| Breakpoint | Device | Viewport |
|-----------|--------|----------|
| 375px | iPhone SE | Mobile small |
| 768px | iPad | Tablet |
| 1440px | Desktop | Full width |

### Mobile-specific checks:
- [ ] Sidebar collapses to hamburger menu
- [ ] Tables switch to card layout (or horizontal scroll)
- [ ] Touch targets >= 44x44px
- [ ] No horizontal overflow
- [ ] Font readable without zoom

---

## Bug Severity for EMERGENCY

| Severity | Action | Example |
|----------|--------|---------|
| BLOCKER | Fix before Human | Page crashes, 500 error, data loss |
| CRITICAL | Fix before Human | Auth broken, wrong data shown |
| HIGH | Fix before Human | Layout broken, missing features |
| MEDIUM | Can ship with note | Minor alignment, color slightly off |
| LOW | Backlog | Cosmetic, nice-to-have |

**BLOCKER/CRITICAL/HIGH = must fix tonight. MEDIUM/LOW = can ship.**

---

## Sign-off Criteria

ALL of these must be true before declaring "QA PASS":
- [ ] 24/24 pages load without runtime error
- [ ] 0 BLOCKER/CRITICAL/HIGH bugs
- [ ] Nansen DNA colors correct on all pages
- [ ] Tables spacious with sticky headers
- [ ] Responsive pass at 375/768/1440px
- [ ] Auth flow works end-to-end (login → dashboard → features)
- [ ] No console errors on any page

When ALL pass: `maw hey lead-dev "✅ QA ALL CLEAR — พร้อมส่ง Human"`
