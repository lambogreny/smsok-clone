# SMSOK Clone — Test Cases

> World-Class E2E Test Suite | ISTQB-aligned | ISO 25010
> Last updated: 2026-03-12

## Severity Definitions
| Level | Description |
|-------|-------------|
| **Critical** | App crash, data loss, security breach, core flow broken |
| **Major** | Feature broken, bad UX, incorrect data display |
| **Minor** | Cosmetic, typo, non-critical UI issue |

---

## 1. Authentication (auth.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-001 | Login with valid credentials | 1. Go to /login 2. Enter demo@smsok.local / (set SEED_PASSWORD env var) 3. Click submit | Redirect to /dashboard | Critical |
| TC-002 | Login with invalid password | 1. Go to /login 2. Enter demo@smsok.local / wrong 3. Click submit | Show error message, stay on /login | Critical |
| TC-003 | Login with empty fields | 1. Go to /login 2. Leave fields empty | Submit button disabled | Major |
| TC-004 | Register new account | 1. Go to /register 2. Fill all fields 3. Submit | Show OTP verification step (same URL, different UI) | Critical |
| TC-005 | Logout | 1. Login 2. Click avatar 3. Click "ออกจากระบบ" | Redirect to /login, session cleared | Critical |
| TC-006 | Cross-tab logout | 1. Login 2. Open 2nd tab /dashboard 3. Logout tab 1 | Tab 2 redirects to /login | Critical |
| TC-007 | Cross-device sessions | 1. Login on 2 incognito contexts 2. Logout context A | Context B remains active (independent JWT) | Major |
| TC-008 | Auth guard — protected routes | 1. Visit /dashboard without login | Redirect to /login | Critical |
| TC-009 | Auth guard — public routes | 1. Visit /dashboard/packages without login | Page accessible (public by design) | Major |
| TC-010 | Forgot password page | 1. Go to /forgot-password | Phone input shown (by design) | Major |
| TC-011 | Session cookie security | 1. Login 2. Check cookie flags | HttpOnly=true, SameSite=Lax | Critical |

## 2. SMS Sending (sms.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-020 | Send SMS page loads | 1. Go to /dashboard/send | Page loads, no errors | Critical |
| TC-021 | Sender dropdown has options | 1. Click sender combobox | Dropdown shows sender options | Critical |
| TC-022 | Fill SMS form | 1. Select sender 2. Enter phone 3. Enter message | All fields accept input | Critical |
| TC-023 | Character counter | 1. Type message in textarea | Char count updates (e.g. "45/70") | Major |
| TC-024 | Message type selector | 1. Check tabs/selector | Thai (70 chars) / English (160 chars) options | Major |
| TC-025 | Send button state — empty form | 1. Load page without filling | Button disabled | Major |
| TC-026 | Send button state — filled form | 1. Fill all required fields | Button enabled | Critical |
| TC-027 | Credit display on send page | 1. Check sidebar/header | SMS credit count visible (e.g. "52,500 SMS") | Major |
| TC-028 | Send with zero credits | 1. Login as 0-credit user 2. Fill form 3. Try send | Button disabled + "เครดิตไม่พอ" warning | Critical |
| TC-029 | XSS in phone field | 1. Enter `<script>alert(1)</script>` in phone | Input escaped, no script execution | Critical |
| TC-030 | XSS in message field | 1. Enter `<img src=x onerror=alert(1)>` in message | Input escaped, no injection | Critical |

## 3. OTP (otp.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-040 | OTP page loads | 1. Go to /dashboard/otp | Page loads with form | Critical |
| TC-041 | OTP send form | 1. Fill phone number 2. Click send | OTP sent, ref code shown | Critical |
| TC-042 | OTP credit check | 1. Check if credit warning shows for 0-credit user | Warning + disabled button | Critical |

## 4. Packages & Purchase (packages.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-050 | Packages page loads | 1. Go to /dashboard/packages | Shows package cards with prices | Critical |
| TC-051 | Package cards display | 1. Check cards | SMS amount + price (฿) visible per card | Major |
| TC-052 | Click package to purchase | 1. Click package card | Navigate to checkout or open dialog | Critical |
| TC-053 | Checkout Step 1 — Summary | 1. Select package 2. View checkout | Package name, price, VAT info shown | Critical |
| TC-054 | Checkout Step 2 — Bank info | 1. Click next in step 1 | Bank account, copy button, countdown timer | Critical |
| TC-055 | Checkout Step 3 — Upload slip | 1. Complete step 2 | File upload input, confirm button | Critical |
| TC-056 | VAT 7% calculation | 1. Check pricing on checkout | Price + VAT 7% = correct total | Major |
| TC-057 | WHT 3% deduction | 1. Check if WHT option exists | WHT 3% deducted from total if enabled | Major |
| TC-058 | Packages public access | 1. Visit /packages without auth | Page accessible (no auth required) | Major |

