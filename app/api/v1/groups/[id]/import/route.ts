import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/validations";
import { z } from "zod";

const MAX_TEXT_IMPORT_BYTES = 1024 * 1024;
const MAX_IMPORT_ROWS = 5000;
const CSV_TEXT_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
]);
const contactsArraySchema = z.array(
  z.object({
    name: z.string().optional(),
    phone: z.string(),
  }),
);

function isCsvTextFile(file: File) {
  return file.name.match(/\.(csv|txt)$/i) || CSV_TEXT_MIME_TYPES.has(file.type);
}

// POST /api/v1/groups/:id/import — Import CSV directly into a group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id: groupId } = await params;
    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

    let rows: { name?: string; phone: string }[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) throw new ApiError(400, "กรุณาอัพโหลดไฟล์");
      if (!isCsvTextFile(file)) {
        throw new ApiError(400, "รองรับเฉพาะไฟล์ CSV หรือ TXT");
      }
      if (file.size > MAX_TEXT_IMPORT_BYTES) {
        throw new ApiError(400, "ไฟล์ CSV/TXT ต้องไม่เกิน 1MB");
      }
      rows = parseCsv(await file.text());
    } else {
      const body = await req.json();
      if (typeof body.data === "string") {
        if (Buffer.byteLength(body.data, "utf8") > MAX_TEXT_IMPORT_BYTES) {
          throw new ApiError(400, "ข้อมูล CSV/TXT ต้องไม่เกิน 1MB");
        }
        rows = parseCsv(body.data);
      } else if (Array.isArray(body.contacts)) {
        if (body.contacts.length > MAX_IMPORT_ROWS) {
          throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง");
        }
        rows = contactsArraySchema.parse(body.contacts);
      } else {
        throw new ApiError(400, "กรุณาส่ง contacts array หรือ data string");
      }
    }

    if (rows.length === 0) throw new ApiError(400, "ไม่มีรายชื่อที่จะนำเข้า");
    if (rows.length > MAX_IMPORT_ROWS) throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง");

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
  if (dataLines.length > MAX_IMPORT_ROWS) {
    throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง");
  }

  return dataLines.map((line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      return { name: parts[0], phone: parts[1] };
    }
    return { phone: parts[0] };
  });
}
