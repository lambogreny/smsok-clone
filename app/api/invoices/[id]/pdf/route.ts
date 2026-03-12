import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/invoices/:id/pdf — proxy to payment invoice PDF
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await params;
    const target = new URL(`/api/payments/${id}/invoice?download=1`, req.url);
    const response = await fetch(target, {
      headers: {
        cookie: req.headers.get("cookie") || "",
        accept: "application/pdf",
      },
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    return apiError(error);
  }
}
