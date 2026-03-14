const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const dir = '/Users/lambogreny/oracles/smsok-clone/tests/screenshots';
  const results = [];

  async function dismissConsent(page) {
    const btn = page.locator('button:has-text("ยอมรับทั้งหมด")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
    }
  }

  // 1. Homepage
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('http://localhost:3000', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    await page.screenshot({ path: dir + '/build-verify-homepage.png' });
    results.push({ test: 'Homepage renders', pass: errs.length === 0, detail: 'jsErrors:' + errs.length });
    await ctx.close();
  }

  // 2. Login page
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('http://localhost:3000/login', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    const hasEmail = await page.locator('input[type=email]').first().isVisible().catch(() => false);
    await page.screenshot({ path: dir + '/build-verify-login.png' });
    results.push({ test: 'Login form renders', pass: hasEmail && errs.length === 0, detail: 'email:' + hasEmail + ' jsErrors:' + errs.length });
    await ctx.close();
  }

  // 3. Auth guard
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/dashboard', { timeout: 10000, waitUntil: 'networkidle' });
    const ok = page.url().includes('/login');
    results.push({ test: 'Auth guard /dashboard', pass: ok, detail: ok ? 'Redirected' : 'NOT redirected: ' + page.url() });
    await ctx.close();
  }

  // 4. Public pages
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    for (const p of ['/pricing', '/help', '/status', '/terms', '/privacy']) {
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto('http://localhost:3000' + p, { timeout: 10000, waitUntil: 'networkidle' });
      const body = await page.textContent('body') || '';
      const appError = body.includes('Something went wrong') || body.includes('Application error');
      const ok = errs.length === 0 && (appError === false);
      results.push({ test: 'Public: ' + p, pass: ok, detail: 'jsErrors:' + errs.length });
      await page.close();
    }
    await ctx.close();
  }

  // 5. Mobile
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('http://localhost:3000', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    await page.screenshot({ path: dir + '/build-verify-mobile.png' });
    results.push({ test: 'Mobile 375px', pass: errs.length === 0, detail: 'jsErrors:' + errs.length });
    await ctx.close();
  }

  // 6. Register
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('http://localhost:3000/register', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    await page.screenshot({ path: dir + '/build-verify-register.png' });
    results.push({ test: 'Register page', pass: errs.length === 0, detail: 'jsErrors:' + errs.length });
    await ctx.close();
  }

  // 7. Backoffice :3001
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto('http://localhost:3001', { timeout: 10000, waitUntil: 'networkidle' });
      await page.screenshot({ path: dir + '/build-verify-backoffice.png' });
      results.push({ test: 'Backoffice :3001', pass: true, detail: 'Loaded' });
    } catch (e) {
      results.push({ test: 'Backoffice :3001', pass: false, detail: 'Connection failed' });
    }
    await ctx.close();
  }

  // Print
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.pass ? 'PASS' : 'FAIL';
    if (r.pass) passed++; else failed++;
    console.log(icon + ' | ' + r.test + ' | ' + r.detail);
  }
  console.log('\n=== BUILD VERIFY #3383: ' + passed + ' passed, ' + failed + ' failed out of ' + results.length + ' ===');

  await browser.close();
})();
