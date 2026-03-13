/**
 * SlipOK API — Payment Slip Verification
 * Endpoint: POST https://api.slipok.com/api/line/apikey/{BRANCH_ID}
 * Auth: x-authorization header
 *
 * Built-in checks:
 * - Error 1012: Duplicate slip
 * - Error 1013: Amount mismatch
 * - Error 1014: Receiver mismatch
 */

const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID || "";
const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY || "";

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
  isDuplicate?: boolean;
};

type SlipOKSuccessData = {
  transRef?: string;
  transDate?: string;
  transTime?: string;
  sender?: {
    displayName?: string;
    name?: string;
    proxy?: { value?: string };
    account?: { value?: string };
    bank?: { short?: string; name?: string };
  };
  receiver?: {
    displayName?: string;
    name?: string;
    proxy?: { value?: string };
    account?: { value?: string };
    bank?: { short?: string; name?: string };
  };
  amount?: number | string;
  ref1?: string;
  ref2?: string;
  ref3?: string;
};

type SlipOKResponse = {
  success?: boolean;
  code?: string | number;
  message?: string;
  data?: SlipOKSuccessData;
};

function parseAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const ERROR_MAP: Record<string, { error: string; isDuplicate?: boolean }> = {
  "1012": { error: "สลิปนี้ถูกใช้แล้ว", isDuplicate: true },
  "1013": { error: "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ" },
  "1014": { error: "บัญชีผู้รับเงินไม่ตรงกับที่ลงทะเบียนไว้" },
};

/**
 * Verify a payment slip image via SlipOK API.
 * Sends the file as multipart/form-data.
 * Optionally sends `amount` for server-side amount validation (error 1013).
 */
export type FileLike = {
  name?: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export async function verifySlip(
  file: File | Blob | FileLike,
  options?: { amount?: number },
): Promise<SlipVerifyResult> {
  if (!SLIPOK_BRANCH_ID || !SLIPOK_API_KEY) {
    return { success: false, error: "SlipOK API not configured" };
  }

  const formData = new FormData();
  // Convert FileLike to Blob if needed (FormData.append requires Blob/File)
  const blob =
    file instanceof Blob
      ? file
      : new Blob([await file.arrayBuffer()], { type: file.type });
  formData.append("files", blob, (file as { name?: string }).name ?? "slip.png");
  if (options?.amount != null) {
    formData.append("amount", String(options.amount));
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
      {
        method: "POST",
        headers: { "x-authorization": SLIPOK_API_KEY },
        body: formData,
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch (error) {
    console.error("[slipok] verify request failed:", error);
    return { success: false, error: "SlipOK unavailable" };
  }

  let payload: SlipOKResponse;
  try {
    payload = (await res.json()) as SlipOKResponse;
  } catch {
    console.error("[slipok] invalid JSON response, status:", res.status);
    return {
      success: false,
      error: "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่",
      providerCode: "invalid_response",
    };
  }

  const code = String(payload.code ?? "");

  // Check known error codes
  const knownError = ERROR_MAP[code];
  if (knownError) {
    return {
      success: false,
      error: knownError.error,
      providerCode: code,
      isDuplicate: knownError.isDuplicate ?? false,
    };
  }

  // Non-200 or explicit failure
  if (!res.ok || payload.success === false) {
    const errorMsg =
      payload.message || "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่";
    console.error("[slipok] verify failed:", res.status, code, errorMsg);
    return {
      success: false,
      error: errorMsg,
      providerCode: code || undefined,
    };
  }

  // Success — extract data
  const d = payload.data;
  if (!d) {
    return {
      success: false,
      error: "SlipOK response missing data",
      providerCode: "no_data",
    };
  }

  const transRef = str(d.transRef);
  if (!transRef) {
    return {
      success: false,
      error: "SlipOK response missing transRef",
      providerCode: "no_trans_ref",
    };
  }

  const amount = parseAmount(d.amount);
  if (amount <= 0) {
    return {
      success: false,
      error: "SlipOK response amount must be greater than 0",
      providerCode: "invalid_amount",
    };
  }

  const date =
    str(d.transDate) + (d.transTime ? ` ${str(d.transTime)}` : "");

  return {
    success: true,
    isDuplicate: false,
    data: {
      transRef,
      date: date || new Date().toISOString(),
      amount,
      sender: {
        name: str(d.sender?.displayName) || str(d.sender?.name),
        bank: str(d.sender?.bank?.short) || str(d.sender?.bank?.name),
        account:
          str(d.sender?.account?.value) || str(d.sender?.proxy?.value),
      },
      receiver: {
        name: str(d.receiver?.displayName) || str(d.receiver?.name),
        bank: str(d.receiver?.bank?.short) || str(d.receiver?.bank?.name),
        account:
          str(d.receiver?.account?.value) ||
          str(d.receiver?.proxy?.value),
      },
    },
  };
}
