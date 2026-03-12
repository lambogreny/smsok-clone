import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/invoices/:id/pdf — generate and download PDF
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { id } = await ctx.params;
    const target = new URL(`/api/invoices/${id}/pdf`, req.url);
    const response = await fetch(target, {
      headers: {
        cookie: req.headers.get("cookie") || "",
        accept: "application/pdf",
      },
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      headers: new Headers(response.headers),
    });
  } catch (error) {
    return apiError(error);
  }
}
