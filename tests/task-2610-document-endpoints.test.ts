import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const orderDocumentRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/documents/[type]/route.ts"),
  "utf-8",
);
const orderDocumentBinaryRoute = readFileSync(
  resolve(ROOT, "app/order-documents/[id]/[type]/route.ts"),
  "utf-8",
);
const orderDocumentDownloadLib = readFileSync(
  resolve(ROOT, "lib/orders/document-download.ts"),
  "utf-8",
);
const orderApiSource = readFileSync(resolve(ROOT, "lib/orders/api.ts"), "utf-8");
const prismaSchema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");

describe("Task #2610: order document endpoint fixes", () => {
  it("accepts both hyphenated and underscored document path aliases", () => {
    expect(orderDocumentDownloadLib).toContain('"tax-invoice": "TAX_INVOICE"');
    expect(orderDocumentDownloadLib).toContain('tax_invoice: "TAX_INVOICE"');
    expect(orderDocumentDownloadLib).toContain('"credit-note": "CREDIT_NOTE"');
    expect(orderDocumentDownloadLib).toContain('credit_note: "CREDIT_NOTE"');
  });

  it("normalizes generated document paths to the hyphenated v1 route shape", () => {
    expect(orderApiSource).toContain('return "tax-invoice"');
    expect(orderApiSource).toContain('return "credit-note"');
  });

  it("stores yearMonth with enough width for YYYYMM document sequences", () => {
    expect(prismaSchema).toContain('yearMonth  String?       @map("year_month") @db.VarChar(6)');
  });

  it("lets downstream PDF routes keep their own content type", () => {
    expect(middlewareSource).toContain('response.headers.delete("Content-Type")');
    expect(middlewareSource).toContain('rewriteUrl.pathname = `/order-documents/${orderDocumentMatch[1]}/${orderDocumentMatch[2]}`');
  });

  it("builds the order document PDF response with explicit binary headers", () => {
    expect(orderDocumentDownloadLib).toContain('const headers = new Headers(rl.headers)');
    expect(orderDocumentDownloadLib).toContain('headers.set("Content-Type", "application/pdf")');
    expect(orderDocumentDownloadLib).toContain("return new NextResponse(Buffer.from(pdfBuffer), {");
    expect(orderDocumentBinaryRoute).toContain("buildOrderDocumentDownloadResponse");
    expect(orderDocumentRoute).toContain("buildOrderDocumentDownloadResponse");
  });
});
