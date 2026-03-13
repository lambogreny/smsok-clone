import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const documentDownloadSource = readFileSync(
  resolve(ROOT, "lib/orders/document-download.ts"),
  "utf-8",
);
const apiAuthSource = readFileSync(
  resolve(ROOT, "lib/api-auth.ts"),
  "utf-8",
);
const csrfSource = readFileSync(
  resolve(ROOT, "lib/csrf.ts"),
  "utf-8",
);
const campaignsRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/campaigns/route.ts"),
  "utf-8",
);
const campaignDetailRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/campaigns/[id]/route.ts"),
  "utf-8",
);

describe("Task #2683: QA retest bug fixes", () => {
  it("supports quotation downloads from the shared document endpoint", () => {
    expect(documentDownloadSource).toContain('quotation: "QUOTATION"');
    expect(documentDownloadSource).toContain("renderOrderQuotationPdf(order)");
    expect(documentDownloadSource).toContain('throw new ApiError(404, "ไม่พบใบเสนอราคา")');
  });

  it("returns a paid-required 400 before serving receipt or tax invoice PDFs", () => {
    expect(documentDownloadSource).toContain('documentType === "TAX_INVOICE" || documentType === "RECEIPT"');
    expect(documentDownloadSource).toContain('throw new ApiError(400, "กรุณาชำระเงินก่อน")');
  });

  it("enforces CSRF for mutating session-based /api/v1 requests", () => {
    expect(apiAuthSource).toContain("hasValidCsrfOrigin(req)");
    expect(apiAuthSource).toContain('req.nextUrl.pathname.startsWith("/api/v1/")');
    expect(apiAuthSource).toContain('throw new ApiError(403, "CSRF: invalid origin"');
    expect(csrfSource).toContain('const referer = req.headers.get("referer")');
  });

  it("maps sender_name snake_case input for campaign create and update routes", () => {
    expect(campaignsRouteSource).toContain("input.senderName ?? input.sender_name");
    expect(campaignDetailRouteSource).toContain("input.senderName ?? input.sender_name");
  });
});
