import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const ordersApiSource = readFileSync(resolve(root, "lib/orders/api.ts"), "utf-8");
const orderServiceSource = readFileSync(resolve(root, "lib/orders/service.ts"), "utf-8");
const documentDownloadSource = readFileSync(resolve(root, "lib/orders/document-download.ts"), "utf-8");
const storageFilesSource = readFileSync(resolve(root, "lib/storage/files.ts"), "utf-8");
const orderDocumentPdfRouteSource = readFileSync(
  resolve(root, "app/api/orders/[id]/documents/[docId]/pdf/route.ts"),
  "utf-8",
);

describe("Task #3020: order documents stored on R2", () => {
  it("uploads generated order documents to R2 from ensureOrderDocument", () => {
    expect(ordersApiSource).toContain("storeBufferInR2");
    expect(ordersApiSource).toContain('kind: "documents"');
    expect(ordersApiSource).toContain("syncOrderDocumentPdfToR2");
  });

  it("serializes order document URLs through the R2 public resolver", () => {
    expect(orderServiceSource).toContain("resolveStoredFilePublicUrl");
    expect(orderServiceSource).toContain("tax_invoice_url: taxInvoiceUrl ?? undefined");
    expect(orderServiceSource).toContain("receipt_url: receiptUrl ?? undefined");
  });

  it("serves stored document binaries from R2 when pdfUrl is an r2 ref", () => {
    expect(documentDownloadSource).toContain('document.pdfUrl?.startsWith("r2:")');
    expect(documentDownloadSource).toContain("readStoredFile(document.pdfUrl)");
    expect(orderDocumentPdfRouteSource).toContain('document.pdfUrl?.startsWith("r2:")');
    expect(orderDocumentPdfRouteSource).toContain("readStoredFile(document.pdfUrl)");
  });

  it("supports public URL resolution for stored files", () => {
    expect(storageFilesSource).toContain("buildStoredFilePublicUrl");
    expect(storageFilesSource).toContain("resolveStoredFilePublicUrl");
  });
});
