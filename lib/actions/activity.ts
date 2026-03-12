"use server";

import { prisma } from "@/lib/db";

export type ActivityItem = {
  type: "sms" | "otp" | "credit";
  id: string;
  timestamp: string;
  data: Record<string, unknown>;
};

export async function getContactActivity(
  userId: string,
  contactId: string,
  options: { page?: number; limit?: number; type?: string } = {}
) {
  // Verify ownership + get phone
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true, phone: true },
  });
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const typeFilter = options.type;

  const activities: ActivityItem[] = [];

  // Query relevant tables in parallel
  const [messages, otps] = await Promise.all([
    !typeFilter || typeFilter === "sms"
      ? prisma.message.findMany({
          where: { userId, recipient: contact.phone },
          select: {
            id: true,
            type: true,
            senderName: true,
            status: true,
            creditCost: true,
            sentAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : [],
    !typeFilter || typeFilter === "otp"
      ? prisma.otpRequest.findMany({
          where: { userId, phone: contact.phone },
          select: {
            id: true,
            purpose: true,
            verified: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [],
  ]);

  // Map to unified timeline
  for (const m of messages) {
    activities.push({
      type: "sms",
      id: m.id,
      timestamp: (m.sentAt ?? m.createdAt).toISOString(),
      data: {
        messageType: m.type,
        senderName: m.senderName,
        status: m.status,
        creditCost: m.creditCost,
      },
    });
  }

  for (const o of otps) {
    activities.push({
      type: "otp",
      id: o.id,
      timestamp: o.createdAt.toISOString(),
      data: {
        purpose: o.purpose,
        verified: o.verified,
        expiresAt: o.expiresAt.toISOString(),
      },
    });
  }

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Paginate
  const total = activities.length;
  const start = (page - 1) * limit;
  const paged = activities.slice(start, start + limit);

  return {
    activities: paged,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
