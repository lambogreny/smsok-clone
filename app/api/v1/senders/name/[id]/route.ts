import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";
import { validateSenderName, validateUrls } from "@/lib/sender-name-validation";

const updateSenderSchema = z
  .object({
    name: z.string().trim().min(3).max(11).optional(),
    accountType: z.enum(["corporate", "individual"]).optional(),
    urls: z.array(z.string().url()).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined || value.accountType !== undefined || value.urls !== undefined,
    {
      message: "กรุณาระบุข้อมูลที่ต้องการอัปเดต",
    },
  );

const EDITABLE_SENDER_STATUSES = ["DRAFT", "PENDING", "REJECTED"] as const;

function buildUpdateNote(input: z.infer<typeof updateSenderSchema>, current: {
  name: string;
  accountType: string | null;
  urls: Array<{ domain: string }>;
}) {
  const changes: string[] = [];

  if (input.name && input.name !== current.name) {
    changes.push(`name:${current.name}->${input.name}`);
  }
  if (input.accountType && input.accountType !== current.accountType) {
    changes.push(`accountType:${current.accountType ?? "none"}->${input.accountType}`);
  }
  if (input.urls !== undefined) {
    const previous = current.urls.map((url) => url.domain).sort().join(",");
    const next = [...input.urls].sort().join(",");
    if (previous !== next) {
      changes.push(`urls:${current.urls.length}->${input.urls.length}`);
    }
  }

  return changes.join("; ") || "updated";
}

// GET /api/v1/senders/name/[id] — detail + docs + history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authenticateRequest(req);

    const { id } = await params;

    const senderName = await db.senderName.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            verified: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        urls: {
          select: { id: true, domain: true },
        },
        history: {
          select: {
            id: true,
            action: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!senderName) throw new ApiError(404, "ไม่พบ sender name");
    if (senderName.userId !== user.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");

    return apiResponse({
      senderName: {
        id: senderName.id,
        name: senderName.name,
        status: senderName.status,
        accountType: senderName.accountType,
        rejectNote: senderName.rejectNote,
        submittedAt: senderName.submittedAt,
        approvedAt: senderName.approvedAt,
        expiresAt: senderName.expiresAt,
        createdAt: senderName.createdAt,
        documents: senderName.documents,
        urls: senderName.urls,
        history: senderName.history,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

async function updateSenderName(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const input = updateSenderSchema.parse(body);
    const normalizedName = input.name?.toUpperCase();

    if (normalizedName) {
      const nameCheck = validateSenderName(normalizedName);
      if (!nameCheck.valid) {
        throw new ApiError(
          400,
          `ชื่อผู้ส่งไม่ผ่านการตรวจสอบ: ${nameCheck.checks.filter((c) => !c.passed).map((c) => c.message).join(", ")}`,
        );
      }
    }

    if (input.urls !== undefined) {
      const urlCheck = validateUrls(input.urls);
      if (!urlCheck.valid) {
        throw new ApiError(
          400,
          `URL ต้องห้าม: ${urlCheck.blocked.join(", ")} — ห้ามใช้ URL shortener สาธารณะ`,
        );
      }
    }

    const senderName = await db.senderName.findFirst({
      where: { id, userId: user.id },
      include: {
        urls: {
          select: { id: true, domain: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!senderName) throw new ApiError(404, "ไม่พบ sender name");
    if (!EDITABLE_SENDER_STATUSES.includes(senderName.status as (typeof EDITABLE_SENDER_STATUSES)[number])) {
      throw new ApiError(400, "สถานะไม่อนุญาตให้อัปเดตชื่อผู้ส่ง");
    }

    if (normalizedName && normalizedName !== senderName.name) {
      const existing = await db.senderName.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name: normalizedName,
          },
        },
      });

      if (existing && existing.id !== senderName.id) {
        throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว", "DUPLICATE");
      }
    }

    const updatedSenderName = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      await tx.senderName.update({
        where: { id: senderName.id },
        data: {
          name: normalizedName,
          accountType: input.accountType,
        },
      });

      if (input.urls !== undefined) {
        await tx.senderNameUrl.deleteMany({
          where: { senderNameId: senderName.id },
        });

        if (input.urls.length > 0) {
          await tx.senderNameUrl.createMany({
            data: input.urls.map((domain) => ({
              senderNameId: senderName.id,
              domain,
            })),
          });
        }
      }

      await tx.senderNameHistory.create({
        data: {
          senderNameId: senderName.id,
          action: "updated",
          fromStatus: senderName.status,
          toStatus: senderName.status,
          note: buildUpdateNote(
            {
              ...input,
              name: normalizedName,
            },
            senderName,
          ),
          performedBy: user.id,
        },
      });

      return tx.senderName.findUniqueOrThrow({
        where: { id: senderName.id },
        include: {
          documents: {
            select: {
              id: true,
              type: true,
              fileName: true,
              fileUrl: true,
              mimeType: true,
              verified: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
          urls: {
            select: { id: true, domain: true },
            orderBy: { createdAt: "asc" },
          },
          history: {
            select: {
              id: true,
              action: true,
              fromStatus: true,
              toStatus: true,
              note: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });

    return apiResponse({
      senderName: {
        id: updatedSenderName.id,
        name: updatedSenderName.name,
        status: updatedSenderName.status,
        accountType: updatedSenderName.accountType,
        rejectNote: updatedSenderName.rejectNote,
        submittedAt: updatedSenderName.submittedAt,
        approvedAt: updatedSenderName.approvedAt,
        expiresAt: updatedSenderName.expiresAt,
        createdAt: updatedSenderName.createdAt,
        documents: updatedSenderName.documents,
        urls: updatedSenderName.urls,
        history: updatedSenderName.history,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      return apiError(new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว", "DUPLICATE"));
    }
    return apiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  params: { params: Promise<{ id: string }> },
) {
  return updateSenderName(req, params);
}

export async function PATCH(
  req: NextRequest,
  params: { params: Promise<{ id: string }> },
) {
  return updateSenderName(req, params);
}
