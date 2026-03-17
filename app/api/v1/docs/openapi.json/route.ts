import { NextRequest } from "next/server";
import { apiSensitiveError } from "@/lib/api-auth";
import { getAllowedOrigins } from "@/lib/csrf";
import { generateOpenAPISpec } from "@/lib/openapi-spec";

// GET /api/v1/docs/openapi.json — OpenAPI 3.0 spec as JSON
export async function GET(req: NextRequest) {
  try {
    const spec = generateOpenAPISpec();
    const origin = req.headers.get("origin");
    const headers = new Headers({
      "Cache-Control": "public, max-age=3600",
      Vary: "Origin",
    });

    if (origin && getAllowedOrigins().includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }

    return Response.json(spec, { headers });
  } catch (error) {
    return apiSensitiveError(error);
  }
}
