import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const senderActions = readFileSync(resolve(ROOT, "lib/actions/sender-names.ts"), "utf-8");
const auth = readFileSync(resolve(ROOT, "lib/auth.ts"), "utf-8");
const orderVerifySlipRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/upload/route.ts"),
  "utf-8",
);
const canonicalOrderSlipRoute = readFileSync(
  resolve(ROOT, "app/api/orders/[id]/slip/route.ts"),
  "utf-8",
);

describe("Task #2513: sender quota, session cap, verify-slip content-type hardening", () => {
  it("enforces sender quota before creating new sender names", () => {
    expect(senderActions).toContain("getRemainingQuota(userId)");
    expect(senderActions).toContain('status: { in: ["APPROVED", "PENDING"] }');
    expect(senderActions).toContain("quota.senderNameLimit !== null && used >= quota.senderNameLimit");
    expect(senderActions).toContain('throw new ApiError(400, "เกินจำนวน Sender Name ที่อนุญาต")');
  });

  it("caps concurrent sessions at 5 and prunes the oldest sessions", () => {
    expect(auth).toContain("const MAX_CONCURRENT_SESSIONS = 5;");
    expect(auth).toContain("const existingSessions = await prisma.userSession.findMany({");
    expect(auth).toContain("existingSessions.length - MAX_CONCURRENT_SESSIONS");
    expect(auth).toContain("deleteSessionRecord(record.userId, session.id)");
  });

  it("returns 400 instead of 500 when order slip routes receive a non-form payload", () => {
    expect(orderVerifySlipRoute).toContain('export { POST } from "@/app/api/orders/[id]/slip/route";');
    expect(canonicalOrderSlipRoute).toContain("let formData: FormData;");
    expect(canonicalOrderSlipRoute).toContain("formData = await req.formData();");
    expect(canonicalOrderSlipRoute).toContain('throw new ApiError(400, "กรุณาแนบสลิป");');
  });
});
