import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma as db } from "@/lib/db";
import {
  activateOrderPurchase,
  ensureOrderDocument,
  orderSummarySelect,
} from "@/lib/orders/api";
import { createOrderHistory } from "@/lib/orders/service";
import { type SlipVerifyResult, verifySlipByUrl } from "@/lib/easyslip";
import { extractStoredFileKey } from "@/lib/storage/files";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const SYSTEM_VERIFIER = "slip-worker";

export const SLIP_QUEUED_STATUS_NOTE = "เราได้รับสลิปแล้ว กำลังตรวจสอบรายการชำระเงิน";
export const SLIP_QUEUED_REVIEW_NOTE = "Slip queued for automatic verification";
export const SLIP_RETRY_EXHAUSTED_NOTE = "ระบบตรวจสอบสลิปอัตโนมัติไม่สำเร็จ กรุณารอเจ้าหน้าที่ตรวจสลิป";
const SLIP_VERIFY_TIMEOUT_MS = 30_000;

type QueuedOrderRecord = {
  id: string;
  userId: string;
  organizationId: string | null;
  packageTierId: string;
  smsCount: number;
  customerType: "INDIVIDUAL" | "COMPANY";
  status: OrderStatus;
  orderNumber: string;
  packageName: string;
  taxName: string;
  taxId: string;
  taxAddress: string;
  taxBranchType: "HEAD" | "BRANCH";
  taxBranchNumber: string | null;
  netAmount: { toNumber(): number } | number;
  vatAmount: { toNumber(): number } | number;
  totalAmount: { toNumber(): number } | number;
  hasWht: boolean;
  whtAmount: { toNumber(): number } | number;
  payAmount: { toNumber(): number } | number;
  expiresAt: Date;
  quotationNumber: string | null;
  quotationUrl: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  slipUrl: string | null;
  whtCertUrl: string | null;
  easyslipVerified: boolean | null;
  rejectReason: string | null;
  adminNote: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  completedAt: Date | null;
  slipFileName: string | null;
  slipFileSize: number | null;
  whtCertVerified: boolean | null;
  easyslipResponse: Prisma.JsonValue | null;
  slip: {
    id: string;
    fileUrl: string;
    fileKey: string;
    fileSize: number | null;
    fileType: string | null;
    uploadedAt: Date;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    deletedAt: Date | null;
  } | null;
};

export class SlipVerificationRetryableError extends Error {
  constructor(message = "Slip verification retry required") {
    super(message);
  }
}

type CurrentQueuedSlipTarget =
  | { isCurrent: true; fromStatus: OrderStatus }
  | { isCurrent: false; note: string };

function getPendingReviewMessage(verification: SlipVerifyResult) {
  if (verification.providerCode === "application_expired") {
    return "ระบบตรวจสอบสลิปอัตโนมัติไม่พร้อม กรุณารอเจ้าหน้าที่ตรวจสลิป";
  }

  return "กำลังรอเจ้าหน้าที่ตรวจสลิป";
}

function shouldQueueForManualReview(verification: SlipVerifyResult) {
  if (verification.success || verification.isDuplicate) return false;

  const providerCode = verification.providerCode?.trim();
  return providerCode !== "1013" && providerCode !== "1014";
}

function getManualReviewNote(verification: SlipVerifyResult) {
  return `EasySlip: ${verification.error ?? verification.providerCode ?? "manual review required"}`;
}