## 5. Billing (billing.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-060 | Billing page loads | 1. Go to /dashboard/billing | Page loads with transaction info | Major |
| TC-061 | Transaction list | 1. Check billing page | Shows transaction history or empty state | Major |
| TC-062 | Invoice info | 1. Check for invoice elements | Invoice/ใบกำกับภาษี section present | Major |
| TC-063 | Credit balance | 1. Go to /dashboard/credits | SMS balance displayed correctly | Major |
| TC-064 | Topup/Buy button | 1. Check credits page | Buy/เติมเครดิต button present | Major |

## 6. Contacts (contacts.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-070 | Contacts list | 1. Go to /dashboard/contacts | Table with contacts displayed | Critical |
| TC-071 | Add contact | 1. Click "Quick Add" 2. Fill form 3. Submit | Contact added to list | Critical |
| TC-072 | Search contacts | 1. Type in search input | Results filtered | Major |
| TC-073 | Checkbox selection | 1. Click checkboxes | Contacts selected, bulk action available | Major |
| TC-074 | Contact groups | 1. Go to /dashboard/contacts/groups | Groups list displayed | Major |
| TC-075 | Tags page | 1. Go to /dashboard/tags | Tags list displayed | Minor |

## 7. Templates (templates.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-080 | Templates list | 1. Go to /dashboard/templates | Template list displayed | Major |
| TC-081 | Create template | 1. Click "สร้างใหม่" 2. Fill name + content 3. Save | Template created, appears in list | Critical |
| TC-082 | Edit template | 1. Click template 2. Edit 3. Save | Changes saved | Major |
| TC-083 | Delete template | 1. Click delete on template 2. Confirm | Template removed | Major |

## 8. Campaigns (campaigns.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-090 | Campaigns list | 1. Go to /dashboard/campaigns | Campaign list or empty state | Major |
| TC-091 | Create campaign | 1. Click create 2. Fill form | Campaign creation form with all fields | Critical |

## 9. Settings (settings.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-100 | General settings | 1. Go to /dashboard/settings | Profile form with inputs | Major |
| TC-101 | Security settings | 1. Go to /settings/security | Security options displayed | Major |
| TC-102 | API Keys | 1. Go to /settings/api-keys | Key list + create button | Major |
| TC-103 | Webhooks | 1. Go to /settings/webhooks | Webhook list + create button | Major |
| TC-104 | Team management | 1. Go to /settings/team | Team member list + invite | Major |
| TC-105 | Roles | 1. Go to /settings/roles | Role list + create | Major |

## 10. Navigation & Regression (navigation.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-110 | All dashboard routes load | 1. Visit each /dashboard/* route | HTTP 200, no error page | Critical |
| TC-111 | Sidebar links | 1. Click each sidebar link | Navigate to correct page | Major |
| TC-112 | 404 handling | 1. Visit /dashboard/nonexistent | 404 page or redirect | Minor |
| TC-113 | Console errors | 1. Visit key pages 2. Check console | No JS errors | Major |
| TC-114 | Hydration match | 1. Load SSR page | No hydration mismatch warnings | Minor |

## 11. Responsive (responsive.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-120 | Mobile 375px | 1. Set viewport 375x812 2. Visit dashboard | No overflow, sidebar hidden | Major |
| TC-121 | Mobile send SMS | 1. 375px viewport 2. Visit /send | Form usable, button visible | Major |
| TC-122 | Tablet 768px | 1. Set viewport 768x1024 | Layout adapts | Minor |
| TC-123 | Desktop 1440px | 1. Set viewport 1440x900 | Full layout, sidebar visible | Minor |

## 12. Security (security.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-130 | XSS all inputs | 1. Enter XSS payload in every input | All escaped | Critical |
| TC-131 | Session cookie flags | 1. Check HttpOnly, Secure, SameSite | HttpOnly=true, SameSite=Lax | Critical |
| TC-132 | CSRF protection | 1. Check middleware for CSRF | CSRF token required on mutations | Critical |
| TC-133 | Auth bypass | 1. Access API without session | 401 returned | Critical |

## 13. PDPA (pdpa.spec.ts)

| ID | Description | Steps | Expected | Severity |
|----|-------------|-------|----------|----------|
| TC-140 | PDPA page loads | 1. Go to /dashboard/pdpa | Privacy settings displayed | Major |
| TC-141 | Toggle privacy | 1. Click privacy toggle | State changes (checked ↔ unchecked) | Major |

---

## Run Instructions
```bash
# All tests
bun test:e2e

# Specific suite
bun test:e2e:auth
bun test:e2e:sms

# With report
npx playwright test --reporter=html
npx playwright show-report
```
