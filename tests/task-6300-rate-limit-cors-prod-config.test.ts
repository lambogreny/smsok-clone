import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { getAllowedOrigins } from "@/lib/csrf";

const ROOT = process.cwd();
const API_ROOT = resolve(ROOT, "app/api");
const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf8");
const nextConfigSource = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
const envSource = readFileSync(resolve(ROOT, "lib/env.ts"), "utf8");
const openApiJsonRouteSource = readFileSync(resolve(ROOT, "app/api/v1/docs/openapi.json/route.ts"), "utf8");
const cronCampaignsSource = readFileSync(resolve(ROOT, "app/api/cron/campaigns/route.ts"), "utf8");
const cronOrdersExpireSource = readFileSync(resolve(ROOT, "app/api/cron/orders/expire/route.ts"), "utf8");
const cronPaymentsExpireSource = readFileSync(resolve(ROOT, "app/api/cron/payments/expire/route.ts"), "utf8");
const envExampleSource = readFileSync(resolve(ROOT, ".env.example"), "utf8");
const envProductionSource = readFileSync(resolve(ROOT, ".env.production.template"), "utf8");

function walkRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      return walkRouteFiles(fullPath);
    }

    return entry === "route.ts" ? [fullPath] : [];
  });
}

describe("Task #6300: production CORS + security config", () => {
  it("allows app + backoffice origins in production and localhost only outside production", () => {
    const env = process.env as Record<string, string | undefined>;
    const previousNodeEnv = env.NODE_ENV;
    const previousAppUrl = env.NEXT_PUBLIC_APP_URL;
    const previousBackofficeUrl = env.BACKOFFICE_APP_URL;

    env.NEXT_PUBLIC_APP_URL = "https://smsok.9phum.me";
    env.BACKOFFICE_APP_URL = "https://admin.smsok.9phum.me";

    env.NODE_ENV = "production";
    expect(getAllowedOrigins()).toEqual([
      "https://smsok.9phum.me",
      "https://admin.smsok.9phum.me",
    ]);

    env.NODE_ENV = "development";
    expect(getAllowedOrigins()).toContain("http://localhost:3000");
    expect(getAllowedOrigins()).toContain("http://localhost:3001");
    expect(getAllowedOrigins()).toContain("https://admin.smsok.9phum.me");

    if (previousNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previousNodeEnv;
    if (previousAppUrl === undefined) delete env.NEXT_PUBLIC_APP_URL;
    else env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    if (previousBackofficeUrl === undefined) delete env.BACKOFFICE_APP_URL;
    else env.BACKOFFICE_APP_URL = previousBackofficeUrl;
  });

  it("keeps security headers + public docs CORS locked down", () => {
    expect(middlewareSource).toContain('"/api/v1/docs/openapi.json"');
    expect(middlewareSource).toContain('Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"');
    expect(middlewareSource).toContain('response.headers.set("X-Content-Type-Options", "nosniff")');
    expect(middlewareSource).toContain('response.headers.set("X-Frame-Options", "DENY")');
    expect(middlewareSource).toContain('response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")');
    expect(nextConfigSource).toContain('Permissions-Policy');
    expect(openApiJsonRouteSource).not.toContain('"Access-Control-Allow-Origin": "*"');
    expect(openApiJsonRouteSource).toContain("getAllowedOrigins().includes(origin)");
  });

  it("enforces production env vars for CORS and DB connection pools", () => {
    expect(envSource).toContain("BACKOFFICE_APP_URL: z.string().url().optional()");
    expect(envSource).toContain('message: "BACKOFFICE_APP_URL is required in production"');
    expect(envSource).toContain('message: "NEXT_PUBLIC_APP_URL is required in production"');
    expect(envSource).toContain('message: "DATABASE_URL must include connection_limit=1..20 in production"');

    for (const source of [envExampleSource, envProductionSource]) {
      expect(source).toContain("BACKOFFICE_APP_URL");
      expect(source).toContain("connection_limit=10");
    }
  });

  it("uses apiSensitiveError on unexpected internal cron/docs failures", () => {
    for (const source of [
      openApiJsonRouteSource,
      cronCampaignsSource,
      cronOrdersExpireSource,
      cronPaymentsExpireSource,
    ]) {
      expect(source).toContain("apiSensitiveError");
    }
  });
});

describe("Task #6300: non-v1 route audit", () => {
  it("limits non-versioned API trees to explicit compatibility/internal prefixes", () => {
    const allowedPrefixes = [
      "admin/",
      "auth/",
      "credit-balance/",
      "credits/",
      "cron/",
      "dev/",
      "health/",
      "invoices/",
      "notifications/",
      "orders/",
      "org/",
      "organizations/",
      "payments/",
      "settings/",
      "storage/",
      "tax-profiles/",
      "user/",
      "verify/",
    ];

    const routeFiles = walkRouteFiles(API_ROOT)
      .map((file) => relative(API_ROOT, file).split(sep).join("/"));
    const unexpected = routeFiles.filter((file) => {
      if (file.startsWith("v1/")) return false;
      return !allowedPrefixes.some((prefix) => file.startsWith(prefix));
    });

    expect(unexpected).toEqual([]);
  });
});
