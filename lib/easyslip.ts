/**
 * EasySlip API — Payment Slip Verification
 * Base URL: https://developer.easyslip.com/api/v1
 * Auth: Bearer token in Authorization header
 */

const EASYSLIP_API_URL = process.env.EASYSLIP_API_URL || "https://developer.easyslip.com/api/v1";
const EASYSLIP_API_KEY = process.env.EASYSLIP_API_KEY || "";

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
  isDuplicate?: boolean;
};

// ==========================================
// Verify slip by image URL
// ==========================================

export async function verifySlipByUrl(imageUrl: string): Promise<SlipVerifyResult> {
  if (!EASYSLIP_API_KEY) {
    return { success: false, error: "EasySlip API key not configured" };
  }

  const res = await fetch(`${EASYSLIP_API_URL}/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EASYSLIP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: imageUrl }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[easyslip] verify failed:", res.status, body);
    return { success: false, error: "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่" };
  }

  const data = await res.json();

  if (data.status !== 200 && data.status !== "success") {
    return { success: false, error: data.message || "Verification failed" };
  }

  return {
    success: true,
    data: {
      transRef: data.data?.transRef || "",
      date: data.data?.date || "",
      amount: parseFloat(data.data?.amount?.amount || "0"),
      sender: {
        name: data.data?.sender?.displayName || "",
        bank: data.data?.sender?.bank?.short || "",
        account: data.data?.sender?.account?.value || "",
      },
      receiver: {
        name: data.data?.receiver?.displayName || "",
        bank: data.data?.receiver?.bank?.short || "",
        account: data.data?.receiver?.account?.value || "",
      },
    },
  };
}

// ==========================================
// Verify slip by base64 image data
// ==========================================

export async function verifySlipByBase64(base64Image: string): Promise<SlipVerifyResult> {
  if (!EASYSLIP_API_KEY) {
    return { success: false, error: "EasySlip API key not configured" };
  }

  const res = await fetch(`${EASYSLIP_API_URL}/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EASYSLIP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: base64Image }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[easyslip] verify failed:", res.status, body);
    return { success: false, error: "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่" };
  }

  const data = await res.json();

  if (data.status !== 200 && data.status !== "success") {
    return { success: false, error: data.message || "Verification failed" };
  }

  return {
    success: true,
    data: {
      transRef: data.data?.transRef || "",
      date: data.data?.date || "",
      amount: parseFloat(data.data?.amount?.amount || "0"),
      sender: {
        name: data.data?.sender?.displayName || "",
        bank: data.data?.sender?.bank?.short || "",
        account: data.data?.sender?.account?.value || "",
      },
      receiver: {
        name: data.data?.receiver?.displayName || "",
        bank: data.data?.receiver?.bank?.short || "",
        account: data.data?.receiver?.account?.value || "",
      },
    },
  };
}

// ==========================================
// Get API quota info
// ==========================================

export async function getQuota(): Promise<{ used: number; total: number; remaining: number } | null> {
  if (!EASYSLIP_API_KEY) return null;

  const res = await fetch(`${EASYSLIP_API_URL}/me`, {
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
