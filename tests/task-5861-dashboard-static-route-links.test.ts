import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const DASHBOARD_ROOT = join(ROOT, "app/(dashboard)/dashboard");

function walkStaticDashboardPages(dir: string, routes = new Set<string>()) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!name.startsWith("[")) {
        walkStaticDashboardPages(full, routes);
      }
      continue;
    }

    if (name !== "page.tsx") continue;
    const rel = relative(DASHBOARD_ROOT, full).replace(/\\/g, "/");
    const route = rel === "page.tsx" ? "/dashboard" : `/dashboard/${rel.replace(/\/page\.tsx$/, "")}`;
    routes.add(route);
  }

  return routes;
}

function walkDashboardTsxFiles(dir: string, files: string[] = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkDashboardTsxFiles(full, files);
      continue;
    }

    if (name.endsWith(".tsx")) {
      files.push(full);
    }
  }

  return files;
}

const staticDashboardRoutes = walkStaticDashboardPages(DASHBOARD_ROOT);
const dashboardFiles = walkDashboardTsxFiles(DASHBOARD_ROOT);

describe("Task #5861: dashboard static links avoid dead routes", () => {
  it("campaign empty-state links approved sender users to the real senders page", () => {
    const source = readFileSync(
      join(DASHBOARD_ROOT, "campaigns/CampaignsClient.tsx"),
      "utf-8",
    );

    expect(source).toContain('href="/dashboard/senders"');
    expect(source).not.toContain('href="/dashboard/senders/new"');
  });

  it("all static dashboard links point to static page.tsx routes", () => {
    const staticLinks = new Map<string, string[]>();

    for (const file of dashboardFiles) {
      const source = readFileSync(file, "utf-8");
      const matches = source.matchAll(/["'](\/dashboard(?:\/[A-Za-z0-9_-]+)*(?:#[^"']+)?)["']/g);

      for (const match of matches) {
        const route = match[1].split("#")[0];
        const refs = staticLinks.get(route) ?? [];
        refs.push(relative(ROOT, file));
        staticLinks.set(route, refs);
      }
    }

    const missing = [...staticLinks.entries()]
      .filter(([route]) => !staticDashboardRoutes.has(route))
      .map(([route, refs]) => `${route} <- ${refs.join(", ")}`);

    expect(missing).toEqual([]);
  });
});
