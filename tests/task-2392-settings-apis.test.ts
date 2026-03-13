import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const twoFactorActionsSource = readFileSync(resolve(ROOT, "lib/actions/two-factor.ts"), "utf-8");
const securityPolicyRouteSource = readFileSync(
  resolve(ROOT, "app/api/org/security-policy/route.ts"),
  "utf-8",
);
const member2faStatusRouteSource = readFileSync(
  resolve(ROOT, "app/api/org/members/2fa-status/route.ts"),
  "utf-8",
);
const login2faAliasRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/login/2fa/route.ts"),
  "utf-8",
);
const optOutRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/pdpa/opt-out/route.ts"),
  "utf-8",
);

describe("Task #2392: settings APIs for frontend", () => {
  it("adds org-level 2FA policy helpers and routes", () => {
    expect(twoFactorActionsSource).toContain("export async function getDefaultOrgSecurityPolicy(userId: string)");
    expect(twoFactorActionsSource).toContain("export async function updateDefaultOrgSecurityPolicy(userId: string, enforce: boolean)");
    expect(securityPolicyRouteSource).toContain("getDefaultOrgSecurityPolicy(session.id)");
    expect(securityPolicyRouteSource).toContain("updateDefaultOrgSecurityPolicy(session.id, require2FA)");
  });

  it("adds an organization member 2FA status endpoint", () => {
    expect(twoFactorActionsSource).toContain("export async function getDefaultOrgMember2FAStatuses(userId: string)");
    expect(member2faStatusRouteSource).toContain("getDefaultOrgMember2FAStatuses(session.id)");
  });

  it("adds the login 2FA alias route for frontend consumers", () => {
    expect(login2faAliasRouteSource).toContain('export { POST } from "../../2fa/verify/route"');
  });

  it("supports public opt-out token preview and submit flows while keeping the API-key flow", () => {
    expect(optOutRouteSource).toContain('const token = searchParams.get("token")');
    expect(optOutRouteSource).toContain("verifyOptOutToken(token)");
    expect(optOutRouteSource).toContain('record.purpose !== "pdpa-opt-out"');
    expect(optOutRouteSource).toContain("phone: maskPhone(payload.phone)");
    expect(optOutRouteSource).toContain('method: typeof body.method === "string" ? body.method : "link"');
    expect(optOutRouteSource).toContain("authenticatePublicApiKey(req)");
  });
});
