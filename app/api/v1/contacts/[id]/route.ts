import { NextRequest } from "next/server";
import { authenticateApiKey, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { updateContact, deleteContact } from "@/lib/actions/contacts";
import { updateContactSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";

// GET /api/v1/contacts/:id — get single contact
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id } = await params;

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
      include: {
        groups: {
          include: { group: { select: { id: true, name: true } } },
        },
      },
    });

    if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ");

    return apiResponse({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      tags: contact.tags,
      groups: contact.groups.map((g) => ({ id: g.group.id, name: g.group.name })),
      createdAt: contact.createdAt,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id } = await params;
    const body = await req.json();
    const input = updateContactSchema.parse(body);
    const contact = await updateContact(user.id, id, input);
    return apiResponse(contact);
  } catch (error) {
    if (error instanceof Error && error.message.includes("มีอยู่แล้ว")) {
      return apiError(new ApiError(409, error.message, "DUPLICATE"));
    }
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id } = await params;
    await deleteContact(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
