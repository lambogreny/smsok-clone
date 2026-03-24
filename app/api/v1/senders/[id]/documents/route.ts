import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { resolveStoredFileUrl } from "@/lib/storage/files";
import { removeStoredFile, StorageUploadError, storeUploadedFile } from "@/lib/storage/service";
import { coerceUploadedFile } from "@/lib/uploaded-file";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const DOCUMENT_TYPES = [
  "company_certificate",    // หนังสือรับรองบริษัท
  "id_card",               // สำเนาบัตรประชาชน/พาสปอร์ต
  "power_of_attorney",     // หนังสือมอบอำนาจ
  "name_authorization",    // เอกสารยืนยันสิทธิ์ใช้ชื่อ
  "other",                 // อื่นๆ
] as const;

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"\/\\|?*]/g, "_")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 255) || "unnamed";
}

// POST /api/v1/senders/:id/documents — upload documents for sender name request
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;

    // Find sender name request — must be owned by user and in editable status
    const senderName = await db.senderName.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        _count: { select: { documents: true } },
      },
    });
    if (!senderName) throw new ApiError(404, "ไม่พบคำขอ Sender Name");
    if (senderName.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");
    if (!["DRAFT", "PENDING"].includes(senderName.status)) {
      throw new ApiError(400, "สถานะไม่อนุญาตให้อัปโหลดเอกสาร");
    }

    const formData = await req.formData();

    // Collect all files from formData
    const files: { file: NonNullable<ReturnType<typeof coerceUploadedFile>>; docType: string }[] = [];

    // Support "documents" field (multiple files) or "document" (single file)
    const entries = formData.getAll("documents");
    if (entries.length === 0) {
      const single = formData.get("document");
      if (single) entries.push(single);
    }

    for (const entry of entries) {
      const file = coerceUploadedFile(entry);
      if (!file) continue;
      files.push({ file, docType: "other" });
    }

    // Also support typed uploads: documents_company_certificate, documents_id_card, etc.
    for (const docType of DOCUMENT_TYPES) {
      const typedEntries = formData.getAll(`documents_${docType}`);
      for (const entry of typedEntries) {
        const file = coerceUploadedFile(entry);
        if (file) files.push({ file, docType });
      }
    }

    if (files.length === 0) throw new ApiError(400, "กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์");

    const totalDocs = senderName._count.documents + files.length;
    if (totalDocs > MAX_FILES) {
      throw new ApiError(400, `แนบเอกสารได้สูงสุด ${MAX_FILES} ไฟล์ (มีอยู่แล้ว ${senderName._count.documents} ไฟล์)`);
    }

    // Validate all files before uploading
    for (const { file } of files) {
      const safeName = sanitizeFileName(file.name);
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new ApiError(400, `ไฟล์ "${safeName}" รองรับเฉพาะ JPG, PNG, PDF`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new ApiError(400, `ไฟล์ "${safeName}" ต้องไม่เกิน 5MB`);
      }
    }

    // Upload all files to R2 and create DB records
    const uploadedDocs: { ref: string; fileName: string; fileSize: number; mimeType: string; docType: string }[] = [];
    const uploadedRefs: string[] = [];

    try {
      for (const { file, docType } of files) {
        const uploaded = await storeUploadedFile({
          userId: session.id,
          scope: "senders",
          resourceId: id,
          kind: "documents",
          file,
        });
        uploadedRefs.push(uploaded.ref);
        uploadedDocs.push({
          ref: uploaded.ref,
          fileName: sanitizeFileName(file.name),
          fileSize: file.size,
          mimeType: file.type,
          docType,
        });
      }

      // Create DB records in transaction
      const documents = await db.$transaction(
        uploadedDocs.map((doc) =>
          db.senderNameDocument.create({
            data: {
              senderNameId: id,
              type: doc.docType,
              fileName: doc.fileName,
              fileUrl: doc.ref,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
            },
            select: {
              id: true,
              type: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              createdAt: true,
            },
          }),
        ),
      );

      return apiResponse({
        senderNameId: id,
        documents: documents.map((doc: (typeof documents)[number], idx: number) => ({
          ...doc,
          fileUrl: resolveStoredFileUrl(uploadedDocs[idx]?.ref ?? null),
        })),
        total: totalDocs,
      }, 201);
    } catch (error) {
      // Cleanup uploaded files on DB failure
      await Promise.allSettled(uploadedRefs.map((ref) => removeStoredFile(ref)));
      throw error;
    }
  } catch (error) {
    if (error instanceof StorageUploadError) {
      return apiError(new ApiError(503, "ระบบอัปโหลดไฟล์ยังไม่พร้อม กรุณาลองใหม่"));
    }
    return apiError(error);
  }
}

// GET /api/v1/senders/:id/documents — list documents for a sender name
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;

    const senderName = await db.senderName.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!senderName) throw new ApiError(404, "ไม่พบคำขอ Sender Name");
    if (senderName.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");

    const documents = await db.senderNameDocument.findMany({
      where: { senderNameId: id },
      select: {
        id: true,
        type: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        verified: true,
        createdAt: true,
        fileUrl: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiResponse({
      senderNameId: id,
      documents: documents.map((doc: (typeof documents)[number]) => ({
        ...doc,
        fileUrl: resolveStoredFileUrl(doc.fileUrl),
      })),
      total: documents.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
