import { chromium, type FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";

const TEST_USER = {
  email: "qa-judge2@smsok.test",
  password: "QAJudge2026!",
};

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture login API response for debugging
  let loginResponse: { status: number; body: string } | null = null;
  page.on("response", async (res) => {
    if (res.url().includes("/api/auth/login")) {
      loginResponse = { status: res.status(), body: await res.text().catch(() => "") };
    }
  });

  // Navigate to login
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  // Dismiss cookie consent
  const acceptBtn = page.getByText("ยอมรับทั้งหมด");
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }

  // Fill email — use type() to trigger React onChange properly
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(TEST_USER.email);

  // Fill password
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.click();
  await passwordInput.fill(TEST_USER.password);

  // Wait for submit button to become enabled (React Hook Form validation)
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.waitFor({ state: "visible", timeout: 5000 });

  // Wait for button to be enabled (form validation may take a moment)
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    },
    { timeout: 10000 }
  ).catch(async () => {
    // If button still disabled, try re-filling with type() to trigger events
    await emailInput.clear();
    await emailInput.type(TEST_USER.email);
    await passwordInput.clear();
    await passwordInput.type(TEST_USER.password);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    );
  });

  await submitBtn.click();

  // Wait for login API response first (may take several seconds on dev server)
  await page.waitForResponse(
    (res) => res.url().includes("/api/auth/login"),
    { timeout: 45000 }
  ).catch(() => {
    console.log("⚠️  No /api/auth/login response captured within 45s");
  });

  // Wait for navigation to dashboard OR 2FA challenge page
  try {
    await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 });
  } catch {
    // Login API may have succeeded (cookies set) but client-side routing stalled.
    // If API returned 200, try navigating to dashboard directly.
    const lr = loginResponse as { status: number; body: string } | null;
    if (lr && lr.status === 200 && lr.body.includes('"success":true')) {
      console.log("⚠️  Client-side routing stalled after successful login API — navigating to /dashboard directly");
      await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(3000);
      if (!page.url().includes("/dashboard")) {
        throw new Error(`Login API succeeded but still can't reach dashboard. Current URL: ${page.url()}`);
      }
    } else {
      const url = page.url();
      const apiInfo = lr
        ? `API: ${lr.status} ${lr.body.substring(0, 300)}`
        : "No API response captured";
      const pageText = await page.locator("body").textContent().catch(() => "");
      const btnDisabled = await page.locator('button[type="submit"]').isDisabled().catch(() => null);
      throw new Error(
        `Login failed — stuck on ${url}\n` +
        `Submit button disabled: ${btnDisabled}\n` +
        `${apiInfo}\n` +
        `Page text (first 500): ${pageText?.substring(0, 500)}`
      );
    }
  }

  // If redirected to /2fa — 2FA is enabled on test account, need to disable it
  if (page.url().includes("/2fa")) {
    // Call the disable API directly using the challenge token approach is not possible
    // Instead, use Prisma-level disable via dev endpoint
    // For now, try to disable via the settings API after getting a session
    console.log("⚠️  2FA enabled on test account — attempting to disable via dev API...");

    // Extract challenge token from URL
    const url = new URL(page.url());
    const challengeToken = url.searchParams.get("token");

    if (challengeToken) {
      // Try to use recovery/backup code approach — or dev secret to bypass
      const devSecret = process.env.E2E_DEV_SECRET || process.env.DEV_SECRET;
      if (devSecret) {
        // Call dev API to disable 2FA directly
        const resp = await page.request.post(`${baseURL}/api/dev/disable-2fa`, {
          data: { challengeToken },
          headers: { "x-dev-secret": devSecret },
        }).catch(() => null);

        if (resp && resp.ok()) {
          console.log("✅ 2FA disabled via dev API");
          // Re-login now that 2FA is disabled
          await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
          await emailInput.waitFor({ state: "visible", timeout: 5000 });
          await emailInput.click();
          await emailInput.fill(TEST_USER.email);
          await passwordInput.click();
          await passwordInput.fill(TEST_USER.password);
          await page.waitForFunction(
            () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
            { timeout: 10000 }
          );
          await submitBtn.click();
          await page.waitForURL("**/dashboard**", { timeout: 30000 });
        } else {
          throw new Error(
            "2FA is enabled on demo account and cannot be bypassed.\n" +
            "Either disable 2FA manually or add /api/dev/disable-2fa endpoint.\n" +
            "Status: " + (resp?.status() ?? "no response")
          );
        }
      } else {
        throw new Error(
          "2FA is enabled on demo account. Set E2E_DEV_SECRET env var and add /api/dev/disable-2fa endpoint."
        );
      }
    }
  }

  // If we're on dashboard, try to disable 2FA for subsequent tests (idempotent)
  if (page.url().includes("/dashboard")) {
    await page.request.post(`${baseURL}/api/v1/settings/2fa/disable`, {
      data: { password: TEST_USER.password },
    }).catch(() => {
      // 2FA might not be enabled — ignore errors
    });
  }

  // Save signed-in state
  await context.storageState({ path: path.join(authDir, "user.json") });

  await browser.close();
}

export default globalSetup;
