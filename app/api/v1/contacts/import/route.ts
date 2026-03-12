import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/validations";
import { importContactsFromExcel, parseExcelFile } from "@/lib/actions/excel-import";

// POST /api/v1/contacts/import — Import CSV/text/Excel contacts
// Accepts: multipart/form-data (file) or application/json (contacts array)
// For Excel: send file + mapping (JSON string) + updateExisting (optional)
// For preview: send file without mapping → returns headers + preview rows
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "contact");
    if (denied) return denied;

    const limit = await checkRateLimit(user.id, "import");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) throw new Error("กรุณาอัพโหลดไฟล์");

      // Check if this is an Excel file
      const isExcel = file.name.match(/\.(xlsx|xls)$/i) ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";

      if (isExcel) {
        // Max 5MB for Excel
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("ไฟล์ต้องไม่เกิน 5MB");
        }

        const buffer = await file.arrayBuffer();
        const mappingStr = formData.get("mapping") as string | null;

        // No mapping = preview mode
        if (!mappingStr) {
          const preview = await parseExcelFile(buffer);
          return apiResponse(preview);
        }

        let mapping: { name: string; phone: string; email?: string; tags?: string };
        try {
          mapping = JSON.parse(mappingStr);
        } catch {
          throw new Error("mapping ต้องเป็น JSON ที่ถูกต้อง");
        }
        if (!mapping.name || !mapping.phone) {
          throw new Error("mapping ต้องมี name และ phone");
        }

        const updateExisting = formData.get("updateExisting") === "true";
        const result = await importContactsFromExcel(user.id, buffer, mapping, { updateExisting });
        return apiResponse(result, 201);
      }

      // CSV file — existing logic
      const groupId = formData.get("groupId") as string | null;
      const text = await file.text();
      return handleCsvImport(user.id, parseCsv(text), groupId);
    }

    // JSON body — existing logic
    const body = await req.json();
    const groupId = body.groupId || null;
    let rows: { name?: string; phone: string }[];

    if (typeof body.data === "string") {
      rows = parseCsv(body.data);
    } else if (Array.isArray(body.contacts)) {
      rows = body.contacts;
    } else {
      throw new Error("กรุณาส่ง contacts array หรือ data string");
    }

    return handleCsvImport(user.id, rows, groupId);
  } catch (error) {
    return apiError(error);
  }
}

async function handleCsvImport(
  userId: string,
  rows: { name?: string; phone: string }[],
  groupId: string | null
) {
  if (rows.length === 0) throw new Error("ไม่มีรายชื่อที่จะนำเข้า");
  if (rows.length > 10000) throw new Error("นำเข้าได้สูงสุด 10,000 รายชื่อต่อครั้ง");

  if (groupId) {
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId },
    });
    if (!group) throw new Error("ไม่พบกลุ่มรายชื่อ");
  }

  let invalid = 0;

  // Validate and normalize all phones upfront
  const validRows: { name: string; phone: string }[] = [];
  for (const row of rows) {
    const phone = normalizePhone(row.phone || "");
    if (!/^0[0-9]{9}$/.test(phone) && !/^\+66[0-9]{9}$/.test(phone)) {
      invalid++;
      continue;
    }
    validRows.push({ name: row.name?.trim() || phone, phone });
  }

  // Batch insert with skipDuplicates (N+1 fix)
  const BATCH_SIZE = 500;
  let totalCreated = 0;
  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    const result = await prisma.contact.createMany({
      data: batch.map((r) => ({ userId, name: r.name, phone: r.phone })),
      skipDuplicates: true,
    });
    totalCreated += result.count;
  }

  const duplicates = validRows.length - totalCreated;

  // Add to group if specified — query back created contacts by phone
  if (groupId && totalCreated > 0) {
    const phones = validRows.map((r) => r.phone);
    const created = await prisma.contact.findMany({
      where: { userId, phone: { in: phones } },
      select: { id: true },
    });
    await prisma.contactGroupMember.createMany({
      data: created.map((c) => ({ groupId: groupId!, contactId: c.id })),
      skipDuplicates: true,
    });
  }

  return apiResponse({
    imported: totalCreated,
    skipped: duplicates,
    duplicates,
    invalid,
    total: rows.length,
  }, 201);
}

function parseCsv(text: string): { name?: string; phone: string }[] {
  const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("name") || firstLine.includes("phone") || firstLine.includes("เบอร์");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      return { name: parts[0], phone: parts[1] };
    }
    // Single column = phone only
    return { phone: parts[0] };
  });
}
