import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);

    const [userData, recentMessages, recentTopups] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { notificationsReadAt: true },
      }),
      prisma.message.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, recipient: true, status: true, createdAt: true, content: true },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id, status: "verified" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, amount: true, createdAt: true },
      }),
    ]);

    const readAt = userData?.notificationsReadAt ?? null;

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
      ...recentTopups.map((t) => ({
        id: `txn_${t.id}`,
        type: "topup",
        message: `ซื้อ package สำเร็จ (฿${(t.amount / 100).toLocaleString()})`,
        createdAt: t.createdAt.toISOString(),
        read: readAt ? t.createdAt <= readAt : false,
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
