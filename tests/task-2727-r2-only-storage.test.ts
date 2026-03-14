import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const r2Mocks = vi.hoisted(() => ({
  uploadFileToR2: vi.fn(),
  downloadFileFromR2: vi.fn(),
  deleteFileFromR2: vi.fn(),
}));

vi.mock("@/lib/storage/r2", () => ({
  uploadFileToR2: r2Mocks.uploadFileToR2,
  downloadFileFromR2: r2Mocks.downloadFileFromR2,
  deleteFileFromR2: r2Mocks.deleteFileFromR2,
}));

describe("Task #2715: slip upload fail-soft", () => {
  const originalEnv = {
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    EASYSLIP_API_KEY: process.env.EASYSLIP_API_KEY,
    EASYSLIP_API_URL: process.env.EASYSLIP_API_URL,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.R2_ENDPOINT = "https://example.r2.cloudflarestorage.com";
    process.env.R2_BUCKET = "smsok-clone";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.EASYSLIP_API_KEY = "test-easyslip-key";
    process.env.EASYSLIP_API_URL = "https://document.easyslip.com/documents/verify/bank/image";
  });

  afterEach(() => {
    process.env.R2_ENDPOINT = originalEnv.R2_ENDPOINT;
    process.env.R2_BUCKET = originalEnv.R2_BUCKET;
    process.env.R2_ACCESS_KEY_ID = originalEnv.R2_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = originalEnv.R2_SECRET_ACCESS_KEY;
    process.env.EASYSLIP_API_KEY = originalEnv.EASYSLIP_API_KEY;
    process.env.EASYSLIP_API_URL = originalEnv.EASYSLIP_API_URL;
    vi.unstubAllGlobals();
  });

  it("throws a storage error when R2 upload fails", async () => {
    r2Mocks.uploadFileToR2.mockRejectedValue(new Error("R2 unavailable"));
    const { storeBufferInR2 } = await import("@/lib/storage/service");

    await expect(
      storeBufferInR2({
        userId: "user_1",
        scope: "orders",
        resourceId: "order_1",
        kind: "slips",
        body: Buffer.from("fixture"),
        contentType: "image/jpeg",
        fileName: "real-slip-test.jpg",
      }),
    ).rejects.toThrow("R2 upload failed");
  });

  it("returns a fail-soft result when EasySlip requests throw", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const { verifySlipByUrl } = await import("@/lib/easyslip");

    const result = await verifySlipByUrl("https://signed.example/slip.jpg");

    expect(result).toEqual({
      success: false,
      error: "EasySlip unavailable",
    });
  });

  it("normalizes the docs URL to the real EasySlip verify API endpoint", async () => {
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
        status: 404,
        message: "slip_not_found",
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }));

    vi.stubGlobal("fetch", fetchMock);
    process.env.EASYSLIP_API_URL = "https://document.easyslip.com/documents/verify/bank/image";

    const { verifySlipByUrl } = await import("@/lib/easyslip");
    await verifySlipByUrl("https://signed.example/slip.jpg");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://developer.easyslip.com/api/v1/verify",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-easyslip-key",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ url: "https://signed.example/slip.jpg", checkDuplicate: true }),
      }),
    );
  });
});
