"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { templateSchema } from "../validations";

/** Extract {{varName}} from template content */
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)(?:\|[^}]*)?\}\}/g) ?? [];
  const vars = matches.map((m) => m.replace(/\{\{(\w+)(?:\|[^}]*)?\}\}/, "$1"));
  return [...new Set(vars)];
}

/** Calculate SMS segments: Thai = UCS-2 (70 chars/seg), ASCII = GSM-7 (160 chars/seg) */
function calculateSegments(content: string): number {
  const hasThai = /[\u0E00-\u0E7F]/.test(content);
  const hasNonGsm = /[^\x00-\x7F]/.test(content);
  const charsPerSegment = hasThai || hasNonGsm ? 70 : 160;
  return Math.max(1, Math.ceil(content.length / charsPerSegment));
}

// ==========================================
// List templates
// ==========================================

export async function getTemplates(userId: string) {
  return db.messageTemplate.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

// ==========================================
// Create template
// ==========================================

export async function createTemplate(userId: string, data: unknown) {
  const input = templateSchema.parse(data);

  const count = await db.messageTemplate.count({ where: { userId, deletedAt: null } });
  if (count >= 50) {
    throw new Error("สร้างเทมเพลตได้สูงสุด 50 รายการ");
  }

  const variables = extractVariables(input.content);
  const segmentCount = calculateSegments(input.content);

  const template = await db.messageTemplate.create({
    data: {
      userId,
      name: input.name,
      content: input.content,
      category: input.category,
      variables,
      segmentCount,
    },
  });

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/send");
  return template;
}

// ==========================================
// Update template
// ==========================================

export async function updateTemplate(userId: string, templateId: string, data: unknown) {
  const input = templateSchema.partial().parse(data);

  const existing = await db.messageTemplate.findFirst({
    where: { id: templateId, userId, deletedAt: null },
  });
  if (!existing) throw new Error("ไม่พบเทมเพลต");

  const newContent = input.content ?? existing.content;
  const updateData: Record<string, unknown> = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.content !== undefined && { content: input.content }),
    ...(input.category !== undefined && { category: input.category }),
  };

  if (input.content !== undefined) {
    updateData.variables = extractVariables(newContent);
    updateData.segmentCount = calculateSegments(newContent);
  }

  const updated = await db.messageTemplate.update({
    where: { id: templateId },
    data: updateData,
  });

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/send");
  return updated;
}

// ==========================================
// Delete template (soft delete)
// ==========================================

export async function deleteTemplate(userId: string, templateId: string) {
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
