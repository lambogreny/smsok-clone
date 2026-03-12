# Task #103 — Test Plans for 4 New Specs
**QA ผู้พิพากษา | 2026-03-10**

---

## SPEC 1: OTP Rate Limiting

### Current State (from source code analysis)
- DB-based: 3 OTPs per phone per 10 min (`lib/actions/otp.ts:73-81`)
- IP-based: `otp_generate` 3/10min, `otp_verify` 10/15min (`lib/rate-limit.ts:36-37`)
- Per-OTP: 5 verify attempts then lock (`MAX_ATTEMPTS = 5`)
- Bypass code: 6 digits required, non-production only

### Test Plan

#### TP-1.1: OTP Generate Rate Limit (per phone)
```
Steps:
1. POST /api/auth/register/otp × 3 with same phone → should succeed
2. POST /api/auth/register/otp × 4th with same phone → expect 400 "ส่ง OTP บ่อยเกินไป"
3. POST /api/auth/register/otp with DIFFERENT phone → should succeed (per-phone, not global)

Expected: 3/10min per phone number enforced
Verify: HTTP 400 with Thai rate limit message
```

#### TP-1.2: OTP Generate Rate Limit (per IP)
```
Steps:
1. Send 3 OTP generate requests from same IP → should succeed
2. 4th request from same IP → expect 429 Too Many Requests
3. Verify Retry-After header present

Expected: IP-based rate limiting works independently from phone-based
Verify: HTTP 429 + Retry-After header
```

#### TP-1.3: OTP Verify Attempt Lock
```
Steps:
1. Generate OTP → get ref code
2. Verify with wrong code × 5 → should show "เหลือ X ครั้ง" countdown
3. 5th wrong attempt → expect "ถูกล็อคแล้ว กรุณาขอรหัสใหม่"
4. 6th attempt with CORRECT code → should still be locked

Expected: MAX_ATTEMPTS=5 enforced, lock is permanent for that OTP
Verify: Error messages + attempt countdown accurate
```

#### TP-1.4: OTP Verify IP Rate Limit
```
Steps:
1. Send 10 verify requests from same IP → should get 401/400 errors
2. 11th request → expect 429

Expected: 10 verify attempts per 15min per IP
Verify: HTTP 429 after threshold
```

#### TP-1.5: OTP Expiry
```
Steps:
1. Generate OTP → wait >5 min (or mock time)
2. Verify with correct code → expect "OTP หมดอายุแล้ว"

Expected: 5-minute expiry enforced
```

#### TP-1.6: OTP Replay Prevention
```
Steps:
1. Generate + verify OTP successfully
2. Try verifying same OTP again → expect "ถูกใช้งานแล้ว"

Expected: One-time use enforced
```

#### TP-1.7: Timing-Safe Comparison
```
Verify: hashOtp uses HMAC-SHA256, comparison uses crypto.timingSafeEqual
Source: lib/actions/otp.ts:41-44
This is code review, not runtime test
```

---

## SPEC 2: Password Policy

### Current State
- Only check: `newPassword.length < 8` (`lib/actions.ts:194`)
- No complexity requirements (uppercase, number, special char)

### Test Plan

#### TP-2.1: Minimum Length
```
Steps:
1. Register/change password with 7 chars → expect rejection
2. Register with exactly 8 chars → expect success
3. Register with 128 chars → expect success (or max limit check)

Expected: Min 8 characters enforced
```

#### TP-2.2: Complexity Requirements (if spec adds them)
```
Steps:
1. Password "abcdefgh" (no uppercase/number) → test against new policy
2. Password "Abcdefg1" (meets typical policy) → expect success
3. Password "12345678" (numbers only) → test against policy
4. Password "ABCDEFGH" (uppercase only) → test against policy

Expected: Per spec requirements (uppercase? number? special char?)
Note: Adjust tests based on actual spec delivered
```

#### TP-2.3: Password Strength Indicator (if UI spec includes it)
```
Steps:
1. Navigate to register/change password page
2. Type weak password → check strength meter shows "weak"
3. Type medium password → shows "medium"
4. Type strong password → shows "strong"
5. Screenshot each state

Expected: Visual feedback matches policy
```

#### TP-2.4: Password Change Rate Limit
```
Steps:
1. Change password 5 times in 15 min → should succeed
2. 6th change → expect 429 (rate-limit.ts: password 5/15min)

Expected: Rate limiting on password changes
```

#### TP-2.5: Error Message Quality
```
Steps:
1. Submit invalid password → check error message is specific
2. Should say WHAT is wrong, not just "รหัสผ่านไม่ถูกต้อง"
3. Verify error returns 400 (not 500) — check apiError "ต้อง" keyword

Expected: Actionable Thai error message + HTTP 400
```

#### TP-2.6: Edge Cases
```
Steps:
1. Password with only spaces "        " → should reject
2. Password with Thai characters "รหัสผ่าน1A!" → test acceptance
3. Password with emoji "🔑Password1" → test handling
4. Password === email → should reject (if policy specifies)
5. Common passwords "password", "12345678" → test against blocklist (if any)
```

---

## SPEC 3: Animation 60fps

### Test Plan

#### TP-3.1: Page Transition Performance
```
Tools: Browser MCP + Chrome DevTools Performance
Steps:
1. Navigate between pages (dashboard → contacts → settings)
2. Open DevTools Performance tab → record
3. Check frame rate during transitions
4. Screenshot Performance timeline

Expected: Consistent 60fps (16.67ms per frame), no jank
Red flags: Frames >33ms (dropped below 30fps)
```

