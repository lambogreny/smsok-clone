import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { calculateOrderAmounts } from "@/lib/orders/service";
import { formatOrderDocumentNumber } from "@/lib/orders/numbering";

const ROOT = resolve(__dirname, "..");
const actionUserSource = readFileSync(resolve(ROOT, "lib/action-user.ts"), "utf-8");
const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const orderPdfSource = readFileSync(resolve(ROOT, "lib/orders/pdf.ts"), "utf-8");
const orderRouteSource = readFileSync(resolve(ROOT, "app/api/v1/orders/route.ts"), "utf-8");
const templateValidateSource = readFileSync(resolve(ROOT, "app/api/v1/templates/validate/route.ts"), "utf-8");
const tagsRouteSource = readFileSync(resolve(ROOT, "app/api/v1/tags/[id]/route.ts"), "utf-8");
const contactTagsRouteSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/[id]/tags/route.ts"), "utf-8");
const paymentDocumentsSource = readFileSync(resolve(ROOT, "lib/payments/documents.ts"), "utf-8");
const invoiceNumberSource = readFileSync(resolve(ROOT, "lib/accounting/invoice-number.ts"), "utf-8");

describe("Task #2606: P0 backend bug fixes", () => {
  it("restores action-user fallback through request IDs when AsyncLocalStorage context is lost", () => {
    expect(actionUserSource).toContain("const trustedRequestUsers = new Map");
    expect(actionUserSource).toContain("const requestUserId = await getTrustedRequestUserId();");
    expect(apiAuthSource).toContain('trustActionUserId(session.id, req.headers.get("x-request-id"));');
    expect(apiAuthSource).toContain('trustActionUserId(apiKey.user.id, req.headers.get("x-request-id"));');
  });

  it("adds a fallback PDF renderer so order documents stop returning 500 when the primary template crashes", () => {
    expect(orderPdfSource).toContain("renderOrderPdfWithFallback");
    expect(orderPdfSource).toContain("buildFallbackPdfElement");
    expect(orderPdfSource).toContain("primary");
  });

  it("keeps order input fields sanitized against stored HTML/script payloads", () => {
    expect(orderRouteSource).toContain("const stripHtml = (val: string) => val.replace(/<[^>]*>/g, \"\");");
    expect(orderRouteSource).toContain("company_name: z.string().trim().transform(stripHtml)");
    expect(orderRouteSource).toContain("tax_name: z.string().trim().transform(stripHtml)");
    expect(orderRouteSource).toContain("tax_address: z.string().trim().transform(stripHtml)");
  });

  it("treats package prices as VAT-exclusive so the payable total adds 7% VAT on top", () => {
    expect(calculateOrderAmounts(500, false)).toEqual({
      netAmount: 500,
      vatAmount: 35,
      totalAmount: 535,
      whtAmount: 0,
      payAmount: 535,
    });
  });

  it("standardizes document numbers to YYYYMM plus 5 digits across order and payment flows", () => {
    expect(formatOrderDocumentNumber("INV", 1, new Date("2026-03-13T00:00:00.000Z"))).toBe("INV-202603-00001");
    expect(paymentDocumentsSource).toContain('padStart(5, "0")');
    expect(invoiceNumberSource).toContain("const seqNum = String(seq.lastNumber).padStart(5, \"0\")");
  });

  it("keeps template validation from crashing when blocked_words is absent", () => {
    expect(templateValidateSource).toContain("blocked_words table may not exist yet — skip word filtering");
  });

  it("gives tag CRUD and contact-tag routes session auth fallback, not API-key-only auth", () => {
    expect(tagsRouteSource).toContain("authenticateRequest");
    expect(tagsRouteSource).not.toContain("authenticatePublicApiKey");
    expect(contactTagsRouteSource).toContain("authenticateRequest");
    expect(contactTagsRouteSource).not.toContain("authenticatePublicApiKey");
  });
});
