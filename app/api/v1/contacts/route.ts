import { NextRequest } from "next/server";
import { authenticateApiKey, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { createContact } from "@/lib/actions/contacts";
import { createContactSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";

// GET /api/v1/contacts?search=xxx&groupId=xxx&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const search = searchParams.get("search");
    const groupId = searchParams.get("groupId");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (groupId) {
      where.groups = { some: { groupId } };
    }

    const [contacts, total] = await prisma.$transaction([
      prisma.contact.findMany({
        where,
        include: {
          groups: {
            include: { group: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    const result = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.tags,
      groups: c.groups.map((g) => ({ id: g.group.id, name: g.group.name })),
      createdAt: c.createdAt,
    }));

    return apiResponse({
      contacts: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/contacts — create single contact
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const input = createContactSchema.parse(body);
    const contact = await createContact(user.id, input);
    return apiResponse(contact, 201);
  } catch (error) {
    // Duplicate phone → 409 Conflict (not 500)
    if (error instanceof Error && error.message.includes("มีอยู่แล้ว")) {
      return apiError(new ApiError(409, error.message, "DUPLICATE"));
    }
    return apiError(error);
  }
}
