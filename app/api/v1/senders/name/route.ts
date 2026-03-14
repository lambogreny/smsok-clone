import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";
import { validateSenderName, validateUrls } from "@/lib/sender-name-validation";

const submitSchema = z.object({
  name: z.string().min(3).max(11),
  accountType: z.enum(["corporate", "individual"]),
  urls: z.array(z.string().url()).optional().default([]),
});

// GET /api/v1/senders/name — list user's sender names
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const senderNames = await db.senderName.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        accountType: true,
        submittedAt: true,
        approvedAt: true,
        expiresAt: true,
        rejectNote: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse({ senderNames });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/senders/name — submit sender name request
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const input = submitSchema.parse(body);

    // Validate name against กสทช. rules
    const nameCheck = validateSenderName(input.name);
    if (!nameCheck.valid) {
      throw new ApiError(400, `ชื่อผู้ส่งไม่ผ่านการตรวจสอบ: ${nameCheck.checks.filter((c) => !c.passed).map((c) => c.message).join(", ")}`);
    }

    // Validate URLs (no public shorteners)
    if (input.urls.length > 0) {
      const urlCheck = validateUrls(input.urls);
      if (!urlCheck.valid) {
        throw new ApiError(400, `URL ต้องห้าม: ${urlCheck.blocked.join(", ")} — ห้ามใช้ URL shortener สาธารณะ`);
      }
    }

    // Check duplicate name for this user
    const existing = await db.senderName.findUnique({
      where: { userId_name: { userId: user.id, name: input.name.toUpperCase() } },
    });
    if (existing) {
      throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว", "DUPLICATE");
    }

    // Create sender name + URLs in transaction
    let senderName;
    try {
      senderName = await db.$transaction(async (tx) => {
        const sn = await tx.senderName.create({
          data: {
            userId: user.id,
            name: input.name.toUpperCase(),
            status: "PENDING",
            accountType: input.accountType,
            submittedAt: new Date(),
          },
        });

        // Create URL whitelists
        if (input.urls.length > 0) {
          await tx.senderNameUrl.createMany({
            data: input.urls.map((domain) => ({
              senderNameId: sn.id,
              domain,
            })),
          });
        }

        // Log history
        await tx.senderNameHistory.create({
          data: {
            senderNameId: sn.id,
              action: "submitted",
              fromStatus: "DRAFT",
              toStatus: "PENDING",
              performedBy: user.id,
            },
          });

        return sn;
      });
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
        throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว", "DUPLICATE");
      }
      throw error;
    }

    return apiResponse({
      senderName: {
        id: senderName.id,
        name: senderName.name,
        status: senderName.status,
        submittedAt: senderName.submittedAt,
      },
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