#### TP-3.2: Loading State Animations
```
Steps:
1. Trigger data loading (contacts list, SMS history)
2. Observe skeleton/spinner animation
3. Check for smooth appearance/disappearance

Expected: No layout shift, smooth opacity/transform transitions
```

#### TP-3.3: Modal Open/Close
```
Steps:
1. Open modal (create webhook, add contact, etc.)
2. Close modal
3. Verify: opacity fade + scale/translate transform
4. No scroll jump on open/close

Expected: Smooth 200-300ms transition, no flicker
```

#### TP-3.4: Table/List Scroll Performance
```
Steps:
1. Load contacts page with 100+ items
2. Scroll rapidly up and down
3. Check for scroll jank in DevTools

Expected: Smooth scroll, no paint storms
Check: Virtual scrolling if list >1000 items
```

#### TP-3.5: Mobile Touch Interactions
```
Viewports: 375px (iPhone SE), 393px (iPhone 15)
Steps:
1. Swipe between views (if applicable)
2. Touch and hold (long press)
3. Pull to refresh (if implemented)
4. Tap feedback animation

Expected: Responsive touch feedback <100ms, smooth animations
```

#### TP-3.6: Reduced Motion
```
Steps:
1. Enable "Reduce Motion" in OS settings
2. Navigate through app
3. Verify: animations are reduced/disabled
4. Check: prefers-reduced-motion media query respected

Expected: Smooth static transitions (instant or very short)
```

#### TP-3.7: CSS vs JS Animation Check
```
Code review:
1. Grep for requestAnimationFrame, setInterval animation
2. Verify transforms use GPU-accelerated properties (transform, opacity)
3. No top/left/width/height animations (cause reflow)
4. Check will-change hints on animated elements
```

---

## SPEC 4: Color Palette CSS Variables

### Current State (Nansen DNA)
- Background: #06080b
- Accent: #00E2B5
- Font: Inter
- Table header: #093A57
- Striped rows: #042133
- Hover: #000
- Checkbox accent: #00E2B5

### Test Plan

#### TP-4.1: CSS Variable Definitions
```
Steps:
1. Inspect :root or [data-theme] in CSS
2. Verify all Nansen DNA colors defined as CSS variables
3. Expected variables:
   --color-bg-primary: #06080b
   --color-accent: #00E2B5
   --color-table-header: #093A57
   --color-table-stripe: #042133
   --color-hover: #000
   (names may vary — check actual implementation)

Expected: All colors use CSS custom properties, not hardcoded hex
```

#### TP-4.2: Component Color Consistency
```
Pages to check: login, register, dashboard, contacts, settings, webhooks, billing
Steps:
1. Screenshot each page
2. Inspect key elements: buttons, links, headings, cards, tables
3. Verify all use CSS variables (not hardcoded)
4. Check hover/focus/active states use variable-derived colors

Expected: Zero hardcoded colors in components
```

#### TP-4.3: Dark Mode / Theme Switching (if applicable)
```
Steps:
1. Check if theme toggle exists
2. Switch theme → verify all colors change via CSS variables
3. No flash of wrong theme on page load

Expected: Instant theme switch via CSS variable override
```

#### TP-4.4: Contrast Accessibility (WCAG AA)
```
Steps:
1. Text on #06080b background → check contrast ratio
2. #00E2B5 accent on dark bg → check readability
3. Button text contrast
4. Use browser_evaluate to calculate: document.querySelectorAll('[style*="color"]')

Minimum: 4.5:1 for normal text, 3:1 for large text (WCAG AA)
Tools: Lighthouse accessibility audit or manual calculation
```

#### TP-4.5: Responsive Color Consistency
```
Viewports: 375px, 393px, 768px, 1440px
Steps:
1. Screenshot at each breakpoint
2. Verify same color palette across all sizes
3. No color discrepancies between mobile/desktop

Expected: Identical color usage across breakpoints
```

#### TP-4.6: Interactive State Colors
```
Elements: buttons, inputs, links, checkboxes, toggles
States: default, hover, focus, active, disabled, error
Steps:
1. Cycle through each state
2. Screenshot + verify color is from CSS variable
3. Focus ring visible and accessible

Expected: Consistent state colors from palette variables
```

#### TP-4.7: Print Stylesheet (if applicable)
```
Steps:
1. Print preview → check colors adapt
2. Dark backgrounds should become light for printing
3. Accent colors should be print-friendly
```

---

## Execution Strategy

| Phase | Specs | Method | Est. Time |
|-------|-------|--------|-----------|
| 1 | OTP Rate Limiting | curl API testing | 20 min |
| 2 | Password Policy | curl + Browser MCP | 15 min |
| 3 | Color Palette | Browser MCP screenshots | 20 min |
| 4 | Animation 60fps | Browser MCP + DevTools | 25 min |

**Total estimated: ~80 min with parallel agents**

### Agent Allocation
- Agent 1: OTP rate limiting (all TP-1.x)
- Agent 2: Password policy (all TP-2.x)
- Agent 3: Color palette CSS vars (all TP-4.x)
- Agent 4: Animation 60fps (all TP-3.x)

### Dependencies
- OTP tests: Need dev server running + test account with credits
- Password tests: Need spec confirmation on complexity rules
- Color tests: Need Browser MCP connected
- Animation tests: Need Browser MCP + Chrome DevTools access

---

*Prepared by QA ผู้พิพากษา — ready to execute when dev delivers*
