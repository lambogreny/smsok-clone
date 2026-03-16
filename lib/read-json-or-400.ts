import { ApiError } from "@/lib/api-auth";

export async function readJsonOr400<T = unknown>(
  req: Request,
  invalidJsonMessage = "รูปแบบ JSON ไม่ถูกต้อง",
): Promise<T> {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(400, "Content-Type must be application/json");
  }

  try {
    return await req.json() as T;
  } catch {
    throw new ApiError(400, invalidJsonMessage);
  }
}
