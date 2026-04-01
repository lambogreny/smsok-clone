"use server";


import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { templateSchema } from "../validations";
import { resolveActionUserId, type InternalActionUserToken } from "../action-user";
import { extractVariables } from "../template-utils";
import { calculateSmsSegments } from "../package/quota";

// ==========================================
// List templates
// ==========================================

export async function getTemplates(): Promise<Awaited<ReturnType<typeof db.messageTemplate.findMany>>>;
export async function getTemplates(userId: string): Promise<Awaited<ReturnType<typeof db.messageTemplate.findMany>>>;
export async function getTemplates(userId: string, token: InternalActionUserToken): Promise<Awaited<ReturnType<typeof db.messageTemplate.findMany>>>;
export async function getTemplates(userId?: string, token?: InternalActionUserToken) {
  userId = await resolveActionUserId(userId, token);
  return db.messageTemplate.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

// ==========================================
// Create template
// ==========================================

export async function createTemplate(data: unknown): Promise<Awaited<ReturnType<typeof db.messageTemplate.create>>>;
export async function createTemplate(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.messageTemplate.create>>>;
export async function createTemplate(userId: string, data: unknown, token: InternalActionUserToken): Promise<Awaited<ReturnType<typeof db.messageTemplate.create>>>;
export async function createTemplate(userIdOrData: string | unknown, maybeData?: unknown, token?: InternalActionUserToken) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
    token,
  );
  const input = templateSchema.parse(maybeData === undefined ? userIdOrData : maybeData);

  const count = await db.messageTemplate.count({ where: { userId, deletedAt: null } });
  if (count >= 50) {
    throw new Error("สร้างเทมเพลตได้สูงสุด 50 รายการ");
  }

  // Duplicate name check
  const duplicate = await db.messageTemplate.findFirst({
    where: { userId, name: input.name, deletedAt: null },
  });
  if (duplicate) {
    throw new Error("มีเทมเพลตชื่อนี้อยู่แล้ว");
  }

  const variables = extractVariables(input.content);
  const segmentCount = calculateSmsSegments(input.content);

  let template: Awaited<ReturnType<typeof db.messageTemplate.create>>;
  try {
    template = await db.messageTemplate.create({
      data: {
        userId,
        name: input.name,
        content: input.content,
        category: input.category,
        variables,
        segmentCount,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      throw new Error("มีเทมเพลตชื่อนี้อยู่แล้ว");
    }
    throw error;
  }

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/send");
  return template;
}

// ==========================================
// Update template
// ==========================================

export async function updateTemplate(templateId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.messageTemplate.update>>>;
export async function updateTemplate(userId: string, templateId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.messageTemplate.update>>>;
export async function updateTemplate(userId: string, templateId: string, data: unknown, token: InternalActionUserToken): Promise<Awaited<ReturnType<typeof db.messageTemplate.update>>>;
export async function updateTemplate(userIdOrTemplateId: string, templateIdOrData: string | unknown, maybeData?: unknown, token?: InternalActionUserToken) {
  const hasExplicitUserId = maybeData !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrTemplateId : undefined, token);
  const templateId = hasExplicitUserId ? templateIdOrData as string : userIdOrTemplateId;
  const input = templateSchema.partial().parse(hasExplicitUserId ? maybeData : templateIdOrData);

  const existing = await db.messageTemplate.findFirst({
    where: { id: templateId, userId, deletedAt: null },
  });
  if (!existing) throw new Error("ไม่พบเทมเพลต");

  // Duplicate name check on rename
  if (input.name !== undefined && input.name !== existing.name) {
    const duplicate = await db.messageTemplate.findFirst({
      where: { userId, name: input.name, deletedAt: null, id: { not: templateId } },
    });
    if (duplicate) throw new Error("มีเทมเพลตชื่อนี้อยู่แล้ว");
  }

  const newContent = input.content ?? existing.content;
  const updateData: Record<string, unknown> = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.content !== undefined && { content: input.content }),
    ...(input.category !== undefined && { category: input.category }),
  };

  if (input.content !== undefined) {
    updateData.variables = extractVariables(newContent);
    updateData.segmentCount = calculateSmsSegments(newContent);
  }

  let updated: Awaited<ReturnType<typeof db.messageTemplate.update>>;
  try {
    updated = await db.messageTemplate.update({
      where: { id: templateId },
      data: updateData,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      throw new Error("มีเทมเพลตชื่อนี้อยู่แล้ว");
    }
    throw error;
  }

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/send");
  return updated;
}

// ==========================================
// Delete template (soft delete)
// ==========================================

export async function deleteTemplate(templateId: string): Promise<void>;
export async function deleteTemplate(userId: string, templateId: string): Promise<void>;
export async function deleteTemplate(userId: string, templateId: string, token: InternalActionUserToken): Promise<void>;
export async function deleteTemplate(userIdOrTemplateId: string, maybeTemplateId?: string, token?: InternalActionUserToken) {
  const userId = await resolveActionUserId(
    maybeTemplateId === undefined ? undefined : userIdOrTemplateId,
    token,
  );
  const templateId = maybeTemplateId ?? userIdOrTemplateId;
  const existing = await db.messageTemplate.findFirst({
    where: { id: templateId, userId, deletedAt: null },
  });
  if (!existing) throw new Error("ไม่พบเทมเพลต");

  await db.messageTemplate.update({
    where: { id: templateId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/send");
}

// ==========================================
// Permanent delete template (hard delete)
// ==========================================

export async function permanentDeleteTemplate(templateId: string): Promise<void>;
export async function permanentDeleteTemplate(userId: string, templateId: string): Promise<void>;
export async function permanentDeleteTemplate(userIdOrTemplateId: string, maybeTemplateId?: string) {
  const userId = await resolveActionUserId(
    maybeTemplateId === undefined ? undefined : userIdOrTemplateId,
  );
  const templateId = maybeTemplateId ?? userIdOrTemplateId;
  const existing = await db.messageTemplate.findFirst({
    where: { id: templateId, userId },
  });
  if (!existing) throw new Error("ไม่พบเทมเพลต");

  await db.messageTemplate.delete({
    where: { id: templateId },
  });
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/send");
}
