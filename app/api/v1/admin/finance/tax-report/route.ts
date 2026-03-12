import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { generateTaxReport, getTaxReports } from "@/lib/actions/admin-finance";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["FINANCE"]);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const reports = await getTaxReports(type);
    return apiResponse({ reports });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["FINANCE"]);
    const body = await req.json();
    const { type, period } = body;
    if (!type || !period) throw new Error("กรุณาระบุ type และ period");
    const report = await generateTaxReport(admin.id, type, period);
    return apiResponse(report, 201);
  } catch (error) {
    return apiError(error);
  }
}
