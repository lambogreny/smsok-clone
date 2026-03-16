import { NextRequest } from "next/server";
import { authenticateRequest, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { updateContact, deleteContact } from "@/lib/actions/contacts";
import { updateContactSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { readJsonOr400 } from "@/lib/read-json-or-400";

// Validate id format — reject XSS/injection attempts early
const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;

// GET /api/v1/contacts/:id — get single contact
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "contact");
    if (denied) return denied;

    const { id } = await params;
    if (!SAFE_ID.test(id)) throw new ApiError(400, "รหัสรายชื่อไม่ถูกต้อง");

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
      include: {
        groups: {
          include: { group: { select: { id: true, name: true } } },
        },
        contactTags: {
          include: { tag: { select: { id: true, name: true, color: true } } },
        },
      },
    });

    if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ");

    return apiResponse({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      tags: contact.contactTags.map((ct) => ct.tag),
      smsConsent: contact.smsConsent,
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
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "contact");
    if (denied) return denied;

    const { id } = await params;
    if (!SAFE_ID.test(id)) throw new ApiError(400, "รหัสรายชื่อไม่ถูกต้อง");
    const body = await readJsonOr400(req);
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
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "delete", "contact");
    if (denied) return denied;

    const { id } = await params;
    if (!SAFE_ID.test(id)) throw new ApiError(400, "รหัสรายชื่อไม่ถูกต้อง");
    await deleteContact(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/v1/contacts/:id/consent — update consent status
const VALID_CONSENT = ["OPTED_IN", "OPTED_OUT", "PENDING"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "contact");
    if (denied) return denied;

    const { id } = await params;
    if (!SAFE_ID.test(id)) throw new ApiError(400, "รหัสรายชื่อไม่ถูกต้อง");

    const body = await readJsonOr400<Record<string, unknown>>(req);

    const { consentStatus, reason } = body;
    if (!consentStatus || !VALID_CONSENT.includes(consentStatus as typeof VALID_CONSENT[number])) {
      throw new ApiError(400, "consentStatus ต้องเป็น OPTED_IN, OPTED_OUT, หรือ PENDING");
    }

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });
    if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ");

    const now = new Date();
    const isOptOut = consentStatus === "OPTED_OUT";
    const isOptIn = consentStatus === "OPTED_IN";

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        consentStatus: consentStatus as string,
        smsConsent: isOptIn,
        ...(isOptOut && { optOutAt: now, optOutReason: (reason as string) || null }),
        ...(isOptIn && { consentAt: now, optOutAt: null, optOutReason: null }),
      },
    });

    logger.info("consent updated", { contactId: id, consentStatus: String(consentStatus) });

    return apiResponse({
      id: updated.id,
      consentStatus: updated.consentStatus,
      smsConsent: updated.smsConsent,
      consentAt: updated.consentAt,
      optOutAt: updated.optOutAt,
      optOutReason: updated.optOutReason,
    });
  } catch (error) {
    return apiError(error);
  }
}
