import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";

// GET /api/v1/credits — compatibility alias for the package-credit summary endpoint
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const target = new URL("/api/credits", req.url);
    const response = await fetch(target, {
      headers: {
        cookie: req.headers.get("cookie") || "",
        accept: "application/json",
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
