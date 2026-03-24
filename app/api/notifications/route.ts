import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  getPaymentTableColumns,
  prunePaymentSelectForAvailableColumns,
} from "@/lib/payments/db-compat";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);
    const fallbackPaymentSelect = {
      id: true,
      amount: true,
      createdAt: true,
      packageTier: {
        select: {
          name: true,
        },
      },
    };
    let paymentSelect: Record<string, unknown> = fallbackPaymentSelect;

    try {
      const paymentColumns = await getPaymentTableColumns() as Set<string>;
      paymentSelect = prunePaymentSelectForAvailableColumns({
        ...fallbackPaymentSelect,
        totalAmount: true,
      }, paymentColumns as Set<string>);
    } catch (error) {
      logger.warn("Notifications route falling back to basic payment select", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const [recentMessagesResult, userDataResult, recentPackagePurchasesResult] = await Promise.allSettled([
      prisma.message.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, recipient: true, status: true, createdAt: true, content: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { notificationsReadAt: true },
      }),
      prisma.payment.findMany({
        where: { userId: user.id, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: paymentSelect,
      }) as Promise<Array<Record<string, any>>>,
    ]);

    const recentMessages =
      recentMessagesResult.status === "fulfilled"
        ? recentMessagesResult.value
        : [];
    const readAt =
      userDataResult.status === "fulfilled"
        ? userDataResult.value?.notificationsReadAt ?? null
        : null;
    const recentPackagePurchases =
      recentPackagePurchasesResult.status === "fulfilled"
        ? recentPackagePurchasesResult.value
        : [];

    if (recentMessagesResult.status === "rejected") {
      logger.warn("Notifications route failed to load recent messages", {
        userId: user.id,
        error: recentMessagesResult.reason instanceof Error
          ? recentMessagesResult.reason.message
          : String(recentMessagesResult.reason),
      });
    }

    if (userDataResult.status === "rejected") {
      logger.warn("Notifications route failed to load notification read marker", {
        userId: user.id,
        error: userDataResult.reason instanceof Error
          ? userDataResult.reason.message
          : String(userDataResult.reason),
      });
    }

    if (recentPackagePurchasesResult.status === "rejected") {
      logger.warn("Notifications route failed to load package purchases", {
        userId: user.id,
        error: recentPackagePurchasesResult.reason instanceof Error
          ? recentPackagePurchasesResult.reason.message
          : String(recentPackagePurchasesResult.reason),
      });
    }

    const items = [
      ...recentMessages.map((m: (typeof recentMessages)[number]) => ({
        id: `msg_${m.id}`,
        type: m.status === "sent" || m.status === "delivered" ? "sms_success" : m.status === "failed" ? "sms_failed" : "sms_pending",
        message:
          m.status === "sent" || m.status === "delivered"
            ? `ส่ง SMS ถึง ${m.recipient} สำเร็จ`
            : m.status === "failed"
            ? `ส่ง SMS ถึง ${m.recipient} ล้มเหลว`
            : `กำลังส่ง SMS ถึง ${m.recipient}`,
        createdAt: m.createdAt.toISOString(),
        read: readAt ? m.createdAt <= readAt : false,
      })),
      ...recentPackagePurchases.map((purchase) => ({
        id: `payment_${purchase.id}`,
        type: "package_purchase",
        message: `ซื้อแพ็กเกจ SMS${purchase.packageTier?.name ? ` ${purchase.packageTier.name}` : ""} สำเร็จ (฿${(((purchase.totalAmount ?? purchase.amount) ?? 0) / 100).toLocaleString()})`,
        createdAt: purchase.createdAt.toISOString(),
        read: readAt ? purchase.createdAt <= readAt : false,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const unreadCount = items.filter((i) => !readAt || new Date(i.createdAt) > readAt).length;

    return apiResponse({ items, unreadCount });
  } catch (e) {
    return apiError(e);
  }
}
