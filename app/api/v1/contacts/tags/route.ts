import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/contacts/tags — list all tags for the user
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    });

    return apiResponse({ tags });
  } catch (error) {
    return apiError(error);
  }
}
