import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getAlerts, createAlert, updateAlert } from "@/lib/actions/admin-cto";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["DEV"]);
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");
    const severity = searchParams.get("severity");

    const options: { active?: boolean; severity?: string } = {};
    if (active !== null) options.active = active === "true";
    if (severity) options.severity = severity;

    const alerts = await getAlerts(options);
    return apiResponse(alerts);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["DEV"]);
    const body = await req.json();
    const alert = await createAlert(body);
    return apiResponse(alert, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["DEV"]);
    const body = await req.json();
    const { alertId, ...data } = body;

    if (!alertId) {
      return apiResponse({ error: "alertId is required" }, 400);
    }

    const alert = await updateAlert(alertId, data);
    return apiResponse(alert);
  } catch (error) {
    return apiError(error);
  }
}
