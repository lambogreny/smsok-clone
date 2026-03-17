import { describe, expect, it } from "vitest";
import {
  pickPaymentAmountSumField,
  prunePaymentSelectForAvailableColumns,
  prunePaymentWriteDataForAvailableColumns,
} from "@/lib/payments/db-compat";

describe("Task #5865: payment DB compatibility helpers", () => {
  it("prunes payment fields that are absent from the live DB", () => {
    const pruned = prunePaymentSelectForAvailableColumns(
      {
        amount: true,
        totalAmount: true,
        netPayAmount: true,
        slipFileName: true,
        invoiceNumber: true,
        packageTier: { select: { name: true } },
      },
      new Set(["amount", "total_amount"]),
    );

    expect(pruned).toEqual({
      amount: true,
      totalAmount: true,
      packageTier: { select: { name: true } },
    });
  });

  it("falls back to amount sums when total_amount is unavailable", () => {
    expect(pickPaymentAmountSumField(new Set(["amount"]))).toBe("amount");
    expect(pickPaymentAmountSumField(new Set(["amount", "total_amount"]))).toBe("totalAmount");
  });

  it("prunes payment write fields that the live DB cannot persist yet", () => {
    const pruned = prunePaymentWriteDataForAvailableColumns(
      {
        amount: 49000,
        totalAmount: 52430,
        hasWht: true,
        netPayAmount: 50960,
        preInvoiceNumber: "QT-202603-00001",
      },
      new Set(["amount", "total_amount"]),
    );

    expect(pruned).toEqual({
      amount: 49000,
      totalAmount: 52430,
    });
  });
});
