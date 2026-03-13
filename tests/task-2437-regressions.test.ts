import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const verifySlipRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/verify-slip/route.ts"),
  "utf-8",
);
const tosRoute = readFileSync(resolve(ROOT, "app/api/v1/tos/route.ts"), "utf-8");
const termsActions = readFileSync(resolve(ROOT, "lib/actions/terms.ts"), "utf-8");

describe("Task #2437: slip upload alias + terms action hardening", () => {
  it("adds an order verify-slip alias route that reuses the upload handler", () => {
    expect(verifySlipRoute).toContain('export { POST } from "../upload/route"');
  });

  it("derives terms identity from session or trusted request context", () => {
    expect(termsActions).toContain("type InternalActionUserToken");
    expect(termsActions).toContain("const userId = await resolveTermsUserId(options?.userId, token)");
    expect(termsActions).toContain("const userId = await resolveTermsUserId(apiUserId, token)");
    expect(termsActions).toContain("const userId = await resolveTermsUserId(apiUserId, token)");
    expect(termsActions).not.toContain("options?.userId ?? sessionUser?.id");
    expect(termsActions).not.toContain("apiUserId ?? sessionUser?.id");
  });

  it("stops forwarding explicit user ids from the ToS API route", () => {
    expect(tosRoute).toContain("await authenticateRequest(req)");
    expect(tosRoute).toContain("const status = await getTermsStatus()");
    expect(tosRoute).toContain("const result = await acceptTerms({ ipAddress, userAgent })");
    expect(tosRoute).not.toContain("getTermsStatus(user.id)");
    expect(tosRoute).not.toContain("acceptTerms({ ipAddress, userAgent, userId: user.id })");
  });
});
