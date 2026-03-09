import { apiResponse } from "@/lib/api-auth";

// GET /api/v1/docs — OpenAPI 3.0 spec
export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "SMSOK API",
      version: "1.0.0",
      description: "SMS sending platform API — send SMS, manage contacts, templates, OTP, and more.",
    },
    servers: [
      { url: "/api/v1", description: "API v1" },
    ],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "API key (sk_live_xxx or sk_test_xxx)",
        },
      },
    },
    paths: {
      // === SMS ===
      "/sms/send": {
        post: {
          tags: ["SMS"],
          summary: "Send single SMS",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["to", "message"],
              properties: {
                to: { type: "string", example: "0891234567", description: "Thai phone number" },
                message: { type: "string", example: "Hello!" },
                sender: { type: "string", default: "EasySlip", description: "Approved sender name" },
              },
            }}},
          },
          responses: {
            "201": { description: "SMS sent — returns message id, status, credits used" },
            "401": { description: "Invalid API key" },
            "429": { description: "Rate limited (10/min)" },
          },
        },
      },
      "/sms/batch": {
        post: {
          tags: ["SMS"],
          summary: "Send batch SMS (up to 1000 recipients)",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["to", "message"],
              properties: {
                to: { type: "array", items: { type: "string" }, description: "Array of phone numbers" },
                message: { type: "string" },
                sender: { type: "string", default: "EasySlip" },
              },
            }}},
          },
          responses: {
            "201": { description: "Batch sent — returns total messages, credits used" },
            "429": { description: "Rate limited (5/min)" },
          },
        },
      },
      "/sms/status": {
        get: {
          tags: ["SMS"],
          summary: "Get message status",
          parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Message details with delivery status" } },
        },
      },
      "/sms/scheduled": {
        get: {
          tags: ["SMS"],
          summary: "List scheduled messages",
          responses: { "200": { description: "Array of scheduled SMS" } },
        },
        post: {
          tags: ["SMS"],
          summary: "Schedule SMS or cancel scheduled",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              properties: {
                to: { type: "string" },
                message: { type: "string" },
                scheduledAt: { type: "string", format: "date-time" },
                sender: { type: "string", default: "EasySlip" },
                action: { type: "string", enum: ["cancel"], description: "Set to 'cancel' to cancel" },
                id: { type: "string", description: "Required when action=cancel" },
              },
            }}},
          },
          responses: {
            "201": { description: "Scheduled — credits held" },
            "200": { description: "Cancelled — credits refunded" },
          },
        },
      },

      // === OTP ===
      "/otp/send": {
        post: {
          tags: ["OTP"],
          summary: "Send OTP via SMS",
          description: "Generate 6-digit OTP and send via SMS. Rate limit: 3 req/5min per phone+IP. TTL: 5 min. Max 5 verify attempts then 15-min lockout.",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["phone"],
              properties: {
                phone: { type: "string", example: "0891234567" },
                purpose: { type: "string", enum: ["verify", "login", "transaction"], default: "verify" },
              },
            }}},
          },
          responses: {
            "201": { description: "OTP sent — returns id, expiresAt, creditUsed" },
            "429": { description: "Rate limited (3 per 5 min)" },
          },
        },
      },
      "/otp/generate": {
        post: {
          tags: ["OTP"],
          summary: "Generate and send OTP via SMS (alias for /otp/send)",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["phone"],
              properties: {
                phone: { type: "string", example: "0891234567" },
                purpose: { type: "string", enum: ["verify", "login", "transaction"], default: "verify" },
              },
            }}},
          },
          responses: {
            "201": { description: "OTP sent — returns id, expiresAt" },
            "429": { description: "Rate limited (3 per 5 min)" },
          },
        },
      },
      "/otp/verify": {
        post: {
          tags: ["OTP"],
          summary: "Verify OTP code",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["phone", "code"],
              properties: {
                phone: { type: "string" },
                code: { type: "string", example: "123456" },
              },
            }}},
          },
          responses: {
            "200": { description: "{ verified: true, phone, purpose }" },
            "400": { description: "Invalid or expired OTP" },
            "429": { description: "Rate limited (10/15min)" },
          },
        },
      },

      // === Credits ===
      "/credits": {
        get: {
          tags: ["Account"],
          summary: "Check credit balance",
          responses: { "200": { description: "{ credits, userId }" } },
        },
      },
      "/account": {
        get: {
          tags: ["Account"],
          summary: "Get profile",
          responses: { "200": { description: "User profile with credits, role" } },
        },
        put: {
          tags: ["Account"],
          summary: "Update profile or change password",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                currentPassword: { type: "string", description: "Include to change password" },
                newPassword: { type: "string" },
              },
            }}},
          },
          responses: { "200": { description: "Updated profile" } },
        },
      },

      // === Contacts ===
      "/contacts": {
        get: {
          tags: ["Contacts"],
          summary: "List contacts (paginated)",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          ],
          responses: { "200": { description: "Contacts array with pagination" } },
        },
        post: {
          tags: ["Contacts"],
          summary: "Create contact",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["name", "phone"],
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                tags: { type: "string" },
              },
            }}},
          },
          responses: { "201": { description: "Created contact" } },
        },
      },
      "/contacts/{id}": {
        put: {
          tags: ["Contacts"],
          summary: "Update contact",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Updated contact" } },
        },
        delete: {
          tags: ["Contacts"],
          summary: "Delete contact",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "{ success: true }" } },
        },
      },
      "/contacts/import": {
        post: {
          tags: ["Contacts"],
          summary: "Bulk import contacts",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["contacts"],
              properties: {
                contacts: { type: "array", items: {
                  type: "object",
                  properties: { name: { type: "string" }, phone: { type: "string" }, email: { type: "string" } },
                }},
              },
            }}},
          },
          responses: { "201": { description: "Import result" } },
        },
      },
      "/contacts/export": {
        get: {
          tags: ["Contacts"],
          summary: "Export contacts (JSON or CSV)",
          parameters: [{ name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"], default: "json" } }],
          responses: { "200": { description: "Contacts data" } },
        },
      },

      // === Templates ===
      "/templates": {
        get: { tags: ["Templates"], summary: "List templates", responses: { "200": { description: "Templates array" } } },
        post: {
          tags: ["Templates"],
          summary: "Create template (supports {variable} syntax)",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["name", "content"],
              properties: {
                name: { type: "string" },
                content: { type: "string", example: "Hello {name}, your code is {code}" },
                category: { type: "string", default: "general" },
              },
            }}},
          },
          responses: { "201": { description: "Created template" } },
        },
      },
      "/templates/{id}": {
        put: { tags: ["Templates"], summary: "Update template", responses: { "200": { description: "Updated" } } },
        delete: { tags: ["Templates"], summary: "Delete template", responses: { "200": { description: "{ success: true }" } } },
      },
      "/templates/render": {
        post: {
          tags: ["Templates"],
          summary: "Render template with variable substitution",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              properties: {
                templateId: { type: "string", description: "Use saved template" },
                content: { type: "string", description: "Or inline template string" },
                variables: { type: "object", example: { name: "John", code: "1234" } },
              },
            }}},
          },
          responses: { "200": { description: "{ rendered, variables, missing, charCount, smsCount }" } },
        },
      },

      // === Analytics ===
      "/analytics": {
        get: {
          tags: ["Analytics"],
          summary: "Send stats, success rate, daily breakdown",
          parameters: [{ name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month", "all"], default: "month" } }],
          responses: { "200": { description: "Analytics with summary + daily breakdown" } },
        },
      },

      // === Other ===
      "/packages": {
        get: { tags: ["Billing"], summary: "List available packages (public)", security: [], responses: { "200": { description: "Packages array" } } },
      },
      "/topup": {
        post: { tags: ["Billing"], summary: "Purchase package", responses: { "201": { description: "Transaction created" } } },
      },
      "/transactions": {
        get: { tags: ["Billing"], summary: "List transactions", responses: { "200": { description: "Transactions array" } } },
      },
      "/api-keys": {
        get: { tags: ["API Keys"], summary: "List API keys (masked)", responses: { "200": { description: "API keys array" } } },
        post: { tags: ["API Keys"], summary: "Create new API key (max 5)", responses: { "201": { description: "New key (shown once)" } } },
      },
      "/api-keys/{id}": {
        patch: { tags: ["API Keys"], summary: "Toggle API key active/inactive", responses: { "200": { description: "Updated key" } } },
        delete: { tags: ["API Keys"], summary: "Delete API key", responses: { "200": { description: "{ success: true }" } } },
      },
      "/senders/request": {
        get: { tags: ["Sender Names"], summary: "List sender names", responses: { "200": { description: "Sender names array" } } },
        post: {
          tags: ["Sender Names"],
          summary: "Request new sender name",
          requestBody: {
            content: { "application/json": { schema: {
              type: "object",
              required: ["name"],
              properties: { name: { type: "string", example: "MyBrand", description: "Alphanumeric, max 11 chars" } },
            }}},
          },
          responses: { "201": { description: "Request submitted" } },
        },
      },
    },
  };

  return apiResponse(spec);
}
