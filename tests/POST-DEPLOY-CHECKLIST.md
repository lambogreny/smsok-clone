# Post-Deploy Checklist — SMSOK

## Quick Smoke (Automated)
```bash
bash tests/smoke-test.sh https://smsok.9phum.me https://admin.smsok.9phum.me
```

## Manual Verification (Browser)

### Infrastructure
- [ ] Homepage loads via domain (https://smsok.9phum.me)
- [ ] SSL certificate valid (green lock icon)
- [ ] No mixed content warnings
- [ ] Backoffice loads (https://admin.smsok.9phum.me)

### Customer App
- [ ] Login page renders correctly
- [ ] Register new test user
- [ ] Login with test user
- [ ] Dashboard loads with KPI cards
- [ ] Send SMS form accessible (/dashboard/send)
- [ ] Contacts page loads
- [ ] Campaigns page loads
- [ ] Settings page loads (profile, security tabs)
- [ ] Packages/Pricing page loads
- [ ] Logout works and redirects to login
- [ ] Cookie consent banner shows and dismisses

### Backoffice
- [ ] Admin login page renders
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] User management list loads
- [ ] PDPA section accessible

### Security
- [ ] Protected routes redirect to /login without auth
- [ ] No console errors in Chrome DevTools
- [ ] No sensitive data in network responses
- [ ] Rate limiting works (try 6+ rapid login attempts)

### Performance
- [ ] Pages load in < 3 seconds
- [ ] No 500 errors in network tab
- [ ] No Prisma errors in console

## Regression (After P0 Bug Fixes)
```bash
node tests/regression-verify.js
```
See: tests/regression-verify.js
