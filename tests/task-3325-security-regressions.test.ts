import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { toCsvCell } from "@/lib/csv";
import { withdrawConsent } from "@/lib/actions/consent";
import { middleware } from "@/middleware";
import { GET as exportContactsRoute } from "@/app/api/v1/contacts/export/route";

const ROOT = process.cwd();
const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  requireApiPermission: vi.fn(),
  exportContacts: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  authenticateRequest: mocks.authenticateRequest,
  apiResponse: (data: unknown, status = 200) => Response.json(data, { status }),
  apiError: (error: unknown) => {
    throw error;
  },
}));

vi.mock("@/lib/rbac", () => ({
  requireApiPermission: mocks.requireApiPermission,
}));

vi.mock("@/lib/actions/contacts", () => ({
  exportContacts: mocks.exportContacts,
}));

describe("Task #3325: CSV + auth + PDPA regressions", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-admin-jwt-secret-3325-long-enough";

    mocks.authenticateRequest.mockResolvedValue({ id: "user_3325", role: "USER" });
    mocks.requireApiPermission.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("neutralizes formula-leading cells with the shared CSV helper", () => {
    expect(toCsvCell("=2+3")).toBe("\"'=2+3\"");
    expect(toCsvCell("+SUM(A1:A2)")).toBe("\"'+SUM(A1:A2)\"");
    expect(toCsvCell("@admin")).toBe("\"'@admin\"");
    expect(toCsvCell("normal")).toBe("\"normal\"");
  });

  it("contacts CSV export neutralizes formula payloads", async () => {
    mocks.exportContacts.mockResolvedValue([
      {
        name: "=cmd|' /C calc'!A0",
        phone: "0891234567",
        email: "victim@example.com",
        tags: "@finance",
        groups: "VIP",
        createdAt: "2026-03-14T10:00:00.000Z",
      },
    ]);

    const response = await exportContactsRoute(
      new NextRequest("http://localhost/api/v1/contacts/export?format=csv"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    const csv = new TextDecoder().decode(bytes);
    expect(csv).toContain("\"'=cmd|' /C calc'!A0\"");
    expect(csv).toContain("\"'@finance\"");
  });

  it("signs and verifies admin JWTs with jti in the auth layer", async () => {
    const { signAdminToken, verifyAdminToken } = await import("@/lib/admin-auth");
    const token = signAdminToken("admin_1", "SUPER_ADMIN", "session_1");
    const payload = verifyAdminToken(token);

    expect(payload).toMatchObject({
      type: "admin",
      adminId: "admin_1",
      role: "SUPER_ADMIN",
      sessionId: "session_1",
    });
    expect(typeof payload?.jti).toBe("string");
    expect(payload?.jti.length).toBeGreaterThan(0);
  });

  it("redirects /admin when the admin JWT is expired or signed with the wrong secret", async () => {
    const expiredToken = jwt.sign(
      {
        type: "admin",
        adminId: "admin_1",
        role: "SUPER_ADMIN",
        sessionId: "session_1",
        jti: "jti_expired",
      },
      `${process.env.JWT_SECRET}_admin`,
      { expiresIn: -1 },
    );

    const invalidToken = jwt.sign(
      {
        type: "admin",
        adminId: "admin_1",
        role: "SUPER_ADMIN",
        sessionId: "session_1",
        jti: "jti_invalid",
      },
      "wrong-secret",
      { expiresIn: "1h" },
    );

    const expiredResponse = await middleware(
      new NextRequest("http://localhost/admin", {
        headers: { cookie: `admin_session=${expiredToken}` },
      }),
    );
    const invalidResponse = await middleware(
      new NextRequest("http://localhost/admin", {
        headers: { cookie: `admin_session=${invalidToken}` },
      }),
    );

    expect(expiredResponse.status).toBe(307);
    expect(expiredResponse.headers.get("location")).toBe("http://localhost/login");
    expect(invalidResponse.status).toBe(307);
    expect(invalidResponse.headers.get("location")).toBe("http://localhost/login");
  });

  it("blocks SERVICE and THIRD_PARTY withdrawal through PDPA helper", async () => {
    await expect(
      withdrawConsent({ userId: "user_3325", consentType: "SERVICE" }),
    ).rejects.toThrow("ไม่สามารถถอนความยินยอม Service");

    await expect(
      withdrawConsent({ userId: "user_3325", consentType: "THIRD_PARTY" }),
    ).rejects.toThrow("ไม่สามารถถอนความยินยอม Third-party");
  });

  it("wires the remaining CSV export surfaces to the shared helper", () => {
    const contactsClient = readFileSync(
      resolve(ROOT, "app/(dashboard)/dashboard/contacts/ContactsClient.tsx"),
      "utf8",
    );
    const messagesClient = readFileSync(
      resolve(ROOT, "app/(dashboard)/dashboard/messages/MessagesClient.tsx"),
      "utf8",
    );
    const logsClient = readFileSync(
      resolve(ROOT, "app/(dashboard)/dashboard/logs/LogsClient.tsx"),
      "utf8",
    );
    const auditActions = readFileSync(
      resolve(ROOT, "lib/actions/audit.ts"),
      "utf8",
    );

    for (const source of [contactsClient, messagesClient, logsClient]) {
      expect(source).toContain('import { toCsvCell } from "@/lib/csv";');
    }

    expect(contactsClient).toContain(".map((h) => toCsvCell(row[h] || \"\"))");
    expect(messagesClient).toContain("toCsvCell(msg.content)");
    expect(messagesClient).toContain("[\"วันที่\", \"ผู้รับ\", \"เนื้อหา\", \"ผู้ส่ง\", \"สถานะ\", \"ราคา (SMS)\"].map(toCsvCell)");
    expect(logsClient).toContain(".map(toCsvCell)");
    expect(auditActions).toContain('import { toCsvCell } from "../csv";');
    expect(auditActions).toContain("].map(toCsvCell).join(\",\")");
    expect(auditActions).toContain("toCsvCell(userName)");
  });
});
