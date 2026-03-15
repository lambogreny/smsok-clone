
import { prisma as db } from "../db";
import { ApiError } from "../api-auth";
import { z } from "zod";

// ── Schemas ────────────────────────────────────────────

const createConsentSchema = z.object({
  contactId: z.string().min(1),
  purpose: z.enum(["MARKETING", "TRANSACTIONAL", "UPDATES", "OTP"]),
  granted: z.boolean(),
  source: z.string().min(1).max(50), // "form", "api", "import", "sms"
  evidence: z.string().optional(),
});

const optOutSchema = z.object({
  phone: z.string().min(10).max(15),
  method: z.string().min(1), // "sms_reply", "link", "manual", "api"
  keyword: z.string().optional(),
});

const dataRequestSchema = z.object({
  type: z.enum(["ACCESS", "DELETE", "PORTABILITY", "OBJECT"]),
  requestorEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  requestorPhone: z.string().optional(),
  contactId: z.string().optional(),
});

const processDataRequestSchema = z.object({
  status: z.enum(["PROCESSING", "COMPLETED", "REJECTED"]),
  notes: z.string().optional(),
});

// ── Consent Management ─────────────────────────────────

export async function recordConsent(
  userId: string,
  orgId: string | null,
  data: unknown,
  ipAddress?: string
) {
  const parsed = createConsentSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง", "VALIDATION");
  }

  // Verify contact belongs to user
  const contact = await db.contact.findFirst({
    where: { id: parsed.data.contactId, userId },
  });
  if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ", "NOT_FOUND");

  // If revoking, also mark the timestamp
  const now = new Date();

  return db.consent.create({
    data: {
      organizationId: orgId,
      contactId: parsed.data.contactId,
      purpose: parsed.data.purpose,
      granted: parsed.data.granted,
      source: parsed.data.source,
      evidence: parsed.data.evidence,
      ipAddress,
      grantedAt: parsed.data.granted ? now : undefined,
      revokedAt: !parsed.data.granted ? now : undefined,
    },
  });
}

export async function getContactConsents(userId: string, contactId: string) {
  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ", "NOT_FOUND");

  return db.consent.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getConsentStatus(userId: string, contactId: string) {
  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ", "NOT_FOUND");

  // Get latest consent per purpose
  const consents = await db.consent.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
  });

  // Reduce to latest per purpose
  const statusMap: Record<string, { granted: boolean; updatedAt: Date }> = {};
  for (const c of consents) {
    if (!statusMap[c.purpose]) {
      statusMap[c.purpose] = {
        granted: c.granted,
        updatedAt: c.createdAt,
      };
    }
  }

  return statusMap;
}

// ── Opt-Out ────────────────────────────────────────────

export async function processOptOut(
  userId: string,
  orgId: string | null,
  data: unknown
) {
  const parsed = optOutSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง", "VALIDATION");
  }

  const now = new Date();

  // Find contact by phone
  const contact = await db.contact.findFirst({
    where: { userId, phone: parsed.data.phone },
    select: { id: true },
  });

  await db.$transaction([
    // Log the opt-out (append-only)
    db.optOutLog.create({
      data: {
        organizationId: orgId,
        contactId: contact?.id,
        phone: parsed.data.phone,
        method: parsed.data.method,
        keyword: parsed.data.keyword,
        processedAt: now,
      },
    }),
    // Update contact consent status if found
    ...(contact
      ? [
          db.contact.update({
            where: { id: contact.id },
            data: {
              consentStatus: "OPTED_OUT",
              smsConsent: false,
              optOutAt: now,
              optOutReason: parsed.data.method,
            },
          }),
          // Revoke all marketing consents
          db.consent.create({
            data: {
              organizationId: orgId,
              contactId: contact.id,
              purpose: "MARKETING",
              granted: false,
              source: parsed.data.method,
              revokedAt: now,
            },
          }),
        ]
      : []),
  ]);

  return { processed: true, phone: parsed.data.phone };
}