function getDeterministicFailureMessage(verification: SlipVerifyResult) {
  if (verification.isDuplicate) {
    return "สลิปนี้ถูกใช้แล้ว";
  }

  if (verification.providerCode === "1013") {
    return "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ";
  }

  if (verification.providerCode === "1014") {
    return "บัญชีปลายทางในสลิปไม่ตรงกับบัญชีบริษัท";
  }

  return verification.error ?? "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่";
}

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new SlipVerificationRetryableError(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function getCurrentQueuedSlipTarget(
  tx: Prisma.TransactionClient,
  orderId: string,
  orderSlipId: string,
): Promise<CurrentQueuedSlipTarget> {
  const currentOrder = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      slips: {
        where: { deletedAt: null },
        orderBy: [{ uploadedAt: "desc" }, { id: "desc" }],
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!currentOrder) {
    return {
      isCurrent: false,
      note: "Order no longer available",
    };
  }

  if (currentOrder.status !== "VERIFYING") {
    return {
      isCurrent: false,
      note: `Order is already ${currentOrder.status}`,
    };
  }

  if (currentOrder.slips[0]?.id !== orderSlipId) {
    return {
      isCurrent: false,
      note: "Slip job is stale",
    };
  }

  return {
    isCurrent: true,
    fromStatus: currentOrder.status,
  };
}

async function getQueuedOrder(orderId: string, orderSlipId: string): Promise<QueuedOrderRecord | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      ...orderSummarySelect,
      userId: true,
      organizationId: true,
      packageTierId: true,
      smsCount: true,
      slipFileName: true,
      slipFileSize: true,
      whtCertVerified: true,
      easyslipResponse: true,
      completedAt: true,
      slips: {
        where: { id: orderSlipId },
        select: {
          id: true,
          fileUrl: true,
          fileKey: true,
          fileSize: true,
          fileType: true,
          uploadedAt: true,
          verifiedAt: true,
          verifiedBy: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    ...order,
    slip: order.slips[0] ?? null,
  };
}

async function moveOrderToManualReview(
  order: QueuedOrderRecord,
  verification: SlipVerifyResult,
  note: string,
) {
  if (!order.slip) {
    return {
      status: "ignored" as const,
      note: "Slip record no longer available",
    };
  }

  const pendingReviewMessage = getPendingReviewMessage(verification);

  return db.$transaction(async (tx) => {
    const currentTarget = await getCurrentQueuedSlipTarget(tx, order.id, order.slip!.id);
    if (!currentTarget.isCurrent) {
      return {
        status: "ignored" as const,
        note: currentTarget.note,
      };
    }

    const updatedOrder = await tx.order.updateMany({
      where: { id: order.id, status: "VERIFYING" },
      data: {
        status: "VERIFYING",
        easyslipVerified: false,
        easyslipResponse: verification as unknown as Prisma.InputJsonValue,
        adminNote: pendingReviewMessage,
        rejectReason: null,
        paidAt: null,
        completedAt: null,
      },
    });

    if (updatedOrder.count !== 1) {
      return {
        status: "ignored" as const,
        note: "Order is no longer VERIFYING",
      };
    }

    await createOrderHistory(tx, order.id, "VERIFYING", {
      fromStatus: currentTarget.fromStatus,
      changedBy: SYSTEM_VERIFIER,
      note,
    });

    return {
      status: "manual_review" as const,
      note: pendingReviewMessage,
    };
  });
}

async function rejectQueuedOrderSlip(
  order: QueuedOrderRecord,
  verificationPayload: Prisma.JsonValue | null,
  message: string,
) {
  if (!order.slip) {
    return {
      status: "ignored" as const,
      note: "Slip record no longer available",
    };
  }

  return db.$transaction(async (tx) => {
    const currentTarget = await getCurrentQueuedSlipTarget(tx, order.id, order.slip!.id);
    if (!currentTarget.isCurrent) {
      return {
        status: "ignored" as const,
        note: currentTarget.note,
      };
    }

    const updatedOrder = await tx.order.updateMany({
      where: { id: order.id, status: "VERIFYING" },
      data: {
        status: "PENDING_PAYMENT",
        easyslipVerified: false,
        easyslipResponse: verificationPayload ? (verificationPayload as Prisma.InputJsonValue) : Prisma.JsonNull,
        adminNote: null,
        rejectReason: message,
        paidAt: null,
        completedAt: null,
      },
    });

    if (updatedOrder.count !== 1) {
      return {
        status: "ignored" as const,
        note: "Order is no longer VERIFYING",
      };
    }

    await createOrderHistory(tx, order.id, "PENDING_PAYMENT", {
      fromStatus: currentTarget.fromStatus,
      changedBy: SYSTEM_VERIFIER,
      note: message,
    });

    return {
      status: "rejected" as const,
      note: message,
    };
  });
}

async function approveQueuedOrderSlip(
  order: QueuedOrderRecord,
  verificationData: NonNullable<SlipVerifyResult["data"]>,
  amountDifference: number,
) {
  const duplicateSlip = await db.orderSlip.findFirst({
    where: {
      transRef: verificationData.transRef,
      NOT: { id: order.slip?.id },
    },
    select: { id: true },
  });

  if (duplicateSlip) {
    return rejectQueuedOrderSlip(
      order,
      verificationData as unknown as Prisma.JsonValue,
      "สลิปนี้ถูกใช้แล้ว",
    );
  }

  const approvalNote = amountDifference > 0
    ? "EasySlip verified — order paid automatically within ±1 THB tolerance"
    : "EasySlip verified — order paid automatically";

  return db.$transaction(async (tx) => {
    if (!order.slip) {
      return {
        status: "ignored" as const,
        note: "Slip record no longer available",
      };
    }

    const currentTarget = await getCurrentQueuedSlipTarget(tx, order.id, order.slip.id);
    if (!currentTarget.isCurrent) {
      return {
        status: "ignored" as const,
        note: currentTarget.note,
      };
    }

    const updatedOrder = await tx.order.updateMany({
      where: { id: order.id, status: "VERIFYING" },
      data: {
        status: "PAID",
        easyslipVerified: true,
        easyslipResponse: verificationData as unknown as Prisma.InputJsonValue,
        adminNote: null,
        rejectReason: null,
        paidAt: new Date(),
        completedAt: new Date(),
      },
    });

    if (updatedOrder.count !== 1) {
      return {
        status: "ignored" as const,
        note: "Order is no longer VERIFYING",
      };
    }

    await tx.orderSlip.update({
      where: { id: order.slip.id },
      data: {
        transRef: verificationData.transRef,
        verifiedAt: new Date(),
        verifiedBy: SYSTEM_VERIFIER,
      },
    });

    await activateOrderPurchase(tx, {
      id: order.id,
      userId: order.userId,
      organizationId: order.organizationId,
      packageTierId: order.packageTierId,
      smsCount: order.smsCount,
    });
    if (order.customerType === "COMPANY") {
      await ensureOrderDocument(tx, order, "TAX_INVOICE");
    }
    await ensureOrderDocument(tx, order, "RECEIPT");

    await createOrderHistory(tx, order.id, "PAID", {
      fromStatus: currentTarget.fromStatus,
      changedBy: SYSTEM_VERIFIER,
      note: approvalNote,
    });

    return {
      status: "approved" as const,
      note: approvalNote,
    };
  });
}

export async function processQueuedOrderSlipVerification(input: {
  orderId: string;
  orderSlipId: string;
}) {
  const order = await getQueuedOrder(input.orderId, input.orderSlipId);

  if (!order?.slip || order.slip.deletedAt) {
    return {
      status: "ignored" as const,
      note: "Slip record no longer available",
    };
  }

  if (order.status !== "VERIFYING") {
    return {
      status: "ignored" as const,
      note: `Order is already ${order.status}`,
    };
  }

  const fileKey = extractStoredFileKey(order.slip.fileUrl);
  if (!fileKey) {
    throw new SlipVerificationRetryableError("Unable to extract R2 key from stored slip URL");
  }

  if (!R2_PUBLIC_URL) {
    throw new SlipVerificationRetryableError("R2_PUBLIC_URL not configured");
  }

  const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;

  const verification = await withTimeout(
    verifySlipByUrl(publicUrl),
    SLIP_VERIFY_TIMEOUT_MS,
    "EasySlip verification timed out",
  ).catch((error) => {
    console.error("[Slip Worker] EasySlip request failed:", error);
    if (error instanceof SlipVerificationRetryableError) {
      throw error;
    }
    throw new SlipVerificationRetryableError("EasySlip verification request failed");
  });

  if (verification.isDuplicate) {
    return rejectQueuedOrderSlip(
      order,
      verification as unknown as Prisma.JsonValue,
      getDeterministicFailureMessage(verification),
    );
  }

  if (shouldQueueForManualReview(verification)) {
    return moveOrderToManualReview(order, verification, getManualReviewNote(verification));
  }

  if (!verification.success) {
    return rejectQueuedOrderSlip(
      order,
      verification as unknown as Prisma.JsonValue,
      getDeterministicFailureMessage(verification),
    );
  }

  if (!verification.data) {
    throw new SlipVerificationRetryableError("EasySlip success response missing verification data");
  }

  const amountDifference = Math.abs(verification.data.amount - toNumber(order.payAmount));
  if (amountDifference > 1) {
    return rejectQueuedOrderSlip(
      order,
      verification.data as unknown as Prisma.JsonValue,
      "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ",
    );
  }

  return approveQueuedOrderSlip(order, verification.data, amountDifference);
}

export async function markQueuedOrderForManualReview(input: {
  orderId: string;
  orderSlipId: string;
  errorMessage: string;
}) {
  const order = await getQueuedOrder(input.orderId, input.orderSlipId);
  if (!order?.slip || order.status === "PAID" || order.status === "CANCELLED" || order.status === "EXPIRED") {
    return;
  }

  await db.$transaction(async (tx) => {
    const currentTarget = await getCurrentQueuedSlipTarget(tx, order.id, order.slip!.id);
    if (!currentTarget.isCurrent) {
      return;
    }

    const updatedOrder = await tx.order.updateMany({
      where: { id: order.id, status: "VERIFYING" },
      data: {
        status: "VERIFYING",
        adminNote: SLIP_RETRY_EXHAUSTED_NOTE,
        rejectReason: null,
        paidAt: null,
        completedAt: null,
      },
    });

    if (updatedOrder.count !== 1) {
      return;
    }

    await createOrderHistory(tx, order.id, "VERIFYING", {
      fromStatus: currentTarget.fromStatus,
      changedBy: SYSTEM_VERIFIER,
      note: input.errorMessage,
    });
  });
}
