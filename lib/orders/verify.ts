import { createHash } from "node:crypto";
import { prisma as db } from "@/lib/db";
import { ApiError } from "@/lib/api-auth";
import { logger as log } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { getClientIp } from "@/lib/session-utils";

const ORDER_DOCUMENT_LABELS = {
  invoice: "ใบแจ้งหนี้",
  tax_invoice: "ใบกำกับภาษี",
  receipt: "ใบเสร็จรับเงิน",
  credit_note: "ใบลดหนี้",
} as const;

const ORDER_DOCUMENT_PATHS = {
  invoice: "invoice",
  tax_invoice: "tax-invoice",
  receipt: "receipt",
  credit_note: "credit-note",
} as const;

const DB_TO_API_DOCUMENT_TYPE = {
  INVOICE: "invoice",
  TAX_INVOICE: "tax_invoice",
  RECEIPT: "receipt",
  CREDIT_NOTE: "credit_note",
} as const;

type ApiDocumentType = keyof typeof ORDER_DOCUMENT_LABELS;

const PUBLIC_VERIFY_RATE_LIMIT_MAX = 10;
const PUBLIC_VERIFY_RATE_LIMIT_WINDOW_SECONDS = 60;

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function buildPublicVerifyRateLimitKey(requestHeaders: Headers) {
  const clientIp = getClientIp(requestHeaders).trim().toLowerCase() || "unknown";
  const hashedIp = createHash("sha256").update(clientIp).digest("hex");
  return `rate:public-document-verify:${hashedIp}`;
}

export function formatPublicOrderDocumentVerificationRateLimitMessage(retryAfter: number) {
  return `ตรวจสอบเอกสารได้สูงสุด ${PUBLIC_VERIFY_RATE_LIMIT_MAX} ครั้งต่อนาที กรุณาลองใหม่ใน ${retryAfter} วินาที`;
}

export async function checkPublicOrderDocumentVerificationRateLimit(requestHeaders: Headers) {
  const key = buildPublicVerifyRateLimitKey(requestHeaders);

  try {
    const attemptCount = await redis.incr(key);
    if (attemptCount === 1) {
      await redis.expire(key, PUBLIC_VERIFY_RATE_LIMIT_WINDOW_SECONDS);
    }

    const retryAfter = Math.max(await redis.ttl(key), 1);

    return {
      limited: attemptCount > PUBLIC_VERIFY_RATE_LIMIT_MAX,
      retryAfter,
    };
  } catch (error) {
    log.warn(
      "Public document verification rate limit unavailable",
      { error: error instanceof Error ? error.message : String(error) },
    );

    return {
      limited: false,
      retryAfter: 0,
    };
  }
}

export async function enforcePublicOrderDocumentVerificationRateLimit(requestHeaders: Headers) {
  const rateLimit = await checkPublicOrderDocumentVerificationRateLimit(requestHeaders);

  if (rateLimit.limited) {
    throw new ApiError(
      429,
      formatPublicOrderDocumentVerificationRateLimitMessage(rateLimit.retryAfter),
    );
  }
}

export async function getPublicOrderDocumentVerification(code: string) {
  const document = await db.orderDocument.findUnique({
    where: { verificationCode: code },
    select: {
      id: true,
      type: true,
      documentNumber: true,
      verificationCode: true,
      issuedAt: true,
      voidedAt: true,
      voidReason: true,
      deletedAt: true,
      pdfUrl: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          packageName: true,
          taxName: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!document) {
    return null;
  }

  const apiType = DB_TO_API_DOCUMENT_TYPE[document.type] as ApiDocumentType;
  const status = document.deletedAt
    ? "deleted"
    : document.voidedAt
      ? "voided"
      : "valid";

  return {
    code: document.documentNumber,
    valid: status === "valid",
    status,
    type: apiType,
    label: ORDER_DOCUMENT_LABELS[apiType],
    issued_at: document.issuedAt.toISOString(),
    voided_at: document.voidedAt?.toISOString() ?? null,
    void_reason: document.voidReason ?? null,
    order: {
      id: document.order.id,
      order_number: document.order.orderNumber,
      package_name: document.order.packageName,
      customer_name: document.order.taxName,
      total_amount: toNumber(document.order.totalAmount),
      created_at: document.order.createdAt.toISOString(),
    },
    document_url:
      document.pdfUrl ||
      `/api/v1/orders/${document.order.id}/documents/${ORDER_DOCUMENT_PATHS[apiType]}`,
  };
}
