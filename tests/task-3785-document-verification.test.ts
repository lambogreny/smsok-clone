import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildDocumentVerificationUrl } from "@/lib/accounting/pdf/document-verification";

const ROOT = resolve(__dirname, "..");
const invoicePdfSource = readFileSync(resolve(ROOT, "lib/accounting/pdf/invoice-pdf.tsx"), "utf-8");
const orderDocumentsRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/documents/route.ts"), "utf-8");
const verifyApiSource = readFileSync(resolve(ROOT, "app/api/verify/[code]/route.ts"), "utf-8");
const verifyPageSource = readFileSync(resolve(ROOT, "app/verify/[code]/page.tsx"), "utf-8");

describe("Task #3785: QR verification + order document API polish", () => {
  it("builds document verification links under /verify by default", () => {
    const previousVerifyBaseUrl = process.env.DOCUMENT_VERIFY_BASE_URL;
    const previousPublicVerifyBaseUrl = process.env.NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL;

    process.env.DOCUMENT_VERIFY_BASE_URL = "https://example.com";
    delete process.env.NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL;

    expect(buildDocumentVerificationUrl("TIV-202603-00001")).toBe(
      "https://example.com/verify/TIV-202603-00001",
    );

    if (previousVerifyBaseUrl === undefined) {
      delete process.env.DOCUMENT_VERIFY_BASE_URL;
    } else {
      process.env.DOCUMENT_VERIFY_BASE_URL = previousVerifyBaseUrl;
    }

    if (previousPublicVerifyBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL = previousPublicVerifyBaseUrl;
    }
  });

  it("renders QR verification assets inside the invoice PDF template", () => {
    expect(invoicePdfSource).toContain("data.verificationQrDataUrl && data.verificationUrl");
    expect(invoicePdfSource).toContain("<Image src={data.verificationQrDataUrl}");
  });

  it("adds a GET document listing route that exposes all four document types", () => {
    expect(orderDocumentsRouteSource).toContain("export async function GET");
    expect(orderDocumentsRouteSource).toContain('apiType: "invoice"');
    expect(orderDocumentsRouteSource).toContain('apiType: "tax_invoice"');
    expect(orderDocumentsRouteSource).toContain('apiType: "receipt"');
    expect(orderDocumentsRouteSource).toContain('apiType: "credit_note"');
  });

  it("adds public verification API and page routes", () => {
    expect(verifyApiSource).toContain("getPublicOrderDocumentVerification");
    expect(verifyPageSource).toContain("ตรวจสอบเอกสาร");
    expect(verifyPageSource).toContain("Document Verification");
  });
});
