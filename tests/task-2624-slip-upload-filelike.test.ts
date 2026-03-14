import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { coerceUploadedFile } from "@/lib/uploaded-file";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  orderFindFirst: vi.fn(),
  transaction: vi.fn(),
  orderSlipCreate: vi.fn(),
  orderSlipUpdate: vi.fn(),
  orderUpdate: vi.fn(),
  orderHistoryCreate: vi.fn(),
  createOrderHistory: vi.fn(),
  storeUploadedFile: vi.fn(),
  removeStoredFile: vi.fn(),
  queueWaitUntilReady: vi.fn(),
  queueAdd: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findFirst: mocks.orderFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/orders/service", () => ({
  createOrderHistory: mocks.createOrderHistory,
  serializeOrder: vi.fn((value: unknown) => value),
  serializeOrderSlip: vi.fn((value: unknown) => value),
  serializeOrderV2: vi.fn((value: unknown) => value),
}));

vi.mock("@/lib/storage/service", () => ({
  storeUploadedFile: mocks.storeUploadedFile,
  removeStoredFile: mocks.removeStoredFile,
  StorageUploadError: class StorageUploadError extends Error {},
}));

vi.mock("@/lib/queue/queues", () => ({
  slipVerifyQueue: {
    waitUntilReady: mocks.queueWaitUntilReady,
    add: mocks.queueAdd,
  },
}));

import { POST as uploadOrderSlip } from "@/app/api/v1/orders/[id]/upload/route";
import { POST as uploadCanonicalOrderSlip } from "@/app/api/orders/[id]/slip/route";

const slipFixture = readFileSync(resolve(__dirname, "fixtures/real-slip-test.jpg"));
const middlewareSource = readFileSync(resolve(__dirname, "..", "middleware.ts"), "utf-8");

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function createFileLikeSlip() {
  return {
    name: "real-slip-test.jpg",
    type: "image/jpeg",
    size: slipFixture.byteLength,
    arrayBuffer: vi.fn().mockResolvedValue(toArrayBuffer(slipFixture)),
  };
}

function createRequestWithSlip(slip: ReturnType<typeof createFileLikeSlip>) {
  return {
    formData: vi.fn().mockResolvedValue({
      get: (key: string) => (key === "slip" ? slip : null),
    }),
  } as unknown as Request;
}

const pendingOrder = {
  id: "order_1",
  userId: "user_1",
  organizationId: null,
  packageTierId: "tier_1",
  smsCount: 100,
  customerType: "INDIVIDUAL",
  payAmount: 100,
  hasWht: false,
  status: "PENDING_PAYMENT",
  expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  whtCertUrl: null,
};

const verifyingOrder = {
  id: "order_1",
  orderNumber: "ORD-TEST-0001",
  packageTierId: "tier_1",
  packageName: "Starter",
  smsCount: 100,
  customerType: "INDIVIDUAL",
  taxName: "QA Tester",
  taxId: "1234567890123",
  taxAddress: "Bangkok",
  taxBranchType: "HEAD",
  taxBranchNumber: null,
  netAmount: 93.46,
  vatAmount: 6.54,
  totalAmount: 100,
  hasWht: false,
  whtAmount: 0,
  payAmount: 100,
  status: "VERIFYING",
  expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  quotationNumber: null,
  quotationUrl: null,
  invoiceNumber: null,
  invoiceUrl: null,
  slipUrl: "r2:users/user_1/orders/order_1/slips/fixture.jpg",
  whtCertUrl: null,
  easyslipVerified: false,
  rejectReason: null,
  adminNote: null,
  paidAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date("2099-01-01T00:00:00.000Z"),
};

const createdSlip = {
  id: "slip_1",
  fileUrl: "r2:users/user_1/orders/order_1/slips/fixture.jpg",
  fileKey: "users/user_1/orders/order_1/slips/fixture.jpg",
  fileSize: slipFixture.byteLength,
  fileType: "image/jpeg",
  uploadedAt: new Date("2099-01-01T00:00:00.000Z"),
  verifiedAt: null,
  verifiedBy: null,
  deletedAt: null,
};

