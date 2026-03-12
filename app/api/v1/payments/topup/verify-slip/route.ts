import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { verifyTopupSlip } from "@/lib/actions/payments";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function readPayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("slip");
    if (!(file instanceof File)) {
      throw new ApiError(400, "กรุณาแนบไฟล์สลิป");
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ApiError(400, "รองรับเฉพาะ JPG, PNG, PDF");
    }

    return fileToBase64(file);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "กรุณาส่งข้อมูล JSON หรือ multipart/form-data");
  }

  const { payload } = body as { payload?: string };
  if (!payload || typeof payload !== "string") {
    throw new ApiError(400, "กรุณาแนบสลิปแบบ base64 ใน field 'payload'");
  }

  return payload;
}

// POST /api/v1/payments/topup/verify-slip — verify slip image
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "topup_verify");
    if (rl.blocked) return rl.blocked;

    const payload = await readPayload(req);
    const result = await verifyTopupSlip(session.id, payload);

    return apiResponse({
      ...result,
      slipId: result.transactionId,
      verified: Boolean(result.matchedPackage),
      status: result.matchedPackage ? "SUCCESS" : "PENDING_REVIEW",
      error: result.matchedPackage ? null : "package_not_matched",
    });
  } catch (error) {
    return apiError(error);
  }
}
