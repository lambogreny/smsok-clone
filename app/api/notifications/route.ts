import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);

    const recentMessages = await prisma.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, recipient: true, status: true, createdAt: true, content: true },
    });

    const [userDataResult, recentPackagePurchasesResult] = await Promise.allSettled([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { notificationsReadAt: true },
      }),
      prisma.payment.findMany({
        where: { userId: user.id, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          packageTier: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const readAt =
      userDataResult.status === "fulfilled"
        ? userDataResult.value?.notificationsReadAt ?? null
        : null;
    const recentPackagePurchases =
      recentPackagePurchasesResult.status === "fulfilled"
        ? recentPackagePurchasesResult.value
        : [];

    const items = [
      ...recentMessages.map((m) => ({
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
        message: `ซื้อแพ็กเกจ SMS${purchase.packageTier?.name ? ` ${purchase.packageTier.name}` : ""} สำเร็จ (฿${((purchase.totalAmount ?? 0) / 100).toLocaleString()})`,
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