describe("Task #2624: slip upload accepts file-like multipart entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ id: "user_1" });
    mocks.orderFindFirst.mockResolvedValue(pendingOrder);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        orderSlip: {
          create: mocks.orderSlipCreate,
          update: mocks.orderSlipUpdate,
        },
        order: {
          update: mocks.orderUpdate,
        },
        orderHistory: {
          create: mocks.orderHistoryCreate,
        },
      }));
    mocks.orderSlipCreate.mockResolvedValue(createdSlip);
    mocks.orderSlipUpdate.mockResolvedValue(createdSlip);
    mocks.orderUpdate.mockResolvedValue(verifyingOrder);
    mocks.orderHistoryCreate.mockResolvedValue(undefined);
    mocks.queueWaitUntilReady.mockResolvedValue(undefined);
    mocks.queueAdd.mockResolvedValue({ id: "order-slip:slip_1" });
    mocks.storeUploadedFile.mockResolvedValue({
      key: "users/user_1/orders/order_1/slips/fixture.jpg",
      ref: "r2:users/user_1/orders/order_1/slips/fixture.jpg",
      body: slipFixture,
      contentType: "image/jpeg",
      storage: "r2",
    });
    mocks.removeStoredFile.mockResolvedValue(undefined);
  });

  it("coerces multipart file-like entries even when they are not File instances", async () => {
    const slip = createFileLikeSlip();

    if (typeof File !== "undefined") {
      expect(slip).not.toBeInstanceOf(File);
    }

    const uploaded = coerceUploadedFile(slip as never);

    expect(uploaded).not.toBeNull();
    expect(uploaded?.name).toBe("real-slip-test.jpg");
    expect(uploaded?.type).toBe("image/jpeg");
    expect(uploaded?.size).toBe(slipFixture.byteLength);
  });

  it("stores the slip and queues background verification on the v1 route", async () => {
    const response = await uploadOrderSlip(createRequestWithSlip(createFileLikeSlip()), {
      params: Promise.resolve({ id: "order_1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "VERIFYING",
      verified: false,
      pending_review: false,
      queued: true,
      latest_status_note: "เราได้รับสลิปแล้ว กำลังตรวจสอบรายการชำระเงิน",
      latest_slip: {
        id: "slip_1",
      },
    });
    expect(mocks.orderSlipCreate).toHaveBeenCalledTimes(1);
    expect(mocks.orderUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.queueAdd).toHaveBeenCalledTimes(1);
    expect(mocks.storeUploadedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        scope: "orders",
        resourceId: "order_1",
        kind: "slips",
      }),
    );
    expect(mocks.queueAdd).toHaveBeenCalledWith(
      "verify-order-slip",
      expect.objectContaining({
        orderId: "order_1",
        userId: "user_1",
      }),
      expect.objectContaining({
        jobId: expect.stringMatching(/^order-slip-/),
      }),
    );
  });

  it("stores the slip and returns VERIFYING on the canonical route while the worker processes it", async () => {
    const response = await uploadCanonicalOrderSlip(createRequestWithSlip(createFileLikeSlip()), {
      params: Promise.resolve({ id: "order_1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "VERIFYING",
      verified: false,
      pending_review: false,
      queued: true,
      latest_slip: {
        id: "slip_1",
      },
    });
    expect(mocks.queueAdd).toHaveBeenCalledTimes(1);
    expect(mocks.storeUploadedFile).toHaveBeenCalledTimes(1);
  });

  it("rejects duplicate uploads while the existing slip is still verifying", async () => {
    mocks.orderFindFirst.mockResolvedValueOnce({
      ...pendingOrder,
      status: "VERIFYING",
    });

    const response = await uploadCanonicalOrderSlip(createRequestWithSlip(createFileLikeSlip()), {
      params: Promise.resolve({ id: "order_1" }),
    });

    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).toContain("กำลังตรวจสอบสลิปอยู่ กรุณารอ");
    expect(mocks.storeUploadedFile).not.toHaveBeenCalled();
    expect(mocks.queueAdd).not.toHaveBeenCalled();
    expect(mocks.orderSlipCreate).not.toHaveBeenCalled();
  });

  it("cleans up uploaded files when persisting the queued slip fails", async () => {
    mocks.transaction.mockRejectedValueOnce(new Error("db write failed"));

    const response = await uploadCanonicalOrderSlip(createRequestWithSlip(createFileLikeSlip()), {
      params: Promise.resolve({ id: "order_1" }),
    });

    expect(response.status).toBe(500);
    expect(mocks.removeStoredFile).toHaveBeenCalledWith("r2:users/user_1/orders/order_1/slips/fixture.jpg");
    expect(mocks.removeStoredFile).toHaveBeenCalledTimes(1);
  });

  it("rolls the upload back and cleans up files when queue enqueue fails", async () => {
    mocks.queueAdd.mockRejectedValueOnce(new Error("redis unavailable"));

    const response = await uploadCanonicalOrderSlip(createRequestWithSlip(createFileLikeSlip()), {
      params: Promise.resolve({ id: "order_1" }),
    });

    expect(response.status).toBe(503);
    expect(mocks.orderSlipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      }),
    );
    expect(mocks.removeStoredFile).toHaveBeenCalledWith("r2:users/user_1/orders/order_1/slips/fixture.jpg");
  });

  it("rewrites legacy v1 slip endpoints to the canonical slip route before the v1 middleware branch runs", () => {
    expect(middlewareSource).toContain("legacyOrderSlipMatch");
    expect(middlewareSource).toContain('rewriteUrl.pathname = `/api/orders/${legacyOrderSlipMatch[1]}/slip`');
    expect(middlewareSource).toContain('pathname.match(/^\\/api\\/v1\\/orders\\/([^/]+)\\/(?:upload|verify-slip)$/)');
  });
});
