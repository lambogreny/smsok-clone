"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { templateSchema } from "../validations";

// ==========================================
// List templates
// ==========================================

export async function getTemplates(userId: string) {
  return db.messageTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

// ==========================================
// Create template
// ==========================================

export async function createTemplate(userId: string, data: unknown) {
  const input = templateSchema.parse(data);

  const count = await db.messageTemplate.count({ where: { userId } });
  if (count >= 50) {
    throw new Error("สร้างเทมเพลตได้สูงสุด 50 รายการ");
  }

  const template = await db.messageTemplate.create({
    data: {
      userId,
      name: input.name,
      content: input.content,
      category: input.category,
    },
  });

  revalidatePath("/dashboard/send");
  return template;
}

// ==========================================
// Update template
// ==========================================

export async function updateTemplate(userId: string, templateId: string, data: unknown) {
  const input = templateSchema.partial().parse(data);

  const existing = await db.messageTemplate.findFirst({
    where: { id: templateId, userId },
  });
  if (!existing) throw new Error("ไม่พบเทมเพลต");

  const updated = await db.messageTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.category !== undefined && { category: input.category }),
    },
  });

  revalidatePath("/dashboard/send");
  return updated;
}

// ==========================================
// Delete template
// ==========================================

export async function deleteTemplate(userId: string, templateId: string) {
  const existing = await db.messageTemplate.findFirst({
    where: { id: templateId, userId },
  });
  if (!existing) throw new Error("ไม่พบเทมเพลต");

  await db.messageTemplate.delete({ where: { id: templateId } });
  revalidatePath("/dashboard/send");
}
