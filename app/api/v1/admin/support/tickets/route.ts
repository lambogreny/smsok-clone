import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getTickets, createTicket } from "@/lib/actions/admin-support";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const { searchParams } = new URL(req.url);
    const options = {
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      category: searchParams.get("category") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    };
    const tickets = await getTickets(options);
    return apiResponse(tickets);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const body = await req.json();
    const ticket = await createTicket(body);
    return apiResponse(ticket, 201);
  } catch (error) {
    return apiError(error);
  }
}
