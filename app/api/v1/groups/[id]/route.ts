import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { updateGroup, deleteGroup } from "@/lib/actions/groups";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "group");
    if (denied) return denied;

    const { id } = await params;
    const group = await prisma.contactGroup.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
        members: {
          select: {
            id: true,
            contactId: true,
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: { contact: { name: "asc" } },
        },
      },
    });

    if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

    return apiResponse({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      members: group.members.map((member) => member.contact),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "group");
    if (denied) return denied;

    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const group = await updateGroup(user.id, id, body);
    return apiResponse(group);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "delete", "group");
    if (denied) return denied;

    const { id } = await params;
    await deleteGroup(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
