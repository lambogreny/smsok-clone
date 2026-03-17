import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { readJsonOr400 } from "@/lib/read-json-or-400";
import { requireApiPermission } from "@/lib/rbac";
import { normalizePhone } from "@/lib/validations";
import { z } from "zod";

const blacklistBodySchema = z.object({
  phone: z.string().min(1),
  reason: z.string().trim().max(200).nullable().optional(),
});

function normalizeBlacklistPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (!/^0[0-9]{9}$/.test(normalized) && !/^\+66[0-9]{9}$/.test(normalized)) {
    throw new ApiError(400, "เบอร์โทรไม่ถูกต้อง");
  }
  return normalized;
}

// GET /api/v1/contacts/blacklist
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const denied = await requireApiPermission(user.id, "read", "contact");
    if (denied) return denied;

    const entries = await prisma.phoneBlacklist.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        phone: true,
        reason: true,
        createdAt: true,
      },
    });

    return apiResponse({
      entries: entries.map((entry) => ({
        id: entry.id,
        phone: entry.phone,
        reason: entry.reason,
        addedAt: entry.createdAt,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/contacts/blacklist
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const denied = await requireApiPermission(user.id, "create", "contact");
    if (denied) return denied;

    const body = blacklistBodySchema.parse(await readJsonOr400(req));
    const phone = normalizeBlacklistPhone(body.phone);

    const entry = await prisma.phoneBlacklist.upsert({
      where: { phone },
      update: {
        reason: body.reason?.trim() || "Manual blacklist",
        addedBy: user.id,
      },
      create: {
        phone,
        reason: body.reason?.trim() || "Manual blacklist",
        addedBy: user.id,
      },
      select: {
        id: true,
        phone: true,
        reason: true,
        createdAt: true,
      },
    });

    return apiResponse({
      entry: {
        id: entry.id,
        phone: entry.phone,
        reason: entry.reason,
        addedAt: entry.createdAt,
      },
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/contacts/blacklist
export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const denied = await requireApiPermission(user.id, "delete", "contact");
    if (denied) return denied;

    const body = blacklistBodySchema.pick({ phone: true }).parse(await readJsonOr400(req));
    const phone = normalizeBlacklistPhone(body.phone);

    await prisma.phoneBlacklist.deleteMany({ where: { phone } });
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
