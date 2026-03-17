import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hasValidCsrfOrigin } from "@/lib/csrf";

const ROOT = process.cwd();
const composeSource = readFileSync(resolve(ROOT, "docker-compose.prod.yml"), "utf-8");
const adminAuthSource = readFileSync(resolve(ROOT, "lib/admin-auth.ts"), "utf-8");
const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");
const envExampleSource = readFileSync(resolve(ROOT, ".env.example"), "utf-8");
const envProductionSource = readFileSync(resolve(ROOT, ".env.production.template"), "utf-8");

describe("Tasks #6168 and #6170: security config regressions", () => {
  it("does not expose Watchtower HTTP API publicly or ship a fallback token", () => {
    expect(composeSource).not.toContain('"8080:8080"');
    expect(composeSource).not.toContain("WATCHTOWER_HTTP_API_UPDATE=true");
    expect(composeSource).not.toContain("WATCHTOWER_HTTP_API_PERIODIC_POLLS=true");
    expect(composeSource).not.toContain("WATCHTOWER_HTTP_API_METRICS=true");
    expect(composeSource).not.toContain("${WATCHTOWER_TOKEN:-watchtower-secret-change-me}");
  });

  it("requires a dedicated admin JWT secret instead of deriving from JWT_SECRET", () => {
    expect(adminAuthSource).toContain("const ADMIN_JWT_SECRET = env.ADMIN_JWT_SECRET?.trim();");
    expect(adminAuthSource).toContain('throw new Error("ADMIN_JWT_SECRET env var required")');
    expect(adminAuthSource).not.toContain('env.JWT_SECRET + "_admin"');
    expect(middlewareSource).toContain("process.env.ADMIN_JWT_SECRET?.trim()");
    expect(middlewareSource).not.toContain('`${secret}_admin`');

    for (const source of [envExampleSource, envProductionSource]) {
      expect(source).toContain("ADMIN_JWT_SECRET");
    }
  });

  it("allows localhost CSRF origins only outside production", () => {
    const env = process.env as Record<string, string | undefined>;
    const previousNodeEnv = env.NODE_ENV;
    const previousAppUrl = env.NEXT_PUBLIC_APP_URL;

    env.NEXT_PUBLIC_APP_URL = "https://app.smsok.test";

    env.NODE_ENV = "development";
    expect(
      hasValidCsrfOrigin(new Request("https://app.smsok.test/api/auth/login", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
      })),
    ).toBe(true);

    env.NODE_ENV = "production";
    expect(
      hasValidCsrfOrigin(new Request("https://app.smsok.test/api/auth/login", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
      })),
    ).toBe(false);
    expect(
      hasValidCsrfOrigin(new Request("https://app.smsok.test/api/auth/login", {
        method: "POST",
        headers: { origin: "https://app.smsok.test" },
      })),
    ).toBe(true);

    if (previousNodeEnv === undefined) {
      delete env.NODE_ENV;
    } else {
      env.NODE_ENV = previousNodeEnv;
    }

    if (previousAppUrl === undefined) {
      delete env.NEXT_PUBLIC_APP_URL;
    } else {
      env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });
});
