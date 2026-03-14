/**
 * EasySlip API — Payment Slip Verification
 * Verify endpoint: https://developer.easyslip.com/api/v1/verify
 * Auth: Bearer token in Authorization header
 */

const DEFAULT_EASYSLIP_VERIFY_URL = "https://developer.easyslip.com/api/v1/verify";
const EASYSLIP_VERIFY_URL = process.env.EASYSLIP_API_URL || DEFAULT_EASYSLIP_VERIFY_URL;
const EASYSLIP_API_KEY = process.env.EASYSLIP_API_KEY || "";

type EasySlipApiResponse = {
  status?: number | string;
  message?: string;
  code?: string;
  error?: string | { code?: string; message?: string };
  isDuplicate?: boolean;
  data?: {
    transRef?: unknown;
    date?: unknown;
    amount?: { amount?: unknown } | unknown;
    isDuplicate?: unknown;
    duplicate?: unknown;
    sender?: {
      displayName?: unknown;
      bank?: { short?: unknown };
      account?: {
        value?: unknown;
        name?: { th?: unknown; en?: unknown };
        bank?: { account?: unknown };
      };
    };
    receiver?: {
      displayName?: unknown;
      bank?: { short?: unknown };
      account?: {
        value?: unknown;
        name?: { th?: unknown; en?: unknown };
        bank?: { account?: unknown };
      };
    };
  };
};

export type SlipVerifyResult = {
  success: boolean;
  data?: {
    transRef: string;
    date: string;
    amount: number;
    sender: { name: string; bank: string; account: string };
    receiver: { name: string; bank: string; account: string };
  };
  error?: string;
  providerCode?: string;
  providerStatus?: number;
  isDuplicate?: boolean;
};

function toNonEmptyString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;
    const amount = Number.parseFloat(normalized);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  if (value && typeof value === "object" && "amount" in value) {
    return parseAmount((value as { amount?: unknown }).amount);
  }

  return null;
}

function extractProviderCode(payload: EasySlipApiResponse | null | undefined) {
  if (!payload) return undefined;

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (payload.error && typeof payload.error === "object") {
    return toNonEmptyString(payload.error.code) ?? toNonEmptyString(payload.error.message) ?? undefined;
  }

  return toNonEmptyString(payload.code) ?? toNonEmptyString(payload.message) ?? undefined;
}

function extractDuplicateFlag(payload: EasySlipApiResponse | null | undefined, providerCode?: string) {
  if (!payload) return providerCode?.toLowerCase().includes("duplicate") ?? false;

  const duplicateValue =
    payload.isDuplicate ??
    payload.data?.isDuplicate ??
    payload.data?.duplicate ??
    null;

  if (typeof duplicateValue === "boolean") {
    return duplicateValue;
  }

  if (typeof duplicateValue === "string") {
    const normalized = duplicateValue.trim().toLowerCase();
    if (["true", "1", "duplicate", "yes"].includes(normalized)) {
      return true;
    }
  }

  return providerCode?.toLowerCase().includes("duplicate") ?? false;
}

function buildValidationError(
  error: string,
  providerStatus?: number,
  providerCode = "invalid_response",
): SlipVerifyResult {
  return {
    success: false,
    error,
    providerCode,
    providerStatus,
  };
}

