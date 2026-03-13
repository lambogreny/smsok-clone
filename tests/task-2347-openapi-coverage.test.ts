import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

import { generateOpenAPISpec } from "@/lib/openapi-spec";

const ROOT = resolve(__dirname, "..");
const API_V1_ROOT = resolve(ROOT, "app/api/v1");

function walkRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      return walkRouteFiles(fullPath);
    }

    return entry === "route.ts" ? [fullPath] : [];
  });
}

function toOpenApiPath(routeFile: string) {
  const normalizedRelativePath = relative(API_V1_ROOT, routeFile).split(sep).join("/");
  const routePath = normalizedRelativePath
    .replace(/\/route\.ts$/, "")
    .replace(/\[(.+?)\]/g, "{$1}");

  return routePath ? `/${routePath}` : "/";
}

describe("Task #2347: OpenAPI route coverage", () => {
  const spec = generateOpenAPISpec();
  const paths = spec.paths as Record<string, Record<string, unknown>>;
  const routePaths = walkRouteFiles(API_V1_ROOT).map(toOpenApiPath);
  const documentedCount = routePaths.filter((routePath) => routePath in paths).length;
  const coverage = documentedCount / routePaths.length;

  it("documents at least 95% of v1 route files", () => {
    expect(routePaths.length).toBeGreaterThan(0);
    expect(coverage).toBeGreaterThanOrEqual(0.95);
  });

  it("includes the previously missing orders and newly added utility endpoints", () => {
    expect(paths["/orders"]).toBeTruthy();
    expect(paths["/orders/{id}"]).toBeTruthy();
    expect(paths["/orders/{id}/expire"]).toBeTruthy();
    expect(paths["/webhooks/{id}/test"]).toBeTruthy();
    expect(paths["/credits/balance"]).toBeTruthy();
  });

  it("preserves richer handwritten docs when a manual path definition already exists", () => {
    expect(paths["/auth/register"].post).toMatchObject({
      summary: "Register new account",
    });
    expect(paths["/auth/register"].post).not.toMatchObject({
      description: expect.stringContaining("Auto-generated baseline documentation"),
    });
  });
});
