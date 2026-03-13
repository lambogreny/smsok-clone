import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");
const healthQueuesSource = readFileSync(
  resolve(ROOT, "app/api/health/queues/route.ts"),
  "utf-8",
);
const sessionUtilsSource = readFileSync(
  resolve(ROOT, "lib/session-utils.ts"),
  "utf-8",
);
const contactsImportSource = readFileSync(
  resolve(ROOT, "app/api/v1/contacts/import/route.ts"),
  "utf-8",
);
const groupsImportSource = readFileSync(
  resolve(ROOT, "app/api/v1/groups/[id]/import/route.ts"),
  "utf-8",
);
const invoicesRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/invoices/route.ts"),
  "utf-8",
);
const invoiceDetailSource = readFileSync(
  resolve(ROOT, "app/api/v1/invoices/[id]/route.ts"),
  "utf-8",
);
const invoicePdfSource = readFileSync(
  resolve(ROOT, "app/api/v1/invoices/[id]/pdf/route.ts"),
  "utf-8",
);
const invoiceStatusSource = readFileSync(
  resolve(ROOT, "app/api/v1/invoices/[id]/status/route.ts"),
  "utf-8",
);
const invoiceWhtSource = readFileSync(
  resolve(ROOT, "app/api/v1/invoices/[id]/wht-cert/route.ts"),
  "utf-8",
);

describe("Task #2689: reviewer audit fixes", () => {
  it("does not auth-gate /api/health probes in middleware", () => {
    expect(middlewareSource).toContain('if (pathname.startsWith("/api/health")) return false;');
  });

  it("allows session cookies as /api/v1 authentication and protects queue health with admin auth", () => {
    expect(middlewareSource).toContain("const hasSessionCookies = Boolean(accessToken || refreshToken);");
    expect(middlewareSource).toContain("if (!authHeader && !apiKey && !hasSessionCookies)");
    expect(middlewareSource).toContain('{ error: "Missing authentication" }');
    expect(healthQueuesSource).toContain("await authenticateAdmin(req)");
    expect(healthQueuesSource).toContain('return Response.json({ error: "Admin authentication required" }, { status: 401 })');
  });

  it("uses the last forwarded hop for client IP extraction", () => {
    expect(sessionUtilsSource).toContain("return forwardedChain[forwardedChain.length - 1];");
    expect(sessionUtilsSource).not.toContain("return forwardedChain[0];");
  });

  it("caps CSV and text imports for contacts and groups", () => {
    expect(contactsImportSource).toContain("const MAX_TEXT_IMPORT_BYTES = 1024 * 1024;");
    expect(contactsImportSource).toContain("const MAX_IMPORT_ROWS = 5000;");
    expect(contactsImportSource).toContain('throw new ApiError(400, "ไฟล์ CSV/TXT ต้องไม่เกิน 1MB")');
    expect(contactsImportSource).toContain('throw new ApiError(400, "ข้อมูล CSV/TXT ต้องไม่เกิน 1MB")');
    expect(contactsImportSource).toContain('throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง")');
    expect(groupsImportSource).toContain("const MAX_TEXT_IMPORT_BYTES = 1024 * 1024;");
    expect(groupsImportSource).toContain("const MAX_IMPORT_ROWS = 5000;");
    expect(groupsImportSource).toContain('throw new ApiError(400, "ไฟล์ CSV/TXT ต้องไม่เกิน 1MB")');
    expect(groupsImportSource).toContain('throw new ApiError(400, "ข้อมูล CSV/TXT ต้องไม่เกิน 1MB")');
    expect(groupsImportSource).toContain('throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง")');
  });

  it("standardizes v1 invoice routes on authenticateRequest", () => {
    expect(invoicesRouteSource).toContain("authenticateRequest(req)");
    expect(invoicesRouteSource).not.toContain("getSession(");
    expect(invoicesRouteSource).toContain('downloadUrl: invoiceNumber ? `/api/v1/invoices/${payment.id}/pdf` : null');

    expect(invoiceDetailSource).toContain("authenticateRequest(req)");
    expect(invoiceDetailSource).not.toContain("getSession(");

    expect(invoicePdfSource).toContain("authenticateRequest(req)");
    expect(invoicePdfSource).not.toContain("getSession(");
    expect(invoicePdfSource).toContain("renderPaymentDocumentPdf");

    expect(invoiceStatusSource).toContain("authenticateRequest(req)");
    expect(invoiceStatusSource).not.toContain("getSession(");

    expect(invoiceWhtSource).toContain("authenticateRequest(req)");
    expect(invoiceWhtSource).not.toContain("getSession(");
  });
});
