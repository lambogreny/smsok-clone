/**
 * EasyThunder SMS Gateway — DTAC Corporate Gateway
 * Base URL: https://sms-api.cl1.easythunder.com
 *
 * Flow: POST /auth/login → Bearer JWT → POST /sms/send
 * Max 1000 numbers per request, sender max 11 chars
 * msgType: E=English, T=Thai, H=Hex(Unicode)
 */

const SMS_API_URL = process.env.SMS_API_URL || "https://sms-api.cl1.easythunder.com";
const SMS_API_USERNAME = process.env.SMS_API_USERNAME || "";
const SMS_API_PASSWORD = process.env.SMS_API_PASSWORD || "";

// Webhook URL for EasyThunder DLR callbacks — must be publicly accessible
const SMS_WEBHOOK_URL = process.env.SMS_WEBHOOK_URL ||
  (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/sms/webhook` : "");

let cachedToken: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;

// ==========================================
// Auth — Login to get JWT token
// ==========================================

async function login(): Promise<{ accessToken: string; refreshToken: string }> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken;
  }

  const res = await fetch(`${SMS_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: SMS_API_USERNAME,
      password: SMS_API_PASSWORD,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[sms-gateway] login failed:", res.status, body);
    throw new Error("ส่ง SMS ไม่สำเร็จ — gateway authentication failed");
  }

  const json = await res.json();
  const { accessToken, refreshToken, expiresIn } = json.data;
  cachedToken = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + (expiresIn || 3600) * 1000 - 60_000,
  };

  return { accessToken, refreshToken };
}

// ==========================================
// Refresh token
// ==========================================

async function refreshToken(): Promise<string> {
  if (!cachedToken?.refreshToken) {
    const { accessToken } = await login();
    return accessToken;
  }

  const res = await fetch(`${SMS_API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: cachedToken.refreshToken }),
  });

  if (!res.ok) {
    // Refresh failed — do full login
    cachedToken = null;
    const { accessToken } = await login();
    return accessToken;
  }

  const json = await res.json();
  cachedToken = {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken || cachedToken.refreshToken,
    expiresAt: Date.now() + (json.data.expiresIn || 3600) * 1000 - 60_000,
  };

  return json.data.accessToken;
}

// ==========================================
// Get valid access token (auto-login/refresh)
// ==========================================

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }
  const { accessToken } = await login();
  return accessToken;
}

// ==========================================
// Detect message type
// ==========================================

function detectMsgType(message: string): "E" | "T" | "H" {
  const hasThai = /[\u0E00-\u0E7F]/.test(message);
  if (hasThai) return "T";
  // Check for any non-ASCII (Unicode) characters
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  if (hasUnicode) return "H";
  return "E";
}

// ==========================================
// Format phone for API (66XXXXXXXXX)
// ==========================================

function formatPhoneForApi(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return "66" + cleaned.slice(1);
  }
  if (cleaned.startsWith("+66")) {
    return cleaned.slice(1);
  }
  if (cleaned.startsWith("66")) {
    return cleaned;
  }
  return cleaned;
}

// ==========================================
// Send SMS — single or batch
// ==========================================

export type SendSmsParams = {
  recipients: string[]; // Thai phone numbers (0891234567 or +66891234567)
  message: string;
  sender: string; // max 11 chars
};

export type SendSmsResult = {
  success: boolean;
  jobId?: string;
  error?: string;
  totalSent?: number;
};

export async function sendSmsBatch(params: SendSmsParams): Promise<SendSmsResult> {
  const { recipients, message, sender } = params;

  if (recipients.length === 0) {
    return { success: false, error: "No recipients" };
  }

  if (recipients.length > 1000) {
    return { success: false, error: "Max 1000 recipients per request" };
  }

  if (sender.length > 11) {
    return { success: false, error: "Sender name max 11 characters" };
  }

  const token = await getToken();
  const msgType = detectMsgType(message);
  const msnList = recipients.map(formatPhoneForApi);

  const res = await fetch(`${SMS_API_URL}/sms/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      msnList,
      message,
      sender,
      msgType,
      ...(SMS_WEBHOOK_URL ? { webhookUrl: SMS_WEBHOOK_URL } : {}),
    }),
  });

  if (res.status === 401) {
    // Token expired — refresh and retry once
    const newToken = await refreshToken();
    const retryRes = await fetch(`${SMS_API_URL}/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
      },
      body: JSON.stringify({
        msnList,
        message,
        sender,
        msgType,
        ...(SMS_WEBHOOK_URL ? { webhookUrl: SMS_WEBHOOK_URL } : {}),
      }),
    });

    if (!retryRes.ok) {
      const body = await retryRes.text();
      return { success: false, error: `SMS send failed after retry: ${retryRes.status} ${body}` };
    }

    const retryJson = await retryRes.json();
    return { success: true, jobId: retryJson.data?.jobId, totalSent: msnList.length };
  }

  if (!res.ok) {
    const body = await res.text();
    return { success: false, error: `SMS send failed: ${res.status} ${body}` };
  }

  const json = await res.json();
  return { success: true, jobId: json.data?.jobId, totalSent: msnList.length };
}

// ==========================================
// Send single SMS (convenience wrapper)
// ==========================================

export async function sendSingleSms(
  recipient: string,
  message: string,
  sender: string
): Promise<SendSmsResult> {
  return sendSmsBatch({ recipients: [recipient], message, sender });
}

// ==========================================
// Check job status
// ==========================================

export type JobStatus = {
  jobId: string;
  status: string;
  totalSent?: number;
  totalDelivered?: number;
  totalFailed?: number;
};

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const token = await getToken();

  const res = await fetch(`${SMS_API_URL}/sms/jobs/${jobId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[sms-gateway] job status failed:", res.status, body);
    throw new Error("ไม่สามารถตรวจสอบสถานะ SMS ได้");
  }

  const json = await res.json();
  return json.data;
}
