import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { getRemainingQuota } from "@/lib/package/quota";
import { validateSenderName } from "@/lib/sender-name-validation";
const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

const createSenderSchema = z.object({
  name: z.string().trim().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร"),
  type: z.enum(["general", "otp", "marketing"]).optional().default("general"),
  note: z.string().trim().max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร").optional().default(""),
});

const QUOTA_COUNT_STATUSES = [
  "PENDING",
  "REVIEWING",
  "SUBMITTED_TO_OPERATOR",
  "APPROVED",
  "ACTIVE",
] as const;

function normalizeLegacyStatus(status: string) {
  const normalized = status.toUpperCase();
  if (["APPROVED", "ACTIVE"].includes(normalized)) {
    return "APPROVED" as const;
  }
  if (["REJECTED", "SUSPENDED"].includes(normalized)) {
    return "REJECTED" as const;
  }
  return "PENDING" as const;
}

function normalizeSenderType(type: string | null | undefined) {
  const normalized = (type ?? "").trim().toLowerCase();
  if (normalized === "marketing") {
    return "marketing" as const;
  }
  if (normalized === "otp") {
    return "otp" as const;
  }
  return "general" as const;
}

function readJsonBody(req: NextRequest) {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(400, "Content-Type must be application/json");
  }
  return req.json().catch(() => {
    throw new ApiError(400, "Invalid JSON");
  });
}

// GET /api/v1/senders — customer sender-name list for dashboard page
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const query = listQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const senderNames = await db.senderName.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        senderType: true,
        adminNotes: true,
        rejectNote: true,
        createdAt: true,
        approvedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const smsCounts = await db.message.groupBy({
      by: ["senderName"],
      where: {
        userId: user.id,
        senderName: { in: senderNames.map((sender) => sender.name) },
      },
      _count: { _all: true },
    });
    const smsCountMap = new Map(
      smsCounts.map((row) => [row.senderName, row._count._all])
    );

    let senders = senderNames.map((sender) => ({
      id: sender.id,
      name: sender.name,
      type: normalizeSenderType(sender.senderType),
      status: normalizeLegacyStatus(sender.status),
      smsSent: smsCountMap.get(sender.name) ?? 0,
      createdAt: sender.createdAt,
      approvedAt: sender.approvedAt,
      rejectNote: sender.rejectNote,
      note: sender.adminNotes,
    }));

    if (query.search) {
      const q = query.search.toLowerCase();
      senders = senders.filter((sender) => sender.name.toLowerCase().includes(q));
    }
    if (query.status) {
      const normalizedStatus = query.status.toUpperCase();
      senders = senders.filter((sender) => sender.status === normalizedStatus);
    }

    const quotaInfo = await getRemainingQuota(user.id);
    const used = senderNames.filter((sender) =>
      QUOTA_COUNT_STATUSES.includes(sender.status as (typeof QUOTA_COUNT_STATUSES)[number])
    ).length;
    const activePkg = quotaInfo.packages[0];

    return apiResponse({
      senders,
      quota: {
        used,
        limit: quotaInfo.senderNameLimit,
        packageName: activePkg?.tier?.name ?? null,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/senders — legacy customer sender-name submit route used by dashboard page
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const input = createSenderSchema.parse(await readJsonBody(req));
    const normalizedName = input.name.toUpperCase();

    const nameCheck = validateSenderName(normalizedName);
    if (!nameCheck.valid) {
      const reasons = nameCheck.checks
        .filter((check) => !check.passed)
        .map((check) => check.message)
        .join(", ");
      throw new ApiError(400, `ชื่อผู้ส่งไม่ผ่านการตรวจสอบ: ${reasons}`);
    }

    const [quota, used, existing] = await Promise.all([
      getRemainingQuota(user.id),
      db.senderName.count({
        where: {
          userId: user.id,
          status: { in: [...QUOTA_COUNT_STATUSES] },
        },
      }),
      db.senderName.findUnique({
        where: { userId_name: { userId: user.id, name: normalizedName } },
      }),
    ]);

    if (existing) {
      if (existing.status === "REJECTED") {
        throw new ApiError(409, "ชื่อผู้ส่งนี้ถูกปฏิเสธแล้ว กรุณาใช้ชื่ออื่น", "DUPLICATE");
      }
      throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว", "DUPLICATE");
    }
    if (quota.senderNameLimit !== null && used >= quota.senderNameLimit) {
      throw new ApiError(400, "เกินจำนวน Sender Name ที่อนุญาต");
    }

    let sender;
    try {
      sender = await db.$transaction(async (tx) => {
        const created = await tx.senderName.create({
          data: {
            userId: user.id,
            name: normalizedName,
            status: "PENDING",
            senderType: input.type,
            adminNotes: input.note || null,
            submittedAt: new Date(),
          },
        });

        await tx.senderNameHistory.create({
          data: {
            senderNameId: created.id,
            action: "submitted",
            fromStatus: "DRAFT",
            toStatus: "PENDING",
            note: input.note || null,
            performedBy: user.id,
          },
        });

        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว", "DUPLICATE");
      }
      throw error;
    }

    return apiResponse({
      sender: {
        id: sender.id,
        name: sender.name,
        type: normalizeSenderType(sender.senderType),
        status: normalizeLegacyStatus(sender.status),
        smsSent: 0,
        createdAt: sender.createdAt,
        approvedAt: sender.approvedAt,
        rejectNote: sender.rejectNote,
        note: sender.adminNotes,
      },
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
