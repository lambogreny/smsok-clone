import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
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
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const senderNames = await db.senderName.findMany({
      where: { userId: session.id },
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
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "sender_name");
    if (rl.blocked) return rl.blocked;

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
      where: { userId_name: { userId: session.id, name: input.name.toUpperCase() } },
    });
    if (existing) {
      throw new ApiError(400, "ชื่อผู้ส่งนี้มีอยู่แล้ว");
    }

    // Create sender name + URLs in transaction
    const senderName = await db.$transaction(async (tx) => {
      const sn = await tx.senderName.create({
        data: {
          userId: session.id,
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
          performedBy: session.id,
        },
      });

      return sn;
    });

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
