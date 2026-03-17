import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const paymentVerifyRouteSource = readFileSync(
  resolve(ROOT, "app/api/payments/[id]/verify/route.ts"),
  "utf-8",
);
const quotaSource = readFileSync(resolve(ROOT, "lib/package/quota.ts"), "utf-8");
const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const migrationSource = readFileSync(
  resolve(ROOT, "prisma/migrations/20260316234500_package_purchases_transaction_unique/migration.sql"),
  "utf-8",
);

describe("Task #5783: payment + quota race guards", () => {
  it("claims pending payments with compare-and-swap before verification", () => {
    expect(paymentVerifyRouteSource).toContain("async function claimPendingPaymentForVerification");
    expect(paymentVerifyRouteSource).toContain('where: { id: paymentId, userId, status: "PENDING" }');
    expect(paymentVerifyRouteSource).toContain("if (!claimedForVerification)");
    expect(paymentVerifyRouteSource).toContain('error: latestPayment.status === "COMPLETED" ? null : "already_processing"');
  });

  it("activates package purchases idempotently by transactionId", () => {
    expect(paymentVerifyRouteSource).toContain("const existingPurchase = await tx.packagePurchase.findFirst");
    expect(paymentVerifyRouteSource).toContain("where: { transactionId: payment.id }");
    expect(paymentVerifyRouteSource).toContain("if (!existingPurchase)");
    expect(paymentVerifyRouteSource).toContain("await tx.packagePurchase.create");
    expect(schemaSource).toContain('transactionId  String?       @unique @map("transaction_id")');
    expect(migrationSource).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "package_purchases_transaction_id_key"');
  });

  it("deducts quota with guarded updates instead of blind increments", () => {
    expect(quotaSource).toContain("const deductionResult = await tx.packagePurchase.updateMany");
    expect(quotaSource).toContain("smsUsed: { lte: currentPackage.smsTotal - deduct }");
    expect(quotaSource).toContain("if (deductionResult.count !== 1)");
  });
});
