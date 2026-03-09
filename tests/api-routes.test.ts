import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const sendRoute = readFileSync(resolve(ROOT, "app/api/v1/sms/send/route.ts"), "utf-8");
const batchRoute = readFileSync(resolve(ROOT, "app/api/v1/sms/batch/route.ts"), "utf-8");
const balanceRoute = readFileSync(resolve(ROOT, "app/api/v1/balance/route.ts"), "utf-8");
const sendersRoute = readFileSync(resolve(ROOT, "app/api/v1/senders/route.ts"), "utf-8");
const otpSendRoute = readFileSync(resolve(ROOT, "app/api/v1/otp/send/route.ts"), "utf-8");
const otpVerifyRoute = readFileSync(resolve(ROOT, "app/api/v1/otp/verify/route.ts"), "utf-8");

// ==========================================
// POST /api/v1/sms/send
// ==========================================

describe("API Route: POST /api/v1/sms/send", () => {
  it("exports POST handler", () => {
    expect(sendRoute).toContain("async function POST");
  });

  it("authenticates with API key", () => {
    expect(sendRoute).toContain("authenticateApiKey");
  });

  it("calls sendSms action", () => {
    expect(sendRoute).toContain("sendSms");
  });

  it("maps body.sender to senderName", () => {
    expect(sendRoute).toContain('body.sender || "EasySlip"');
  });

  it("maps body.to to recipient", () => {
    expect(sendRoute).toContain("recipient: body.to");
  });

  it("returns 201 on success", () => {
    expect(sendRoute).toContain("201");
  });

  it("response includes id, status, credits_used, credits_remaining", () => {
    expect(sendRoute).toContain("id: message.id");
    expect(sendRoute).toContain("status: message.status");
    expect(sendRoute).toContain("credits_used: message.creditCost");
    expect(sendRoute).toContain("credits_remaining");
  });

  it("handles errors with apiError", () => {
    expect(sendRoute).toContain("apiError(error)");
  });
});

// ==========================================
// POST /api/v1/sms/batch
// ==========================================

describe("API Route: POST /api/v1/sms/batch", () => {
  it("exports POST handler", () => {
    expect(batchRoute).toContain("async function POST");
  });

  it("authenticates with API key", () => {
    expect(batchRoute).toContain("authenticateApiKey");
  });

  it("calls sendBatchSms action", () => {
    expect(batchRoute).toContain("sendBatchSms");
  });

  it("maps body.to to recipients array", () => {
    expect(batchRoute).toContain("recipients: body.to");
  });

  it("returns total_messages and credits", () => {
    expect(batchRoute).toContain("total_messages");
    expect(batchRoute).toContain("credits_used");
    expect(batchRoute).toContain("credits_remaining");
  });
});

// ==========================================
// GET /api/v1/balance
// ==========================================

describe("API Route: GET /api/v1/balance", () => {
  it("exports GET handler", () => {
    expect(balanceRoute).toContain("async function GET");
  });

  it("authenticates with API key", () => {
    expect(balanceRoute).toContain("authenticateApiKey");
  });

  it("returns credits", () => {
    expect(balanceRoute).toContain("credits: user.credits");
  });
});

// ==========================================
// GET /api/v1/senders
// ==========================================

describe("API Route: GET /api/v1/senders", () => {
  it("exports GET handler", () => {
    expect(sendersRoute).toContain("async function GET");
  });

  it("authenticates with API key", () => {
    expect(sendersRoute).toContain("authenticateApiKey");
  });

  it("calls getApprovedSenderNames", () => {
    expect(sendersRoute).toContain("getApprovedSenderNames");
  });

  it("returns sender names array", () => {
    expect(sendersRoute).toContain("senders:");
  });
});

describe("API Route: POST /api/v1/otp/send", () => {
  it("exports POST handler", () => {
    expect(otpSendRoute).toContain("async function POST");
  });

  it("delegates to OTP send handler", () => {
    expect(otpSendRoute).toContain("handleSendOtp");
  });
});

describe("API Route: POST /api/v1/otp/verify", () => {
  it("exports POST handler", () => {
    expect(otpVerifyRoute).toContain("async function POST");
  });

  it("delegates to OTP verify handler", () => {
    expect(otpVerifyRoute).toContain("handleVerifyOtp");
  });
});
