import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Task #7016: input validation and error mapping fixes", () => {
  it("does not treat api-key detail lookup as a strict cuid validation error", () => {
    const serviceSource = readFileSync(resolve(ROOT, "lib/api-keys/service.ts"), "utf8");
    const getByIdBlock = serviceSource.slice(
      serviceSource.indexOf("export async function getApiKeyForUser"),
      serviceSource.indexOf("export async function toggleApiKeyForUser"),
    );

    expect(getByIdBlock).not.toContain("idSchema.parse({ id: keyId })");
    expect(getByIdBlock).toContain('throw new ApiError(404, "ไม่พบ API Key")');
  });

  it("maps Zod validation errors to HTTP 400 in apiError()", () => {
    const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf8");
    expect(apiAuthSource).toContain("if (error instanceof ZodError)");
    expect(apiAuthSource).toContain("return Response.json(body, { status: 400 })");
  });

  it("validates blacklist reason for HTML chars and phone for +66 E.164 format", () => {
    const routeSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/blacklist/route.ts"), "utf8");
    expect(routeSource).toContain("BLACKLIST_PHONE_REGEX");
    expect(routeSource).toContain('ข้อความมีอักขระ HTML ที่ไม่อนุญาต');
  });
});
