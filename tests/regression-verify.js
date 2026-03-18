/**
 * Regression Verify — Run after P0 bug fixes
 * Verifies: Prisma errors gone, cookie banner OK, hydration fixed
 *
 * Usage: node tests/regression-verify.js [BASE_URL]
 * Default: http://localhost:3000
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:3000';
const TEST_EMAIL = 'qa-suite@smsok.test';
const TEST_PASS = process.env.E2E_USER_PASSWORD;
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots', 'regression');
const RESULTS = [];

function log(name, status, detail = '') {
  RESULTS.push({ name, status, detail });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
}

async function dismissOverlays(page) {
  try {
    const btns = page.locator('button:has-text("ยอมรับทั้งหมด"), button:has-text("ยอมรับ"), button:has-text("Accept")');
    for (let i = 0; i < await btns.count(); i++) {
      try { await btns.nth(i).click({ timeout: 2000 }); } catch {}
    }
  } catch {}
  try { await page.keyboard.press('Escape'); } catch {}
  await page.waitForTimeout(500);
}

(async () => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('\n==========================================');
  console.log('🔄 REGRESSION VERIFY — Post P0 Fix');
  console.log(`   Target: ${BASE}`);
  console.log('==========================================\n');

  // Collect console errors
  const consoleErrors = [];
  const prismaErrors = [];
  const serverErrors = [];
  const hydrationErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      if (text.includes('Prisma') || text.includes('prisma')) prismaErrors.push(text);
      if (text.includes('500')) serverErrors.push(text);
      if (text.includes('hydrat') || text.includes('Hydrat')) hydrationErrors.push(text);
    }
  });

  // 1. Login
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await dismissOverlays(page);
    await page.locator('input[type="email"], input[name="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASS);
    await page.locator('button[type="submit"]').first().click({ force: true });
    await page.waitForTimeout(3000);
    log('Login', page.url().includes('/dashboard') ? 'PASS' : 'FAIL', page.url());
  } catch (e) {
    log('Login', 'FAIL', e.message.substring(0, 100));
  }

  // 2. Navigate all major pages to collect errors
  const pages = [
    '/dashboard',
    '/dashboard/send',
    '/dashboard/contacts',
    '/dashboard/campaigns',
    '/dashboard/settings',
    '/dashboard/packages',
    '/dashboard/history',
  ];

  for (const p of pages) {
    try {
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissOverlays(page);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `reg-${p.replace(/\//g, '-').substring(1)}.png`), fullPage: true });
    } catch {}
  }

  // 3. Verify: Cookie banner doesn't block content
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    const submitBtn = page.locator('button[type="submit"]').first();
    const isClickable = await submitBtn.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const topEl = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return topEl === el || el.contains(topEl);
    });

    log('Cookie banner: Login button clickable', isClickable ? 'PASS' : 'FAIL',
      isClickable ? 'Submit button not blocked' : 'Submit button blocked by overlay!');
  } catch (e) {
    log('Cookie banner check', 'FAIL', e.message.substring(0, 100));
  }

  // 4. Results
  console.log('\n--- REGRESSION RESULTS ---\n');

  log('Prisma errors', prismaErrors.length === 0 ? 'PASS' : 'FAIL',
    prismaErrors.length === 0 ? 'No Prisma errors!' : `${prismaErrors.length} Prisma errors found`);

  log('500 Server errors', serverErrors.length === 0 ? 'PASS' : 'FAIL',
    serverErrors.length === 0 ? 'No 500 errors!' : `${serverErrors.length} server errors found`);

  log('Hydration mismatch', hydrationErrors.length === 0 ? 'PASS' : 'FAIL',
    hydrationErrors.length === 0 ? 'No hydration issues!' : `${hydrationErrors.length} hydration errors`);

  log('Total console errors', consoleErrors.length === 0 ? 'PASS' : consoleErrors.length <= 3 ? 'WARN' : 'FAIL',
    `${consoleErrors.length} total errors`);

  // Summary
  console.log('\n==========================================');
  const passed = RESULTS.filter(r => r.status === 'PASS').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  const warned = RESULTS.filter(r => r.status === 'WARN').length;
  console.log(`✅ PASS: ${passed} | ❌ FAIL: ${failed} | ⚠️ WARN: ${warned}`);
  console.log('==========================================\n');

  if (failed > 0) {
    console.log('❌ FAILED:');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.name}: ${r.detail}`));
  }

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'regression-results.json'),
    JSON.stringify({ results: RESULTS, prismaErrors: prismaErrors.length, serverErrors: serverErrors.length, hydrationErrors: hydrationErrors.length, totalErrors: consoleErrors.length }, null, 2)
  );

  await browser.close();
  console.log(`📸 Screenshots: ${SCREENSHOT_DIR}`);

  process.exit(failed > 0 ? 1 : 0);
})();
