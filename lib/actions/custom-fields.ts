"use server";

import { prisma } from "@/lib/db";
import { resolveActionUserId } from "@/lib/action-user";

// ── List custom fields ───────────────────────────────
export async function getCustomFields(): Promise<Awaited<ReturnType<typeof prisma.customField.findMany>>>;
export async function getCustomFields(userId: string): Promise<Awaited<ReturnType<typeof prisma.customField.findMany>>>;
export async function getCustomFields(userId?: string) {
  userId = await resolveActionUserId(userId);
  return prisma.customField.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

// ── Create custom field ──────────────────────────────
export async function createCustomField(
  userId: string,
  data: { name: string; type: string; options?: string[]; required?: boolean }
) {
  userId = await resolveActionUserId(userId);
  const validTypes = ["text", "number", "date", "select", "boolean"];
  if (!validTypes.includes(data.type)) {
    throw new Error("ประเภทฟิลด์ไม่ถูกต้อง");
  }
  if (data.type === "select" && (!data.options || data.options.length === 0)) {
    throw new Error("ฟิลด์ประเภท select ต้องมีตัวเลือกอย่างน้อย 1 รายการ");
  }

  const count = await prisma.customField.count({ where: { userId } });
  if (count >= 50) {
    throw new Error("สร้าง Custom Field ได้สูงสุด 50 รายการ");
  }

  return prisma.customField.create({
    data: {
      userId,
      name: data.name.trim(),
      type: data.type,
      options: data.options ? JSON.stringify(data.options) : null,
      required: data.required ?? false,
    },
  });
}

// ── Update custom field ──────────────────────────────
export async function updateCustomField(
  userId: string,
  fieldId: string,
  data: { name?: string; type?: string; options?: string[]; required?: boolean }
) {
  userId = await resolveActionUserId(userId);
  const field = await prisma.customField.findFirst({
    where: { id: fieldId, userId },
  });
  if (!field) throw new Error("ไม่พบ Custom Field");

  if (data.type) {
    const validTypes = ["text", "number", "date", "select", "boolean"];
    if (!validTypes.includes(data.type)) {
      throw new Error("ประเภทฟิลด์ไม่ถูกต้อง");
    }
  }

  return prisma.customField.update({
    where: { id: fieldId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.options !== undefined && { options: JSON.stringify(data.options) }),
      ...(data.required !== undefined && { required: data.required }),
    },
  });
}

// ── Delete custom field ──────────────────────────────
export async function deleteCustomField(userId: string, fieldId: string) {
  userId = await resolveActionUserId(userId);
  const field = await prisma.customField.findFirst({
    where: { id: fieldId, userId },
  });
  if (!field) throw new Error("ไม่พบ Custom Field");

  await prisma.customField.delete({ where: { id: fieldId } });
  return { success: true };
}

// ── Get custom field values for a contact ────────────
export async function getCustomFieldValues(contactId: string): Promise<Awaited<ReturnType<typeof prisma.customFieldValue.findMany>>>;
export async function getCustomFieldValues(userId: string, contactId: string): Promise<Awaited<ReturnType<typeof prisma.customFieldValue.findMany>>>;
export async function getCustomFieldValues(userIdOrContactId: string, maybeContactId?: string) {
  const userId = await resolveActionUserId(maybeContactId === undefined ? undefined : userIdOrContactId);
  const contactId = maybeContactId ?? userIdOrContactId;
  // Verify contact ownership
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  return prisma.customFieldValue.findMany({
    where: { contactId },
    include: { field: { select: { id: true, name: true, type: true, options: true } } },
  });
}

// ── Set custom field values for a contact (upsert) ───
export async function setCustomFieldValues(
  contactId: string,
  values: Array<{ fieldId: string; value: string }>,
): Promise<{ success: true }>;
export async function setCustomFieldValues(
  userId: string,
  contactId: string,
  values: Array<{ fieldId: string; value: string }>,
): Promise<{ success: true }>;
export async function setCustomFieldValues(
  userIdOrContactId: string,
  contactIdOrValues: string | Array<{ fieldId: string; value: string }>,
  maybeValues?: Array<{ fieldId: string; value: string }>,
) {
  const hasExplicitUserId = Array.isArray(maybeValues);
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrContactId : undefined);
  const contactId = hasExplicitUserId ? contactIdOrValues as string : userIdOrContactId;
  const values = hasExplicitUserId ? maybeValues : contactIdOrValues as Array<{ fieldId: string; value: string }>;
  // Verify contact ownership
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  // Verify all fields belong to user
  const fieldIds = values.map((v) => v.fieldId);
  const fields = await prisma.customField.findMany({
    where: { id: { in: fieldIds }, userId },
  });
  if (fields.length !== fieldIds.length) {
    throw new Error("Custom Field บางรายการไม่ถูกต้อง");
  }

  // Validate select-type values against options
  for (const val of values) {
    const field = fields.find((f: (typeof fields)[number]) => f.id === val.fieldId);
    if (field?.type === "select" && field.options) {
      const opts: string[] = JSON.parse(field.options);
      if (!opts.includes(val.value)) {
        throw new Error(`ค่า "${val.value}" ไม่อยู่ในตัวเลือกของฟิลด์ "${field.name}"`);
      }
    }
  }

  // Upsert all values in transaction
  await prisma.$transaction(
    values.map((v) =>
      prisma.customFieldValue.upsert({
        where: { contactId_fieldId: { contactId, fieldId: v.fieldId } },
        create: { contactId, fieldId: v.fieldId, value: v.value },
        update: { value: v.value },
      })
    )
  );

  return { success: true };
}
