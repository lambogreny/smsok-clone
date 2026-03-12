import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/validations";

// POST /api/v1/groups/:id/import — Import CSV directly into a group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id: groupId } = await params;
    const limit = await checkRateLimit(user.id, "import");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new Error("ไม่พบกลุ่ม");

    let rows: { name?: string; phone: string }[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) throw new Error("กรุณาอัพโหลดไฟล์");
      rows = parseCsv(await file.text());
    } else {
      const body = await req.json();
      if (typeof body.data === "string") {
        rows = parseCsv(body.data);
      } else if (Array.isArray(body.contacts)) {
        rows = body.contacts;
      } else {
        throw new Error("กรุณาส่ง contacts array หรือ data string");
      }
    }

    if (rows.length === 0) throw new Error("ไม่มีรายชื่อที่จะนำเข้า");
    if (rows.length > 10000) throw new Error("นำเข้าได้สูงสุด 10,000 รายชื่อต่อครั้ง");

    let imported = 0;
    let duplicates = 0;
    let invalid = 0;
    const createdIds: string[] = [];

    for (const row of rows) {
      const phone = normalizePhone(row.phone || "");
      if (!/^0[0-9]{9}$/.test(phone) && !/^\+66[0-9]{9}$/.test(phone)) {
        invalid++;
        continue;
      }

      try {
        const contact = await prisma.contact.create({
          data: {
            userId: user.id,
            name: row.name?.trim() || phone,
            phone,
          },
        });
        createdIds.push(contact.id);
        imported++;
      } catch {
        // Duplicate phone — find existing and add to group
        const existing = await prisma.contact.findUnique({
          where: { userId_phone: { userId: user.id, phone } },
          select: { id: true },
        });
        if (existing) {
          createdIds.push(existing.id);
          duplicates++;
        } else {
          duplicates++;
        }
      }
    }

    // Add all (new + existing) to group
    if (createdIds.length > 0) {
      await prisma.contactGroupMember.createMany({
        data: createdIds.map((contactId) => ({ groupId, contactId })),
        skipDuplicates: true,
      });
    }

    return apiResponse({
      imported,
      addedToGroup: createdIds.length,
      duplicates,
      invalid,
      total: rows.length,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}

function parseCsv(text: string): { name?: string; phone: string }[] {
  const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("name") || firstLine.includes("phone") || firstLine.includes("เบอร์");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      return { name: parts[0], phone: parts[1] };
    }
    return { phone: parts[0] };
  });
}
