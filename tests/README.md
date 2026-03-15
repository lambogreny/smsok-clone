# SMSOK Clone — Test Suite

## โครงสร้าง

```
tests/
├── e2e/                          # Browser E2E Tests (Playwright)
│   ├── 01-landing.spec.ts        # หน้าแรก, navigation, responsive (8 tests)
│   ├── 02-register.spec.ts       # สมัครสมาชิก, validation, OTP (7 tests)
│   ├── 03-login.spec.ts          # Login, logout, session, auth guard (10 tests)
│   ├── 04-dashboard.spec.ts      # Dashboard overview, nav, stats (13 tests)
│   ├── 05-buy-package.spec.ts    # ซื้อแพ็คเกจ, checkout, order (5 tests)
│   ├── 06-payment-slip.spec.ts   # อัพสลิป, verify, resubmit (4 tests)
│   ├── 07-send-sms.spec.ts       # ส่ง SMS, compose, templates (12 tests)
│   ├── 08-sender-names.spec.ts   # จัดการ sender names (9 tests)
│   ├── 09-history-reports.spec.ts # ประวัติ, analytics, activity (8 tests)
│   ├── 10-documents.spec.ts      # ใบเสร็จ, invoice, download (10 tests)
│   ├── 11-settings-profile.spec.ts # โปรไฟล์, password, security (18 tests)
│   ├── 12-error-states.spec.ts   # Empty states, 404, edge cases (18 tests)
│   ├── fixtures.ts               # Test helpers, auth, shared utils
│   ├── global-setup.ts           # Pre-login for authenticated tests
│   └── test-slip.png             # Test slip image for upload tests
├── api/                          # API Layer Tests (Playwright request)
│   ├── auth.test.ts              # Auth endpoints — login, register, 2FA, session (32 tests)
│   ├── orders.test.ts            # Orders — CRUD, payments, slip upload (16 tests)
│   ├── packages.test.ts          # Packages — list, purchase, credits (12 tests)
│   ├── sms.test.ts               # SMS — send, batch, scheduled, logs (18 tests)
│   └── documents.test.ts         # Documents — invoices, senders, contacts (21 tests)
└── README.md
```

## วิธีรัน

### ขั้นตอนแรก — ตรวจสอบ server
```bash
# ตรวจสอบว่า dev server ทำงานอยู่
curl http://localhost:3000/api/health

# ถ้ายังไม่ได้เปิด
cd /Users/lambogreny/oracles/smsok-clone
bun dev:web
```

### รัน E2E Tests ทั้งหมด
```bash
npx playwright test
```

### รันเฉพาะ API Tests
```bash
npx playwright test tests/api/
```

### รันเฉพาะ E2E Tests
```bash
npx playwright test tests/e2e/
```

### รันเฉพาะไฟล์
```bash
npx playwright test 01-landing   # Landing page
npx playwright test 03-login     # Login tests
npx playwright test auth.test    # Auth API tests
```

### ดู Report
```bash
npx playwright show-report
```

### รัน UI Mode (debug)
```bash
npx playwright test --ui
```

## Test Account
| Field | Value |
|-------|-------|
| Email | `qa-judge2@smsok.test` |
| Password | `QAJudge2026!` |

## QA 2-Layer Testing Policy
- **Layer 1: API Tests** — ทุก endpoint, status codes, error cases, validation, security
- **Layer 2: Browser Tests** — real clicks, screenshots, form fills, responsive check
- **PASS = ทั้ง 2 ชั้นผ่าน** ถึงจะรายงาน PASS ได้

## วิธีเพิ่ม Test
1. สร้างไฟล์ `tests/e2e/XX-feature.spec.ts` หรือ `tests/api/feature.test.ts`
2. Import fixtures: `import { test, expect } from "./fixtures";`
3. ใช้ `authedPage` fixture สำหรับ tests ที่ต้อง login
4. Screenshot ทุก step: `await page.screenshot({ path: "test-results/XX-name.png" })`
5. รัน: `npx playwright test XX-feature`
