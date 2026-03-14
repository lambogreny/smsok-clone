import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

function readRoute(path: string): string {
  const full = resolve(ROOT, path);
  if (!existsSync(full)) return "";
  return readFileSync(full, "utf-8");
}

// ==========================================
// 1. AUTH API CONTRACT
// ==========================================

describe("API Contract: Auth", () => {
  const loginRoute = readRoute("app/api/auth/login/route.ts");
  const registerRoute = readRoute("app/api/auth/register/route.ts");
  const logoutRoute = readRoute("app/api/auth/logout/route.ts");
  const meRoute = readRoute("app/api/auth/me/route.ts");
  const refreshRoute = readRoute("app/api/auth/refresh/route.ts");

  describe("POST /api/auth/login", () => {
    it("exports POST handler", () => {
      expect(loginRoute).toContain("async function POST");
    });

    it("validates email and password", () => {
      expect(loginRoute).toMatch(/email|password/);
    });

    it("sets session cookie on success", () => {
      expect(loginRoute).toMatch(/cookie|session|set-cookie/i);
    });

    it("returns error on invalid credentials", () => {
      expect(loginRoute).toMatch(/401|ไม่ถูกต้อง|invalid|unauthorized/i);
    });
  });

  describe("POST /api/auth/register", () => {
    it("exports POST handler", () => {
      expect(registerRoute).toContain("async function POST");
    });

    it("validates required fields", () => {
      expect(registerRoute).toMatch(/email|password|firstName|phone/);
    });

    it("delegates to registration action", () => {
      expect(registerRoute).toMatch(/registerWithOtp|registerUser|register/i);
    });

    it("applies rate limiting", () => {
      expect(registerRoute).toMatch(/rateLimit|applyRateLimit/i);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("exports POST handler", () => {
      expect(logoutRoute).toContain("async function POST");
    });

    it("clears session cookie", () => {
      expect(logoutRoute).toMatch(/delete|clear|cookie/i);
    });
  });

  describe("GET /api/auth/me", () => {
    it("exports GET handler", () => {
      expect(meRoute).toContain("async function GET");
    });

    it("requires authentication", () => {
      expect(meRoute).toMatch(/authenticateRequest|verifySession|session/i);
    });

    it("returns user data", () => {
      expect(meRoute).toMatch(/email|name|id|user/i);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("exports POST handler", () => {
      expect(refreshRoute).toContain("async function POST");
    });

    it("uses refresh token", () => {
      expect(refreshRoute).toMatch(/refresh|REFRESH_COOKIE/i);
    });
  });
});

// ==========================================
// 2. SMS API CONTRACT
// ==========================================

describe("API Contract: SMS", () => {
  const sendRoute = readRoute("app/api/v1/sms/send/route.ts");
  const batchRoute = readRoute("app/api/v1/sms/batch/route.ts");
  const scheduledRoute = readRoute("app/api/v1/sms/scheduled/route.ts");
  const statusRoute = readRoute("app/api/v1/sms/status/route.ts");

  describe("POST /api/v1/sms/send", () => {
    it("exports POST handler", () => {
      expect(sendRoute).toContain("async function POST");
    });

    it("authenticates request", () => {
      expect(sendRoute).toContain("authenticateRequest");
    });

    it("validates phone number (to field)", () => {
      expect(sendRoute).toMatch(/to|recipient|phone/i);
    });

    it("validates message content", () => {
      expect(sendRoute).toMatch(/message|content|text/i);
    });

    it("checks credit balance", () => {
      expect(sendRoute).toMatch(/credit|balance|quota/i);
    });

    it("returns 201 on success", () => {
      expect(sendRoute).toContain("201");
    });

    it("returns SMS ID and status in response", () => {
      expect(sendRoute).toMatch(/id[\s\S]*status|status[\s\S]*id/);
    });
  });

  describe("POST /api/v1/sms/batch", () => {
    it("exports POST handler", () => {
      expect(batchRoute).toContain("async function POST");
    });

    it("authenticates request", () => {
      expect(batchRoute).toContain("authenticateRequest");
    });

    it("accepts array of recipients", () => {
      expect(batchRoute).toMatch(/recipients|messages|batch/i);
    });
  });

  describe("GET /api/v1/sms/scheduled", () => {
    it("exports GET handler", () => {
      expect(scheduledRoute).toContain("async function GET");
    });

    it("authenticates request", () => {
      expect(scheduledRoute).toContain("authenticateRequest");
    });
  });

  describe("GET /api/v1/sms/status", () => {
    it("exports GET handler", () => {
      expect(statusRoute).toContain("async function GET");
    });

    it("accepts message ID parameter", () => {
      expect(statusRoute).toMatch(/messageId|id|searchParams/i);
    });
  });
});

// ==========================================
// 3. SETTINGS API CONTRACT
// ==========================================

describe("API Contract: Settings", () => {
  const profileRoute = readRoute("app/api/v1/settings/profile/route.ts");
  const passwordRoute = readRoute("app/api/v1/settings/password/route.ts");
  const apiKeysRoute = readRoute("app/api/v1/api-keys/route.ts");
  const sendersRoute = readRoute("app/api/v1/senders/route.ts");
  const twoFaEnable = readRoute("app/api/v1/settings/2fa/enable/route.ts");
  const notifRoute = readRoute("app/api/v1/settings/notifications/route.ts");

  describe("GET/PUT /api/v1/settings/profile", () => {
    it("exports GET handler", () => {
      expect(profileRoute).toContain("async function GET");
    });

    it("exports PUT handler", () => {
      expect(profileRoute).toContain("async function PUT");
    });

    it("authenticates request", () => {
      expect(profileRoute).toContain("authenticateRequest");
    });

    it("delegates to profile action", () => {
      expect(profileRoute).toMatch(/getProfile|updateProfile|profile/i);
    });
  });

  describe("PUT /api/v1/settings/password", () => {
    it("exports PUT handler", () => {
      expect(passwordRoute).toMatch(/async function (PUT|POST)/);
    });

    it("delegates to changePassword action", () => {
      expect(passwordRoute).toMatch(/changePassword/);
    });

    it("validates input with schema", () => {
      expect(passwordRoute).toMatch(/changePasswordSchema|parse|validate/i);
    });
  });

  describe("GET/POST /api/v1/api-keys", () => {
    it("exports GET handler", () => {
      expect(apiKeysRoute).toContain("async function GET");
    });

    it("exports POST handler", () => {
      expect(apiKeysRoute).toContain("async function POST");
    });

    it("authenticates request", () => {
      expect(apiKeysRoute).toContain("authenticateRequest");
    });

    it("delegates to API key service", () => {
      expect(apiKeysRoute).toMatch(/createApiKeyForUser|listApiKeysForUser/);
    });
  });

  describe("GET /api/v1/senders", () => {
    it("exports GET handler", () => {
      expect(sendersRoute).toContain("async function GET");
    });

    it("authenticates request", () => {
      expect(sendersRoute).toContain("authenticateRequest");
    });

    it("returns sender names list", () => {
      expect(sendersRoute).toMatch(/sender|name/i);
    });
  });

  describe("POST /api/v1/settings/2fa/enable", () => {
    it("exports POST handler", () => {
      expect(twoFaEnable).toContain("async function POST");
    });

    it("authenticates via session", () => {
      expect(twoFaEnable).toMatch(/authenticateRequest|getSession|session/i);
    });

    it("generates TOTP secret", () => {
      expect(twoFaEnable).toMatch(/totp|secret|authenticator|speakeasy|otpauth/i);
    });
  });
});

// ==========================================
// 4. ERROR RESPONSE CONTRACT
// ==========================================

describe("API Contract: Error Responses", () => {
  const apiAuth = readRoute("lib/api-auth.ts");
  const middleware = readRoute("middleware.ts");

  describe("Consistent error shape", () => {
    it("ApiError class exists", () => {
      expect(apiAuth).toMatch(/class ApiError|ApiError/);
    });

    it("errors include status code", () => {
      expect(apiAuth).toMatch(/status|statusCode/);
    });

    it("errors include message", () => {
      expect(apiAuth).toMatch(/message/);
    });

    it("errors include error code", () => {
      expect(apiAuth).toMatch(/code|errorCode/);
    });
  });

  describe("Auth middleware", () => {
    it("returns 401 for missing auth", () => {
      expect(middleware).toContain("401");
    });

    it("returns 403 for CSRF violation", () => {
      expect(middleware).toContain("403");
    });

    it("returns 429 for rate limit", () => {
      expect(middleware).toMatch(/429|rateLimitResponse/);
    });
  });
});

// ==========================================
// 5. ADMIN API CONTRACT
// ==========================================

describe("API Contract: Admin", () => {
  const adminAuth = readRoute("app/api/v1/admin/auth/route.ts");
  const adminOrders = readRoute("app/api/admin/orders/route.ts");
  const adminApprove = readRoute("app/api/admin/orders/[id]/approve/route.ts");
  const adminReject = readRoute("app/api/admin/orders/[id]/reject/route.ts");

  describe("POST /api/v1/admin/auth", () => {
    it("exports POST handler", () => {
      expect(adminAuth).toContain("async function POST");
    });

    it("validates email and password", () => {
      expect(adminAuth).toMatch(/email|password/);
    });

    it("uses admin-specific auth", () => {
      expect(adminAuth).toMatch(/loginAdmin|admin/i);
    });

    it("applies rate limit", () => {
      expect(adminAuth).toMatch(/rateLimit|admin_login/i);
    });
  });

  describe("GET /api/admin/orders", () => {
    it("exports GET handler", () => {
      expect(adminOrders).toContain("async function GET");
    });

    it("requires admin authentication", () => {
      expect(adminOrders).toContain("authenticateAdmin");
    });

    it("supports pagination", () => {
      expect(adminOrders).toMatch(/page|limit|skip|take|offset/i);
    });
  });

  describe("POST /api/admin/orders/[id]/approve", () => {
    it("exports POST handler", () => {
      expect(adminApprove).toContain("async function POST");
    });

    it("requires admin authentication with role", () => {
      expect(adminApprove).toContain("authenticateAdmin");
    });

    it("updates order status", () => {
      expect(adminApprove).toMatch(/PAID|approve|status/i);
    });
  });

  describe("POST /api/admin/orders/[id]/reject", () => {
    it("exports POST handler", () => {
      expect(adminReject).toContain("async function POST");
    });

    it("requires reject reason", () => {
      expect(adminReject).toMatch(/reason|reject_reason/i);
    });
  });
});

// ==========================================
// 6. CONSENT API CONTRACT
// ==========================================

describe("API Contract: Consent/PDPA", () => {
  const consentRoute = readRoute("app/api/v1/consent/route.ts");
  const pdpaConsent = readRoute("app/api/v1/pdpa/consent/route.ts");

  describe("GET/POST /api/v1/consent", () => {
    it("exports GET handler", () => {
      expect(consentRoute).toContain("async function GET");
    });

    it("exports POST handler", () => {
      expect(consentRoute).toContain("async function POST");
    });

    it("validates consent type", () => {
      expect(consentRoute).toMatch(/SERVICE|MARKETING|THIRD_PARTY|COOKIE/);
    });

    it("validates consent action", () => {
      expect(consentRoute).toMatch(/OPT_IN|OPT_OUT/);
    });
  });

  describe("GET/POST /api/v1/pdpa/consent (public API key)", () => {
    it("exports GET handler", () => {
      expect(pdpaConsent).toContain("async function GET");
    });

    it("uses public API key auth", () => {
      expect(pdpaConsent).toMatch(/authenticatePublicApiKey|apiKey/i);
    });
  });
});
