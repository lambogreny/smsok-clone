import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createContactGroupSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "group");
    if (denied) return denied;

    const groups = await prisma.contactGroup.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse({
      groups: groups.map((group: (typeof groups)[number]) => ({
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        memberCount: group._count.members,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "group");
    if (denied) return denied;

    const body = await req.json();
    const input = createContactGroupSchema.parse(body);
    const name = input.name.trim();

    if (!name) {
      return apiResponse({ error: "กรุณากรอกชื่อกลุ่ม" }, 400);
    }

    // Duplicate name check (unique constraint will also enforce)
    const existing = await prisma.contactGroup.findUnique({
      where: { userId_name: { userId: user.id, name } },
    });
    if (existing) {
      return apiResponse({ error: "มีกลุ่มชื่อนี้อยู่แล้ว" }, 409);
    }

    const group = await prisma.contactGroup.create({
      data: { userId: user.id, name },
    });

    return apiResponse({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      memberCount: 0,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