function mapVerifySuccess(payload: EasySlipApiResponse, providerStatus?: number): SlipVerifyResult {
  const transRef = toNonEmptyString(payload.data?.transRef);
  if (!transRef) {
    return buildValidationError("EasySlip response missing transRef", providerStatus);
  }

  const date = toNonEmptyString(payload.data?.date);
  if (!date) {
    return buildValidationError("EasySlip response missing date", providerStatus);
  }

  const amount = parseAmount(payload.data?.amount);
  if (!amount) {
    return buildValidationError("EasySlip response amount must be greater than 0", providerStatus);
  }

  const senderAccount =
    toNonEmptyString(payload.data?.sender?.account?.bank?.account) ??
    toNonEmptyString(payload.data?.sender?.account?.value);
  if (!senderAccount) {
    return buildValidationError("EasySlip response missing sender account", providerStatus);
  }

  const receiverAccount =
    toNonEmptyString(payload.data?.receiver?.account?.bank?.account) ??
    toNonEmptyString(payload.data?.receiver?.account?.value);
  if (!receiverAccount) {
    return buildValidationError("EasySlip response missing receiver account", providerStatus);
  }

  return {
    success: true,
    isDuplicate: extractDuplicateFlag(payload),
    data: {
      transRef,
      date,
      amount,
      sender: {
        name: toNonEmptyString(payload.data?.sender?.account?.name?.th) ??
              toNonEmptyString(payload.data?.sender?.displayName) ?? "",
        bank: toNonEmptyString(payload.data?.sender?.bank?.short) ?? "",
        account: senderAccount,
      },
      receiver: {
        name: toNonEmptyString(payload.data?.receiver?.account?.name?.th) ??
              toNonEmptyString(payload.data?.receiver?.displayName) ?? "",
        bank: toNonEmptyString(payload.data?.receiver?.bank?.short) ?? "",
        account: receiverAccount,
      },
    },
  };
}

// ==========================================
// Verify slip by image URL (download → multipart upload)
// ==========================================

export async function verifySlipByUrl(imageUrl: string): Promise<SlipVerifyResult> {
  if (!EASYSLIP_API_KEY) {
    return { success: false, error: "EasySlip API key not configured" };
  }

  let imageBlob: Blob;
  try {
    const dlRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
    if (!dlRes.ok) {
      console.error("[easyslip] failed to download slip image:", dlRes.status);
      return { success: false, error: "Failed to download slip image" };
    }
    imageBlob = await dlRes.blob();
  } catch (error) {
    console.error("[easyslip] slip image download failed:", error);
    return { success: false, error: "Slip image download failed" };
  }

  let res: Response;
  try {
    const form = new FormData();
    form.append("file", imageBlob, "slip.jpg");

    res = await fetch(EASYSLIP_VERIFY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EASYSLIP_API_KEY}`,
      },
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("[easyslip] verify request failed:", error);
    return { success: false, error: "EasySlip unavailable" };
  }

  if (!res.ok) {
    const body = await res.text();
    console.error("[easyslip] verify failed:", res.status, body);

    let payload: EasySlipApiResponse | undefined;
    try {
      payload = JSON.parse(body) as EasySlipApiResponse;
    } catch {
      payload = undefined;
    }
    const providerCode = extractProviderCode(payload);
    const isDuplicate = extractDuplicateFlag(payload, providerCode);

    if (providerCode === "application_expired") {
      return {
        success: false,
        error: "EasySlip application expired",
        providerCode,
        providerStatus: res.status,
        isDuplicate,
      };
    }

    return {
      success: false,
      error: providerCode || "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่",
      providerCode,
      providerStatus: res.status,
      isDuplicate,
    };
  }

  const data = await res.json() as EasySlipApiResponse;

  if (data.status !== 200 && data.status !== "success") {
    const providerCode = extractProviderCode(data);
    return {
      success: false,
      error: providerCode || "Verification failed",
      providerCode,
      isDuplicate: extractDuplicateFlag(data, providerCode),
    };
  }

  return mapVerifySuccess(data, res.status);
}

// ==========================================
// Get API quota info
// ==========================================

export async function getQuota(): Promise<{ used: number; total: number; remaining: number } | null> {
  if (!EASYSLIP_API_KEY) return null;

  const verifyUrl = new URL(EASYSLIP_VERIFY_URL);
  const quotaUrl = `${verifyUrl.origin}${verifyUrl.pathname.replace(/\/verify$/, "/me")}`;
  const res = await fetch(quotaUrl, {
    headers: { Authorization: `Bearer ${EASYSLIP_API_KEY}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    used: data.data?.quota?.used || 0,
    total: data.data?.quota?.total || 0,
    remaining: (data.data?.quota?.total || 0) - (data.data?.quota?.used || 0),
  };
}
