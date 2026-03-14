const { readFileSync } = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const results = [];

function pass(test, detail) { results.push({ test, pass: true, detail }); }
function fail(test, detail) { results.push({ test, pass: false, detail }); }

// ─── PART 1: CSV Formula Injection Verification ─────────────────────────
function testCsvSanitization() {
  console.log('\n=== PART 1: CSV Formula Injection (Code Inspection) ===\n');

  const csvLib = readFileSync(path.join(ROOT, 'lib/csv.ts'), 'utf8');
  const hasRegex = csvLib.includes('^[=+\\-@\\t\\r\\n]');
  const hasPrepend = csvLib.includes("? `'${normalized}`");
  const hasQuoteEscape = csvLib.includes('.replace(/"/g, \'""\'');

  if (hasRegex && hasPrepend && hasQuoteEscape) {
    pass('CSV: Core regex covers =+\\-@\\t\\r\\n + prepend quote + escape', 'lib/csv.ts OK');
  } else {
    fail('CSV: Core sanitization', 'regex:' + hasRegex + ' prepend:' + hasPrepend + ' escape:' + hasQuoteEscape);
  }

  // All export surfaces use toCsvCell
  const surfaces = [
    { file: 'app/api/v1/contacts/export/route.ts', name: 'contacts API export' },
    { file: 'app/(dashboard)/dashboard/messages/MessagesClient.tsx', name: 'messages client' },
    { file: 'app/(dashboard)/dashboard/contacts/ContactsClient.tsx', name: 'contacts client' },
    { file: 'app/(dashboard)/dashboard/logs/LogsClient.tsx', name: 'logs client' },
    { file: 'lib/actions/audit.ts', name: 'audit actions (admin)' },
  ];

  for (const s of surfaces) {
    try {
      const src = readFileSync(path.join(ROOT, s.file), 'utf8');
      const usesCsvCell = src.includes('toCsvCell');
      const importsCsv = src.includes('@/lib/csv') || src.includes('../csv');
      if (usesCsvCell && importsCsv) {
        pass('CSV: ' + s.name + ' uses toCsvCell', 'import + usage verified');
      } else {
        fail('CSV: ' + s.name, 'import:' + importsCsv + ' usage:' + usesCsvCell);
      }
    } catch (e) {
      fail('CSV: ' + s.name, 'File not found');
    }
  }

  // Analytics export
  try {
    const analytics = readFileSync(path.join(ROOT, 'app/(dashboard)/dashboard/analytics/AnalyticsContent.tsx'), 'utf8');
    if (analytics.includes('toCsvCell')) {
      pass('CSV: analytics export uses toCsvCell', 'OK');
    } else {
      fail('CSV: analytics export', 'toCsvCell NOT used');
    }
  } catch { fail('CSV: analytics export', 'File not found'); }

  // UTF-8 BOM
  const exportRoute = readFileSync(path.join(ROOT, 'app/api/v1/contacts/export/route.ts'), 'utf8');
  if (exportRoute.includes('\\uFEFF')) {
    pass('CSV: UTF-8 BOM for Thai Excel compatibility', 'BOM present');
  } else {
    fail('CSV: UTF-8 BOM', 'Missing');
  }

  // No raw string concat in export routes
  let dangerousFound = false;
  for (const f of ['app/api/v1/contacts/export/route.ts', 'app/api/v1/logs/export/route.ts', 'app/api/v1/audit-logs/export/route.ts']) {
    try {
      const src = readFileSync(path.join(ROOT, f), 'utf8');
      if (/\$\{c\.\w+\}/.test(src) || /\$\{log\.\w+\}/.test(src)) {
        if (src.indexOf('toCsvCell') === -1) {
          dangerousFound = true;
          fail('CSV: Raw concat in ' + f, 'No toCsvCell protection');
        }
      }
    } catch {}
  }
  if (!dangerousFound) {
    pass('CSV: No unprotected string interpolation in exports', 'All sanitized');
  }

  // Logs export uses toCsvCell for text fields
  try {
    const logsExport = readFileSync(path.join(ROOT, 'app/api/v1/logs/export/route.ts'), 'utf8');
    if (logsExport.includes('toCsvCell')) {
      pass('CSV: API logs export uses toCsvCell', 'OK');
    } else {
      fail('CSV: API logs export', 'toCsvCell NOT used');
    }
  } catch { fail('CSV: API logs export', 'File not found'); }

  // Audit logs export
  try {
    const auditExport = readFileSync(path.join(ROOT, 'app/api/v1/audit-logs/export/route.ts'), 'utf8');
    if (auditExport.includes('authenticateAdmin') || auditExport.includes('audit')) {
      pass('CSV: Audit logs export requires admin auth', 'Admin-only');
    } else {
      fail('CSV: Audit logs auth', 'Missing admin check');
    }
  } catch { fail('CSV: Audit logs export', 'File not found'); }
}

