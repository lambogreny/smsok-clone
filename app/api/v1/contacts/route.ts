import { NextRequest } from "next/server";
import { authenticateRequest, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { createContact } from "@/lib/actions/contacts";
import { createContactSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";

function readJsonBody(req: NextRequest) {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(400, "Content-Type must be application/json");
  }
  return req.json().catch(() => {
    throw new ApiError(400, "Invalid JSON");
  });
}

function normalizeCreateContactBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const input = body as Record<string, unknown>;
  const explicitName = typeof input.name === "string" ? input.name.trim() : "";
  const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
  const lastName = typeof input.lastName === "string" ? input.lastName.trim() : "";
  const name = explicitName || [firstName, lastName].filter(Boolean).join(" ").trim();
  const tags = Array.isArray(input.tags)
    ? input.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).join(", ")
    : input.tags;

  return {
    ...input,
    name,
    tags,
  };
}

// GET /api/v1/contacts?search=xxx&groupId=xxx&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "contact");
    if (denied) return denied;

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
          contactTags: {
            include: { tag: { select: { id: true, name: true, color: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    const result = contacts.map((c: (typeof contacts)[number]) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.contactTags.map((ct: (typeof c.contactTags)[number]) => ct.tag),
      smsConsent: c.smsConsent,
      groups: c.groups.map((g: (typeof c.groups)[number]) => ({ id: g.group.id, name: g.group.name })),
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
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "contact");
    if (denied) return denied;

    const body = normalizeCreateContactBody(await readJsonBody(req));
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
