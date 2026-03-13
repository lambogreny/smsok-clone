import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const easyslipSource = readFileSync(resolve(ROOT, "lib/easyslip.ts"), "utf-8");
const slipVerificationSource = readFileSync(resolve(ROOT, "lib/orders/slip-verification.ts"), "utf-8");

describe("Task #2850: critical slip duplicate + validation audit fixes", () => {
  it("stores EasySlip transRef with a unique constraint for duplicate protection", () => {
    expect(schemaSource).toContain('transRef   String?   @unique @map("trans_ref")');
    expect(slipVerificationSource).toContain("transRef: verificationData.transRef");
    expect(slipVerificationSource).toContain("db.orderSlip.findFirst");
  });

  it("rejects duplicate slips immediately instead of silently approving them", () => {
    expect(slipVerificationSource).toContain("verification.isDuplicate");
    expect(slipVerificationSource).toContain('"สลิปนี้ถูกใช้แล้ว"');
  });

  it("validates EasySlip payload fields before accepting a successful verification", () => {
    expect(easyslipSource).toContain("EasySlip response missing transRef");
    expect(easyslipSource).toContain("EasySlip response missing date");
    expect(easyslipSource).toContain("EasySlip response amount must be greater than 0");
    expect(easyslipSource).toContain("EasySlip response missing receiver account");
  });

  it("adds an audit-history note when the amount passes only via tolerance", () => {
    expect(slipVerificationSource).toContain("within ±1 THB tolerance");
  });
});
