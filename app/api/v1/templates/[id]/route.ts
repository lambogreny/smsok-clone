import { NextRequest } from "next/server";
import { authenticateRequest, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { updateTemplate, deleteTemplate } from "@/lib/actions/templates";
import { prisma as db } from "@/lib/db";
import { templateSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "template");
    if (denied) return denied;

    const { id } = await params;

    const template = await db.messageTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        content: true,
        category: true,
        variables: true,
        segmentCount: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!template || template.deletedAt) throw new ApiError(404, "ไม่พบเทมเพลต");
    if (template.userId !== user.id && !template.isPublic) {
      throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง Template นี้");
    }

    const { userId: _, deletedAt: __, ...data } = template;
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "template");
    if (denied) return denied;

    const { id } = await params;
    const body = await req.json();
    const input = templateSchema.partial().parse(body);
    const template = await updateTemplate(user.id, id, input);
    return apiResponse(template);
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

    const denied = await requireApiPermission(user.id, "delete", "template");
    if (denied) return denied;

    const { id } = await params;
    await deleteTemplate(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
