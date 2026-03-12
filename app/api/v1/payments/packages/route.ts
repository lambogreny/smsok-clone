import { apiResponse, apiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

export async function GET() {
  try {
    const packages = await db.packageTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return apiResponse({ packages });
  } catch (error) {
    return apiError(error);
  }
}
