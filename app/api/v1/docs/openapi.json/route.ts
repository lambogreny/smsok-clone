import { generateOpenAPISpec } from "@/lib/openapi-spec";

// GET /api/v1/docs/openapi.json — OpenAPI 3.0 spec as JSON
export async function GET() {
  const spec = generateOpenAPISpec();
  return Response.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
