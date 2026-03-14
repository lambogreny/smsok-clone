import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { exportContacts } from "@/lib/actions/contacts";
import { applyRateLimit } from "@/lib/rate-limit";
import { toCsvCell } from "@/lib/csv";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;

    const denied = await requireApiPermission(user.id, "read", "contact");
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const contacts = await exportContacts(user.id);

    if (format === "csv") {
      const header = "name,phone,email,tags,groups,createdAt";
      const rows = contacts.map(
        (c: typeof contacts[number]) => [c.name, c.phone, c.email, c.tags, c.groups, c.createdAt]
          .map(toCsvCell)
          .join(",")
      );
      // UTF-8 BOM (\uFEFF) for Excel to recognize Thai characters
      const csv = "\uFEFF" + [header, ...rows].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return apiResponse({ contacts, total: contacts.length });
  } catch (error) {
    return apiError(error);
  }
}
