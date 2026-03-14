import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const sendRoute = readFileSync(resolve(ROOT, "app/api/v1/sms/send/route.ts"), "utf-8");
const batchRoute = readFileSync(resolve(ROOT, "app/api/v1/sms/batch/route.ts"), "utf-8");
const balanceRoute = readFileSync(resolve(ROOT, "app/api/v1/credits/balance/route.ts"), "utf-8");
const sendersRoute = readFileSync(resolve(ROOT, "app/api/v1/senders/route.ts"), "utf-8");
const otpSendRoute = readFileSync(resolve(ROOT, "app/api/v1/otp/send/route.ts"), "utf-8");
const otpVerifyRoute = readFileSync(resolve(ROOT, "app/api/v1/otp/verify/route.ts"), "utf-8");
const tagsRoute = readFileSync(resolve(ROOT, "app/api/v1/tags/route.ts"), "utf-8");
const campaignsRoute = readFileSync(resolve(ROOT, "app/api/v1/campaigns/route.ts"), "utf-8");

// ==========================================
// POST /api/v1/sms/send
// ==========================================

describe("API Route: POST /api/v1/sms/send", () => {
  it("exports POST handler", () => {
    expect(sendRoute).toContain("async function POST");
  });

  it("authenticates with API key", () => {
    expect(sendRoute).toContain("authenticateRequest");
  });

  it("calls sendSms action", () => {
    expect(sendRoute).toContain("sendSms");
  });

  it("maps body.sender to senderName", () => {
    expect(sendRoute).toContain("senderName: input.sender");
  });

  it("maps body.to to recipient", () => {
    expect(sendRoute).toContain("recipient: input.to");
  });

  it("returns 201 on success", () => {
    expect(sendRoute).toContain("201");
  });

  it("response includes id, status, credits_used, credits_remaining", () => {
    expect(sendRoute).toContain("id: msg.id");
    expect(sendRoute).toContain("status: msg.status");
    expect(sendRoute).toContain("sms_used: msg.creditCost");
    expect(sendRoute).toContain("sms_remaining");
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
    expect(batchRoute).toContain("authenticateRequest");
  });

  it("calls sendBatchSms action", () => {
    expect(batchRoute).toContain("sendBatchSms");
  });

  it("maps body.to to recipients array", () => {
    expect(batchRoute).toContain("recipients: input.to");
  });

  it("returns total_messages and credits", () => {
    expect(batchRoute).toContain("total_messages");
    expect(batchRoute).toContain("sms_used");
    expect(batchRoute).toContain("sms_remaining");
  });
});

// ==========================================
// GET /api/v1/credits/balance
// ==========================================

describe("API Route: GET /api/v1/credits/balance", () => {
  it("exports GET handler", () => {
    expect(balanceRoute).toContain("async function GET");
  });

  it("authenticates with session", () => {
    expect(balanceRoute).toContain("getSession");
  });

  it("proxies to shared credits balance endpoint", () => {
    expect(balanceRoute).toContain('new URL("/api/credits/balance", req.url)');
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
    expect(sendersRoute).toContain("authenticateRequest");
  });

  it("queries sender names from DB", () => {
    expect(sendersRoute).toContain("senderName.findMany");
  });

  it("returns sender names array", () => {
    expect(sendersRoute).toContain("senders,");
    expect(sendersRoute).toContain("quota:");
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

describe("API Route: /api/v1/tags", () => {
  it("authenticates with API key auth", () => {
    expect(tagsRoute).toContain("authenticateRequest");
  });

  it("supports getTags", () => {
    expect(tagsRoute).toContain("getTags");
  });

  it("supports createTag", () => {
    expect(tagsRoute).toContain("createTag");
  });
});

describe("API Route: /api/v1/campaigns", () => {
  it("authenticates with API key auth", () => {
    expect(campaignsRoute).toContain("authenticateRequest");
  });

  it("supports getCampaigns", () => {
    expect(campaignsRoute).toContain("getCampaigns");
  });

  it("supports createCampaign", () => {
    expect(campaignsRoute).toContain("createCampaign");
  });
});
