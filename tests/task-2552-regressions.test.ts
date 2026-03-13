import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const verifySlipRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/verify-slip/route.ts"),
  "utf-8",
);
const termsActions = readFileSync(resolve(ROOT, "lib/actions/terms.ts"), "utf-8");

describe("Task #2552: critical backend regressions", () => {
  it("keeps the order verify-slip alias route in place to avoid upload 404s", () => {
    expect(verifySlipRoute).toContain('export { POST } from "../upload/route"');
  });

  it("requires a real session before honoring caller-supplied terms user ids", () => {
    expect(termsActions).toContain("requireSessionUserId");
    expect(termsActions).toContain("if (explicitUserId && !token)");
    expect(termsActions).toContain('throw new Error("ไม่สามารถดำเนินการแทนผู้ใช้อื่นได้")');
    expect(termsActions).toContain("return resolveActionUserId(explicitUserId, token)");
  });

  it("still supports trusted internal user resolution for terms actions", () => {
    expect(termsActions).toContain("type InternalActionUserToken");
    expect(termsActions).toContain("resolveTermsUserId(options?.userId, token)");
    expect(termsActions).toContain("resolveTermsUserId(apiUserId, token)");
  });
});
