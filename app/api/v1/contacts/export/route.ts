import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { exportContacts } from "@/lib/actions/contacts";

/** Escape a value for safe CSV output (prevents CSV injection + XSS) */
function escapeCsvField(value: unknown): string {
  const str = String(value ?? "");
  // Strip formula injection characters at start (=, +, -, @, \t, \r)
  const sanitized = str.replace(/^[=+\-@\t\r]+/, "");
  // Escape double quotes by doubling them, wrap in quotes
  return `"${sanitized.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const contacts = await exportContacts(user.id);

    if (format === "csv") {
      const header = "name,phone,email,tags,groups,createdAt";
      const rows = contacts.map(
        (c: typeof contacts[number]) => [c.name, c.phone, c.email, c.tags, c.groups, c.createdAt]
          .map(escapeCsvField)
          .join(",")
      );
      const csv = [header, ...rows].join("\n");

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