export async function getOptOutLogs(
  userId: string,
  orgId: string | null,
  page = 1,
  limit = 50
) {
  const where = orgId ? { organizationId: orgId } : {};
  const [logs, total] = await Promise.all([
    db.optOutLog.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.optOutLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Data Subject Rights (PDPA) ─────────────────────────

export async function createDataRequest(
  orgId: string | null,
  data: unknown
) {
  const parsed = dataRequestSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง", "VALIDATION");
  }

  // PDPA: must process within 30 days
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return db.dataRequest.create({
    data: {
      organizationId: orgId,
      contactId: parsed.data.contactId,
      type: parsed.data.type,
      requestorEmail: parsed.data.requestorEmail,
      requestorPhone: parsed.data.requestorPhone,
      dueDate,
    },
  });
}

const SELF_SERVICE_TYPES = ["PORTABILITY", "DELETE"] as const;
const ACTIVE_SELF_SERVICE_STATUSES = ["PENDING", "PROCESSING"] as const;

type SelfServiceDataRequestType = typeof SELF_SERVICE_TYPES[number];

async function getSelfServiceRequester(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new ApiError(404, "ไม่พบบัญชีผู้ใช้งาน", "NOT_FOUND");
  }

  return user;
}

function buildRequestDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  return dueDate;
}

export async function listSelfServiceDataRequests(
  userId: string,
  orgId: string | null,
  types: SelfServiceDataRequestType[],
) {
  const user = await getSelfServiceRequester(userId);

  return db.dataRequest.findMany({
    where: {
      organizationId: orgId ?? null,
      requestorEmail: user.email,
      type: { in: types },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function submitSelfServiceDataRequest(
  userId: string,
  orgId: string | null,
  type: SelfServiceDataRequestType,
) {
  const user = await getSelfServiceRequester(userId);

  const existing = await db.dataRequest.findFirst({
    where: {
      organizationId: orgId ?? null,
      requestorEmail: user.email,
      type,
      status: { in: [...ACTIVE_SELF_SERVICE_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return {
      created: false,
      request: existing,
    };
  }

  const request = await db.dataRequest.create({
    data: {
      organizationId: orgId,
      type,
      requestorEmail: user.email,
      requestorPhone: user.phone,
      dueDate: buildRequestDueDate(),
    },
  });

  return {
    created: true,
    request,
  };
}

export async function getDataRequests(
  userId: string,
  orgId: string | null,
  status?: string,
  page = 1,
  limit = 20
) {
  // Scope to user's org — resolve from membership if no orgId provided
  let scopedOrgId = orgId;
  if (!scopedOrgId) {
    const membership = await db.membership.findFirst({
      where: { userId },
      select: { organizationId: true },
      orderBy: { createdAt: "desc" },
    });
    if (membership) scopedOrgId = membership.organizationId;
  }

  const where: Record<string, unknown> = {};
  if (scopedOrgId) where.organizationId = scopedOrgId;
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    db.dataRequest.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.dataRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function processDataRequest(
  userId: string,
  requestId: string,
  data: unknown
) {
  const parsed = processDataRequestSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง", "VALIDATION");
  }

  const request = await db.dataRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new ApiError(404, "ไม่พบคำขอ", "NOT_FOUND");

  // IDOR guard: verify user belongs to the same org as the data request
  if (request.organizationId) {
    const membership = await db.membership.findFirst({
      where: { userId, organizationId: request.organizationId },
      select: { id: true },
    });
    if (!membership) throw new ApiError(403, "ไม่มีสิทธิ์ดำเนินการคำขอนี้", "FORBIDDEN");
  }

  if (request.status === "COMPLETED") throw new ApiError(400, "คำขอนี้ดำเนินการเสร็จแล้ว", "ALREADY_COMPLETED");

  const updateData: Record<string, unknown> = {
    status: parsed.data.status,
    processedBy: userId,
    notes: parsed.data.notes,
  };

  if (parsed.data.status === "COMPLETED") {
    updateData.completedAt = new Date();

    // If DELETE request, handle data erasure
    if (request.type === "DELETE" && request.contactId) {
      await db.contact.update({
        where: { id: request.contactId },
        data: {
          name: "[ลบแล้ว]",
          email: null,
          phone: `deleted_${request.contactId}`,
          consentStatus: "OPTED_OUT",
          smsConsent: false,
          optOutAt: new Date(),
          optOutReason: "data_request_delete",
        },
      });
    }
  }

  return db.dataRequest.update({
    where: { id: requestId },
    data: updateData,
  });
}

// ── Sending Hours Check (PDPA) ─────────────────────────

export async function canSendMarketingSms(orgId: string | null): Promise<boolean> {
  if (!orgId) return true; // legacy single-user mode

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { sendingHoursStart: true, sendingHoursEnd: true },
  });
  if (!org) return false;

  const now = new Date();
  // Use Bangkok timezone
  const bangkokHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok", hour: "numeric", hour12: false })
  );

  return bangkokHour >= org.sendingHoursStart && bangkokHour < org.sendingHoursEnd;
}
