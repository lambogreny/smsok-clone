import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

describe("Task #6655: Prisma error handling gaps", () => {
  it("maps Prisma P2025 and P2003 in the central API error handler", () => {
    const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf8");

    expect(apiAuthSource).toContain('if (prismaCode === "P2025")');
    expect(apiAuthSource).toContain('error: "ไม่พบข้อมูล"');
    expect(apiAuthSource).toContain("ERROR_CODES.NOT_FOUND");

    expect(apiAuthSource).toContain('if (prismaCode === "P2003")');
    expect(apiAuthSource).toContain('error: "ข้อมูลอ้างอิงไม่ถูกต้อง"');
    expect(apiAuthSource).toContain("ERROR_CODES.BUSINESS");
  });

  it("routes dev endpoints through the shared API error handler instead of bare console.error", () => {
    const resetCreditsSource = readFileSync(
      resolve(ROOT, "app/api/dev/reset-credits/route.ts"),
      "utf8",
    );
    const lastOtpSource = readFileSync(
      resolve(ROOT, "app/api/dev/last-otp/route.ts"),
      "utf8",
    );
    const disable2FaSource = readFileSync(
      resolve(ROOT, "app/api/dev/disable-2fa/route.ts"),
      "utf8",
    );

    for (const source of [resetCreditsSource, lastOtpSource, disable2FaSource]) {
      expect(source).toContain('from "@/lib/api-auth"');
      expect(source).toContain("return apiError(error);");
      expect(source).not.toContain("console.error(");
    }
  });

  it("requires a real API key before middleware skips session verification or CSRF checks", () => {
    const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf8");
    const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf8");

    expect(middlewareSource).toContain('const bearerToken = authHeader?.startsWith("Bearer ")');
    expect(middlewareSource).toContain('bearerToken.startsWith("sk_live_")');
    expect(apiAuthSource).toContain('const bearerToken = authHeader?.startsWith("Bearer ")');
    expect(apiAuthSource).toContain('bearerToken.startsWith("sk_live_")');
  });
});
