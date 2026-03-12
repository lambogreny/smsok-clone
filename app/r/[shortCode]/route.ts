import { NextRequest } from "next/server";
import { resolveShortLink } from "@/lib/link-shortener";

// GET /r/:shortCode — redirect to original URL + track click
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  const { shortCode } = await params;

  const originalUrl = await resolveShortLink(shortCode, {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined,
    userAgent: req.headers.get("user-agent") || undefined,
    referer: req.headers.get("referer") || undefined,
  });

  if (!originalUrl) {
    return new Response("Link not found or expired", { status: 404 });
  }

  return Response.redirect(originalUrl, 302);
}