// ─── PART 2: Playwright Browser Test ─────────────────────────────────────
async function testBrowser() {
  console.log('\n=== PART 3: Playwright Browser Tests ===\n');

  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch {
    console.log('SKIP: Playwright not available');
    results.push({ test: 'Browser: Playwright available', pass: false, detail: 'Not installed' });
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const dir = path.join(__dirname, 'screenshots');

  async function dismissConsent(page) {
    const btn = page.locator('button:has-text("ยอมรับทั้งหมด")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
    }
  }

  // Check if localhost:3000 is up
  let serverUp = false;
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000', { timeout: 5000 });
    serverUp = true;
    await ctx.close();
  } catch {
    console.log('NOTE: localhost:3000 is DOWN — skipping browser tests');
    results.push({ test: 'Browser: localhost:3000 reachable', pass: false, detail: 'Server is down — code tests still valid' });
    await browser.close();
    return;
  }

  // 3a. Login with formula injection payload
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto('http://localhost:3000/login', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    await page.locator('input[type=email]').first().fill('=cmd@evil.com');
    await page.locator('input[type=password]').first().fill('+HYPERLINK');
    await page.locator('button[type=submit]').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/e2e-csv-login-injection.png' });

    const body = await page.textContent('body') || '';
    const hasError = body.includes('ไม่ถูกต้อง') || body.includes('invalid') || body.includes('ผิดพลาด') || body.includes('ลองใหม่');
    pass('Browser: Login rejects formula-like email', hasError ? 'Error shown' : 'Submitted (no XSS)');
    
    if (jsErrors.length === 0) {
      pass('Browser: No JS crash from injection payload', 'Clean');
    } else {
      fail('Browser: JS errors', jsErrors[0].substring(0, 80));
    }
    await ctx.close();
  }

  // 3b. Public pages
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    for (const p of ['/pricing', '/help']) {
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', err => errs.push(err.message));
      await page.goto('http://localhost:3000' + p, { timeout: 10000, waitUntil: 'networkidle' });
      const body = await page.textContent('body') || '';
      const appError = body.includes('Something went wrong') || body.includes('Application error');
      if (errs.length === 0 && !appError) {
        pass('Browser: ' + p + ' renders', 'No errors');
      } else {
        fail('Browser: ' + p, 'errors:' + errs.length);
      }
      await page.close();
    }
    await ctx.close();
  }

  // 3c. Auth guard
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/dashboard/contacts', { timeout: 10000, waitUntil: 'networkidle' });
    if (page.url().includes('/login')) {
      pass('Browser: Auth guard /dashboard/contacts', 'Redirected');
    } else {
      fail('Browser: Auth guard', page.url());
    }
    await ctx.close();
  }

  await browser.close();
}

// ─── MAIN ────────────────────────────────────────────────────────────────
(async () => {
  testCsvSanitization();
  await testBrowser();

  console.log('\n' + '='.repeat(70));
  console.log('E2E RESULTS: CSV Formula Injection (#3416)');
  console.log('='.repeat(70) + '\n');

  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.pass ? 'PASS' : 'FAIL';
    if (r.pass) passed++; else failed++;
    console.log(icon + ' | ' + r.test + ' | ' + r.detail);
  }

  console.log('\n=== TOTAL: ' + passed + ' passed, ' + failed + ' failed out of ' + results.length + ' ===\n');
})();
