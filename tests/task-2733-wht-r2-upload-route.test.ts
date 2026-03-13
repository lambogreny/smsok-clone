import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  applyRateLimit: vi.fn(),
  invoiceFindFirst: vi.fn(),
  whtCertificateCreate: vi.fn(),
  whtCertificateFindMany: vi.fn(),
  storeUploadedFile: vi.fn(),
  removeStoredFile: vi.fn(),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-auth")>("@/lib/api-auth");
  return {
    ...actual,
    authenticateRequest: mocks.authenticateRequest,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      findFirst: mocks.invoiceFindFirst,
    },
    whtCertificate: {
      create: mocks.whtCertificateCreate,
      findMany: mocks.whtCertificateFindMany,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  applyRateLimit: mocks.applyRateLimit,
}));

vi.mock("@/lib/storage/service", () => ({
  storeUploadedFile: mocks.storeUploadedFile,
  removeStoredFile: mocks.removeStoredFile,
  StorageUploadError: class StorageUploadError extends Error {},
}));

import { GET, POST } from "@/app/api/v1/invoices/[id]/wht-cert/route";

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function createFileLikePdf() {
  const body = Buffer.from("%PDF-1.4 test certificate");

  return {
    name: "wht-cert.pdf",
    type: "application/pdf",
    size: body.byteLength,
    arrayBuffer: vi.fn().mockResolvedValue(toArrayBuffer(body)),
  };
}

describe("Task #2733: WHT certificate uploads store R2 refs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: "user_1", role: "user" });
    mocks.applyRateLimit.mockResolvedValue({ blocked: null, headers: {} });
    mocks.invoiceFindFirst.mockResolvedValue({
      id: "inv_1",
      organizationId: "org_1",
      subtotal: 1000,
      whtRate: 3,
      whtAmount: 30,
      transactionId: "tx_1",
    });
    mocks.storeUploadedFile.mockResolvedValue({
      key: "users/user_1/payments/inv_1/wht/fixture.pdf",
      ref: "r2:users/user_1/payments/inv_1/wht/fixture.pdf",
      body: Buffer.from("fixture"),
      contentType: "application/pdf",
      storage: "r2",
    });
    mocks.whtCertificateCreate.mockResolvedValue({
      id: "cert_1",
      status: "PENDING",
      fileUrl: "r2:users/user_1/payments/inv_1/wht/fixture.pdf",
    });
    mocks.whtCertificateFindMany.mockResolvedValue([
      {
        id: "cert_1",
        status: "PENDING",
        fileUrl: "r2:users/user_1/payments/inv_1/wht/fixture.pdf",
      },
    ]);
    mocks.removeStoredFile.mockResolvedValue(undefined);
  });

  it("accepts multipart WHT uploads and persists the R2 ref", async () => {
    const file = createFileLikePdf();
    const response = await POST(
      {
        formData: vi.fn().mockResolvedValue({
          get: (key: string) =>
            ({
              payerName: "ACME Co., Ltd.",
              payerTaxId: "1234567890123",
              whtDate: "2026-03-13",
              amount: "1000",
              whtRate: "3",
              file,
            })[key] ?? null,
        }),
      } as never,
      { params: Promise.resolve({ id: "inv_1" }) },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: "cert_1",
      status: "PENDING",
      whtAmount: 30,
      fileUrl: "/api/storage/users/user_1/payments/inv_1/wht/fixture.pdf",
    });
    expect(mocks.storeUploadedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        scope: "payments",
        resourceId: "inv_1",
        kind: "wht",
      }),
    );
    expect(mocks.whtCertificateCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileUrl: "r2:users/user_1/payments/inv_1/wht/fixture.pdf",
          invoiceId: "inv_1",
          organizationId: "org_1",
          transactionId: "tx_1",
        }),
      }),
    );
  });

  it("returns proxy URLs for stored WHT certificate refs", async () => {
    const response = await GET(
      {} as never,
      { params: Promise.resolve({ id: "inv_1" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      certificates: [
        {
          id: "cert_1",
          status: "PENDING",
          fileUrl: "/api/storage/users/user_1/payments/inv_1/wht/fixture.pdf",
        },
      ],
    });
    expect(mocks.whtCertificateFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
          OR: [
            { invoiceId: "inv_1" },
            { invoiceId: null, transactionId: "tx_1" },
          ],
        },
      }),
    );
  });

  it("does not fall back to nullable transaction ids when listing invoice certificates", async () => {
    mocks.invoiceFindFirst.mockResolvedValueOnce({
      id: "inv_1",
      organizationId: "org_1",
      subtotal: 1000,
      whtRate: 3,
      whtAmount: 30,
      transactionId: null,
    });
    mocks.whtCertificateFindMany.mockResolvedValueOnce([]);

    const response = await GET(
      {} as never,
      { params: Promise.resolve({ id: "inv_1" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ certificates: [] });
    expect(mocks.whtCertificateFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
          invoiceId: "inv_1",
        },
      }),
    );
  });
});
