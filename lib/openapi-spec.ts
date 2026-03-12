/**
 * OpenAPI 3.0.3 Spec Generator for SMSOK API
 *
 * Static specification covering all v1 endpoints.
 * Served at GET /api/v1/docs/openapi.json
 */

export function generateOpenAPISpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "SMSOK API",
      description:
        "SMS Marketing Platform API — send SMS, manage contacts, templates, OTP, campaigns, and more.",
      version: "1.0.0",
      contact: { email: "support@smsok.io" },
    },
    servers: [
      { url: "http://localhost:3000/api/v1", description: "Development" },
      { url: "/api/v1", description: "Relative" },
    ],
    tags: [
      { name: "Auth", description: "Authentication & registration" },
      { name: "Account", description: "User profile & SMS quota" },
      { name: "SMS", description: "Send single, batch, and scheduled SMS" },
      { name: "OTP", description: "One-time password generation & verification" },
      { name: "Contacts", description: "Contact management & import/export" },
      { name: "Groups", description: "Contact groups & membership" },
      { name: "Tags", description: "Contact tagging" },
      { name: "Templates", description: "Message templates with variable substitution" },
      { name: "Campaigns", description: "Marketing campaigns" },
      { name: "Analytics", description: "Sending statistics & reports" },
      { name: "Logs", description: "Message logs & delivery reports" },
      { name: "Billing", description: "Packages & transactions" },
      { name: "API Keys", description: "API key management" },
      { name: "Sender Names", description: "Sender name requests & approval" },
      { name: "Webhooks", description: "Webhook endpoints for event notifications" },
      { name: "Settings", description: "Profile, workspace, 2FA, notifications" },
      { name: "Organizations", description: "Multi-tenant organization management" },
      { name: "PDPA", description: "PDPA compliance — consent, opt-out, data requests" },
      { name: "Onboarding", description: "User onboarding flow" },
      { name: "Custom Fields", description: "Custom contact fields" },
      { name: "Admin - Auth", description: "Admin authentication" },
      { name: "Admin - Ops", description: "Operations dashboard" },
      { name: "Admin - Finance", description: "Finance & revenue metrics" },
      { name: "Admin - Support", description: "Customer support tools" },
      { name: "Admin - CEO", description: "CEO executive dashboard" },
      { name: "Admin - CTO", description: "CTO technical dashboard" },
      { name: "Admin - Marketing", description: "Marketing analytics" },
    ],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "User JWT token or API key (sk_live_xxx)",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Alternative: pass API key via X-API-Key header",
        },
        AdminAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Admin JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Unauthorized" },
          },
          required: ["error"],
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                total: { type: "integer", example: 100 },
                totalPages: { type: "integer", example: 5 },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            phone: { type: "string" },
            credits: { type: "integer" },
            role: { type: "string", enum: ["USER", "ADMIN"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: { type: "string" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            to: { type: "string", example: "0891234567" },
            message: { type: "string" },
            status: { type: "string", enum: ["pending", "sent", "delivered", "failed"] },
            sender: { type: "string" },
            creditUsed: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Contact: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            tags: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ContactGroup: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            memberCount: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Tag: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            color: { type: "string", example: "#94A3B8" },
          },
        },
        Template: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            content: { type: "string" },
            category: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Campaign: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            status: { type: "string", enum: ["draft", "scheduled", "sending", "completed", "failed"] },
            contactGroupId: { type: "string" },
            templateId: { type: "string" },
            senderName: { type: "string" },
            scheduledAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Package: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            credits: { type: "integer" },
            price: { type: "number" },
            popular: { type: "boolean" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            amount: { type: "number" },
            credits: { type: "integer" },
            status: { type: "string", enum: ["pending", "verified", "rejected"] },
            method: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            keyMasked: { type: "string", example: "sk_live_****abcd" },
            active: { type: "boolean" },
            lastUsedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SenderName: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string", example: "MyBrand" },
            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Webhook: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            url: { type: "string", format: "uri" },
            events: {
              type: "array",
              items: { type: "string", enum: ["sms.sent", "sms.delivered", "sms.failed", "otp.verified", "credit.low"] },
            },
            active: { type: "boolean" },
            secret: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Organization: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            ownerId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CustomField: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            name: { type: "string" },
            type: { type: "string", enum: ["text", "number", "date", "boolean"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
      parameters: {
        PageParam: {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1, minimum: 1 },
        },
        LimitParam: {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        },
        IdPath: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      },
      responses: {
        BadRequest: {
          description: "Validation error",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        Unauthorized: {
          description: "Missing or invalid authentication",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        NotFound: {
          description: "Resource not found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        ServerError: {
          description: "Internal server error",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
      },
    },

    paths: {
      // ===================== AUTH =====================
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register new account",
          description: "Create a new user account with email, password, and name.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["firstName", "lastName", "email", "password"],
                  properties: {
                    firstName: { type: "string", example: "John" },
                    lastName: { type: "string", example: "Doe" },
                    email: { type: "string", format: "email", example: "john@example.com" },
                    phone: { type: "string", example: "0891234567" },
                    password: { type: "string", minLength: 8, example: "StrongP@ss1" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Account created",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "500": { $ref: "#/components/responses/ServerError" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description: "Authenticate with email and password. Returns JWT token.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone"],
                  properties: {
                    phone: { type: "string", example: "0891234567" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Reset link sent (if account exists)" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password with token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token", "newPassword"],
                  properties: {
                    token: { type: "string" },
                    newPassword: { type: "string", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Password reset successful" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/auth/2fa/verify": {
        post: {
          tags: ["Auth"],
          summary: "Verify 2FA code during login",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["challengeToken", "code"],
                  properties: {
                    challengeToken: { type: "string" },
                    code: { type: "string", pattern: "^\\d{6}$" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "2FA verified, returns token" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/auth/2fa/recovery": {
        post: {
          tags: ["Auth"],
          summary: "Use recovery code for 2FA",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["challengeToken", "recoveryCode"],
                  properties: {
                    challengeToken: { type: "string" },
                    recoveryCode: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Recovery successful, returns token" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },

      // ===================== SMS =====================
      "/sms/send": {
        post: {
          tags: ["SMS"],
          summary: "Send single SMS",
          description: "Send an SMS to a single Thai phone number. Costs 1 SMS per 70 Thai chars or 160 English chars.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["to", "message"],
                  properties: {
                    to: { type: "string", example: "0891234567", description: "Thai phone number" },
                    message: { type: "string", example: "Hello!", maxLength: 1000 },
                    sender: { type: "string", default: "EasySlip", description: "Approved sender name (max 11 chars)" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "SMS sent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      status: { type: "string" },
                      creditUsed: { type: "integer" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "429": { description: "Rate limited (10/min)" },
            "500": { $ref: "#/components/responses/ServerError" },
          },
        },
      },
      "/sms/batch": {
        post: {
          tags: ["SMS"],
          summary: "Send batch SMS",
          description: "Send SMS to multiple recipients (up to 10,000). Each recipient costs credits independently.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["to", "message"],
                  properties: {
                    to: { type: "array", items: { type: "string" }, description: "Array of phone numbers (max 10,000)", maxItems: 10000 },
                    message: { type: "string", maxLength: 1000 },
                    sender: { type: "string", default: "EasySlip" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Batch sent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalMessages: { type: "integer" },
                      creditUsed: { type: "integer" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "429": { description: "Rate limited (5/min)" },
          },
        },
      },
      "/sms/status": {
        get: {
          tags: ["SMS"],
          summary: "Get message delivery status",
          parameters: [
            { name: "id", in: "query", required: true, schema: { type: "string" }, description: "Message ID" },
          ],
          responses: {
            "200": {
              description: "Message details with delivery status",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/sms/scheduled": {
        get: {
          tags: ["SMS"],
          summary: "List scheduled messages",
          responses: {
            "200": {
              description: "Array of scheduled SMS",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Message" } },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          tags: ["SMS"],
          summary: "Schedule SMS or cancel scheduled",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    to: { type: "string" },
                    message: { type: "string" },
                    scheduledAt: { type: "string", format: "date-time" },
                    sender: { type: "string", default: "EasySlip" },
                    action: { type: "string", enum: ["cancel"], description: "Set to 'cancel' to cancel a scheduled SMS" },
                    id: { type: "string", description: "Required when action=cancel" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Scheduled -- credits held" },
            "200": { description: "Cancelled -- credits refunded" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },

      // ===================== OTP =====================
      "/otp/send": {
        post: {
          tags: ["OTP"],
          summary: "Send OTP via SMS",
          description: "Generate 6-digit OTP and send via SMS. Rate limit: 3 req/5min per phone.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone"],
                  properties: {
                    phone: { type: "string", example: "0891234567" },
                    purpose: { type: "string", enum: ["verify", "login", "transaction"], default: "verify" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "OTP sent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ref: { type: "string", example: "ABC123EF" },
                      expiresAt: { type: "string", format: "date-time" },
                      creditUsed: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "429": { description: "Rate limited (3 per 5 min)" },
          },
        },
      },
      "/otp/generate": {
        post: {
          tags: ["OTP"],
          summary: "Generate and send OTP (alias for /otp/send)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone"],
                  properties: {
                    phone: { type: "string", example: "0891234567" },
                    purpose: { type: "string", enum: ["verify", "login", "transaction"], default: "verify" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "OTP sent" },
            "429": { description: "Rate limited (3 per 5 min)" },
          },
        },
      },
      "/otp/verify": {
        post: {
          tags: ["OTP"],
          summary: "Verify OTP code",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ref", "code"],
                  properties: {
                    ref: { type: "string", example: "ABC123EF" },
                    code: { type: "string", pattern: "^\\d{6}$", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Verification result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      valid: { type: "boolean" },
                      verified: { type: "boolean" },
                      ref: { type: "string" },
                      phone: { type: "string" },
                      purpose: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "429": { description: "Rate limited (10/15min)" },
          },
        },
      },

      // ===================== ACCOUNT / CREDITS =====================
      "/credits": {
        get: {
          tags: ["Account"],
          summary: "Check SMS quota",
          responses: {
            "200": {
              description: "SMS quota",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      credits: { type: "integer" },
                      userId: { type: "string" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/account": {
        get: {
          tags: ["Account"],
          summary: "Get user profile",
          responses: {
            "200": {
              description: "User profile",
              content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        put: {
          tags: ["Account"],
          summary: "Update profile or change password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    currentPassword: { type: "string", description: "Include to change password" },
                    newPassword: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated profile" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/balance": {
        get: {
          tags: ["Account"],
          summary: "Get remaining SMS quota details",
          responses: {
            "200": { description: "Remaining SMS quota information" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },

      // ===================== CONTACTS =====================
      "/contacts": {
        get: {
          tags: ["Contacts"],
          summary: "List contacts (paginated)",
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { name: "tagId", in: "query", schema: { type: "string" }, description: "Filter by tag ID" },
          ],
          responses: {
            "200": {
              description: "Contacts with pagination",
              content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          tags: ["Contacts"],
          summary: "Create contact",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "phone"],
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string", format: "email" },
                    tags: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Contact created",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Contact" } } },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/contacts/{id}": {
        get: {
          tags: ["Contacts"],
          summary: "Get contact by ID",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: {
            "200": { description: "Contact details", content: { "application/json": { schema: { $ref: "#/components/schemas/Contact" } } } },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Contacts"],
          summary: "Update contact",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string" },
                    tags: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated contact" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Contacts"],
          summary: "Delete contact",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: {
            "200": { description: "Contact deleted" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/contacts/{id}/tags": {
        post: {
          tags: ["Contacts"],
          summary: "Assign tag to contact",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tagId"],
                  properties: { tagId: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Tag assigned" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
        delete: {
          tags: ["Contacts"],
          summary: "Remove tag from contact",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Tag removed" } },
        },
      },
      "/contacts/{id}/activity": {
        get: {
          tags: ["Contacts"],
          summary: "Get contact activity history",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Activity log for contact" } },
        },
      },
      "/contacts/{id}/custom-fields": {
        get: {
          tags: ["Contacts"],
          summary: "Get custom field values for contact",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Custom field values" } },
        },
        put: {
          tags: ["Contacts"],
          summary: "Update custom field values for contact",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Updated custom fields" } },
        },
      },
      "/contacts/import": {
        post: {
          tags: ["Contacts"],
          summary: "Bulk import contacts",
          description: "Import up to 10,000 contacts at once.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["contacts"],
                  properties: {
                    contacts: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["name", "phone"],
                        properties: {
                          name: { type: "string" },
                          phone: { type: "string" },
                          email: { type: "string" },
                        },
                      },
                      maxItems: 10000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Import result with success/failure counts" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/contacts/export": {
        get: {
          tags: ["Contacts"],
          summary: "Export contacts (JSON or CSV)",
          parameters: [
            { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"], default: "json" } },
          ],
          responses: { "200": { description: "Contacts data in requested format" } },
        },
      },
      "/contacts/template": {
        get: {
          tags: ["Contacts"],
          summary: "Download import template",
          responses: { "200": { description: "CSV template for contact import" } },
        },
      },
      "/contacts/bulk": {
        post: {
          tags: ["Contacts"],
          summary: "Bulk operations on contacts",
          responses: { "200": { description: "Bulk operation result" } },
        },
      },
      "/contacts/bulk/add-to-group": {
        post: {
          tags: ["Contacts"],
          summary: "Bulk add contacts to group",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["groupId", "contactIds"],
                  properties: {
                    groupId: { type: "string" },
                    contactIds: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Contacts added to group" } },
        },
      },
      "/contacts/bulk/move-group": {
        post: {
          tags: ["Contacts"],
          summary: "Bulk move contacts between groups",
          responses: { "200": { description: "Contacts moved" } },
        },
      },

      // ===================== GROUPS =====================
      "/contacts/groups": {
        get: {
          tags: ["Groups"],
          summary: "List contact groups",
          responses: {
            "200": {
              description: "Groups array",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/ContactGroup" } },
                },
              },
            },
          },
        },
        post: {
          tags: ["Groups"],
          summary: "Create contact group",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: { name: { type: "string" } },
                },
              },
            },
          },
          responses: { "201": { description: "Group created" } },
        },
      },
      "/groups/{id}": {
        get: {
          tags: ["Groups"],
          summary: "Get group details",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Group details" } },
        },
        put: {
          tags: ["Groups"],
          summary: "Update group",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Group updated" } },
        },
        delete: {
          tags: ["Groups"],
          summary: "Delete group",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Group deleted" } },
        },
      },
      "/groups/{id}/members": {
        get: {
          tags: ["Groups"],
          summary: "List group members",
          parameters: [
            { $ref: "#/components/parameters/IdPath" },
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
          ],
          responses: { "200": { description: "Group members with pagination" } },
        },
        post: {
          tags: ["Groups"],
          summary: "Add members to group",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["contactIds"],
                  properties: { contactIds: { type: "array", items: { type: "string" } } },
                },
              },
            },
          },
          responses: { "200": { description: "Members added" } },
        },
      },
      "/groups/{id}/members/bulk-remove": {
        post: {
          tags: ["Groups"],
          summary: "Bulk remove members from group",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Members removed" } },
        },
      },
      "/groups/{id}/available-contacts": {
        get: {
          tags: ["Groups"],
          summary: "List contacts not in this group",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Available contacts" } },
        },
      },
      "/groups/{id}/import": {
        post: {
          tags: ["Groups"],
          summary: "Import contacts directly into group",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "201": { description: "Contacts imported into group" } },
        },
      },

      // ===================== TAGS =====================
      "/contacts/tags": {
        get: {
          tags: ["Tags"],
          summary: "List all tags",
          responses: {
            "200": {
              description: "Tags array",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Tag" } } } },
            },
          },
        },
      },
      "/tags": {
        get: {
          tags: ["Tags"],
          summary: "List tags with usage counts",
          responses: { "200": { description: "Tags with counts" } },
        },
        post: {
          tags: ["Tags"],
          summary: "Create tag",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", maxLength: 50 },
                    color: { type: "string", example: "#94A3B8", pattern: "^#[0-9A-Fa-f]{6}$" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Tag created" } },
        },
      },
      "/tags/{id}": {
        put: {
          tags: ["Tags"],
          summary: "Update tag",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Tag updated" } },
        },
        delete: {
          tags: ["Tags"],
          summary: "Delete tag",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Tag deleted" } },
        },
      },

      // ===================== TEMPLATES =====================
      "/templates": {
        get: {
          tags: ["Templates"],
          summary: "List templates",
          responses: {
            "200": {
              description: "Templates array",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Template" } } } },
            },
          },
        },
        post: {
          tags: ["Templates"],
          summary: "Create template",
          description: "Create message template with {variable} syntax for personalization.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "content"],
                  properties: {
                    name: { type: "string" },
                    content: { type: "string", example: "Hello {name}, your code is {code}" },
                    category: { type: "string", default: "general" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Template created" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/templates/{id}": {
        put: {
          tags: ["Templates"],
          summary: "Update template",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Template updated" } },
        },
        delete: {
          tags: ["Templates"],
          summary: "Delete template",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Template deleted" } },
        },
      },
      "/templates/render": {
        post: {
          tags: ["Templates"],
          summary: "Render template with variables",
          description: "Substitute variables in template and return rendered text with char/SMS count.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    templateId: { type: "string", description: "Use saved template" },
                    content: { type: "string", description: "Or provide inline template" },
                    variables: { type: "object", additionalProperties: { type: "string" }, example: { name: "John", code: "1234" } },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Rendered template",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      rendered: { type: "string" },
                      variables: { type: "array", items: { type: "string" } },
                      missing: { type: "array", items: { type: "string" } },
                      charCount: { type: "integer" },
                      smsCount: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ===================== CAMPAIGNS =====================
      "/campaigns": {
        get: {
          tags: ["Campaigns"],
          summary: "List campaigns",
          responses: {
            "200": {
              description: "Campaigns array",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Campaign" } } } },
            },
          },
        },
        post: {
          tags: ["Campaigns"],
          summary: "Create campaign",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    contactGroupId: { type: "string" },
                    templateId: { type: "string" },
                    senderName: { type: "string", maxLength: 11 },
                    scheduledAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Campaign created" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/campaigns/{id}/send": {
        post: {
          tags: ["Campaigns"],
          summary: "Send campaign immediately",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: {
            "200": { description: "Campaign sending started" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ===================== ANALYTICS =====================
      "/analytics": {
        get: {
          tags: ["Analytics"],
          summary: "Get sending statistics",
          description: "Send stats, success rate, daily breakdown.",
          parameters: [
            { name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month", "all"], default: "month" } },
          ],
          responses: { "200": { description: "Analytics with summary and daily breakdown" } },
        },
      },

      // ===================== LOGS =====================
      "/logs": {
        get: {
          tags: ["Logs"],
          summary: "List message logs (paginated, filterable)",
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { name: "status", in: "query", schema: { type: "string", enum: ["pending", "sent", "delivered", "failed"] } },
            { name: "type", in: "query", schema: { type: "string", enum: ["SMS", "OTP"] } },
            { name: "channel", in: "query", schema: { type: "string", enum: ["WEB", "API"] } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          ],
          responses: {
            "200": { description: "Message logs with pagination" },
          },
        },
      },
      "/logs/{id}": {
        get: {
          tags: ["Logs"],
          summary: "Get single log entry details",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Log entry details" } },
        },
      },
      "/logs/export": {
        get: {
          tags: ["Logs"],
          summary: "Export logs (CSV or JSON)",
          parameters: [
            { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"], default: "json" } },
          ],
          responses: { "200": { description: "Exported log data" } },
        },
      },
      "/messages": {
        get: {
          tags: ["Logs"],
          summary: "List sent messages",
          responses: { "200": { description: "Messages array" } },
        },
      },

      // ===================== BILLING =====================
      "/packages": {
        get: {
          tags: ["Billing"],
          summary: "List available packages (public)",
          security: [],
          responses: {
            "200": {
              description: "Available SMS packages",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Package" } },
                },
              },
            },
          },
        },
      },
      "/packages/purchase": {
        post: {
          tags: ["Billing"],
          summary: "Purchase SMS package",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["packageId", "method"],
                  properties: {
                    packageId: { type: "string" },
                    method: { type: "string", enum: ["bank_transfer", "promptpay"] },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Transaction created",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Transaction" } } },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/packages/purchase/verify-slip": {
        post: {
          tags: ["Billing"],
          summary: "Upload package-purchase slip for verification",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["transactionId", "slipUrl"],
                  properties: {
                    transactionId: { type: "string" },
                    slipUrl: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Slip uploaded for verification" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/transactions": {
        get: {
          tags: ["Billing"],
          summary: "List payment transactions",
          responses: {
            "200": {
              description: "Transactions array",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Transaction" } },
                },
              },
            },
          },
        },
      },
      "/packages/auto-topup": {
        get: {
          tags: ["Billing"],
          deprecated: true,
          summary: "Get auto-purchase settings (deprecated)",
          responses: { "200": { description: "Auto-purchase configuration (deprecated)" } },
        },
        put: {
          tags: ["Billing"],
          deprecated: true,
          summary: "Update auto-purchase settings (deprecated)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["enabled", "threshold", "packageId"],
                  properties: {
                    enabled: { type: "boolean" },
                    threshold: { type: "integer", minimum: 0 },
                    packageId: { type: "string" },
                    maxPerMonth: { type: "integer", minimum: 1, maximum: 50, default: 5 },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Auto purchase settings updated (deprecated)" } },
        },
      },

      // ===================== API KEYS =====================
      "/api-keys": {
        get: {
          tags: ["API Keys"],
          summary: "List API keys (masked)",
          responses: {
            "200": {
              description: "API keys array",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ApiKey" } } } },
            },
          },
        },
        post: {
          tags: ["API Keys"],
          summary: "Create new API key (max 5)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: { name: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "New key created (full key shown once)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      key: { type: "string", description: "Full key — only shown once" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api-keys/{id}": {
        patch: {
          tags: ["API Keys"],
          summary: "Toggle API key active/inactive",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Key status toggled" } },
        },
        delete: {
          tags: ["API Keys"],
          summary: "Delete API key",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Key deleted" } },
        },
      },

      // ===================== SENDER NAMES =====================
      "/senders": {
        get: {
          tags: ["Sender Names"],
          summary: "List approved sender names",
          responses: {
            "200": {
              description: "Sender names",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/SenderName" } } } },
            },
          },
        },
      },
      "/senders/request": {
        get: {
          tags: ["Sender Names"],
          summary: "List sender name requests",
          responses: { "200": { description: "Sender name requests" } },
        },
        post: {
          tags: ["Sender Names"],
          summary: "Request new sender name",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "MyBrand", description: "Alphanumeric, 3-11 chars" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Request submitted for approval" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },

      // ===================== WEBHOOKS =====================
      "/webhooks": {
        get: {
          tags: ["Webhooks"],
          summary: "List webhooks",
          responses: {
            "200": {
              description: "Webhooks array",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Webhook" } } } },
            },
          },
        },
        post: {
          tags: ["Webhooks"],
          summary: "Create webhook",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["url", "events"],
                  properties: {
                    url: { type: "string", format: "uri" },
                    events: {
                      type: "array",
                      items: { type: "string", enum: ["sms.sent", "sms.delivered", "sms.failed", "otp.verified", "credit.low"] },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Webhook created with secret" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/webhooks/{id}": {
        get: {
          tags: ["Webhooks"],
          summary: "Get webhook details",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Webhook details" } },
        },
        patch: {
          tags: ["Webhooks"],
          summary: "Update webhook",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string", format: "uri" },
                    events: { type: "array", items: { type: "string" } },
                    active: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Webhook updated" } },
        },
        delete: {
          tags: ["Webhooks"],
          summary: "Delete webhook",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Webhook deleted" } },
        },
      },
      "/webhooks/{id}/logs": {
        get: {
          tags: ["Webhooks"],
          summary: "Get webhook delivery logs",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Webhook delivery logs" } },
        },
      },
      "/webhooks/{id}/test": {
        post: {
          tags: ["Webhooks"],
          summary: "Send a test webhook delivery",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Test delivery result" } },
        },
      },
      "/webhooks/{id}/rotate-secret": {
        post: {
          tags: ["Webhooks"],
          summary: "Rotate webhook signing secret",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "New secret generated" } },
        },
      },
      "/webhooks/stop": {
        post: {
          tags: ["Webhooks"],
          summary: "Stop/unsubscribe webhook events",
          responses: { "200": { description: "Webhook stopped" } },
        },
      },

      // ===================== SETTINGS =====================
      "/settings/profile": {
        get: {
          tags: ["Settings"],
          summary: "Get profile settings",
          responses: { "200": { description: "Profile settings" } },
        },
        put: {
          tags: ["Settings"],
          summary: "Update profile settings",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { name: { type: "string" } },
                },
              },
            },
          },
          responses: { "200": { description: "Profile updated" } },
        },
      },
      "/settings/password": {
        put: {
          tags: ["Settings"],
          summary: "Change password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["currentPassword", "newPassword", "confirmPassword"],
                  properties: {
                    currentPassword: { type: "string" },
                    newPassword: { type: "string", minLength: 8 },
                    confirmPassword: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Password changed" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/settings/workspace": {
        get: {
          tags: ["Settings"],
          summary: "Get workspace settings",
          responses: { "200": { description: "Workspace settings (name, timezone, language)" } },
        },
        put: {
          tags: ["Settings"],
          summary: "Update workspace settings",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    timezone: { type: "string" },
                    language: { type: "string", enum: ["th", "en"] },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Workspace updated" } },
        },
      },
      "/settings/2fa": {
        get: {
          tags: ["Settings"],
          summary: "Get 2FA status and setup info",
          responses: { "200": { description: "2FA status" } },
        },
      },
      "/settings/2fa/enable": {
        post: {
          tags: ["Settings"],
          summary: "Generate 2FA secret, QR code, and initial backup codes",
          responses: { "200": { description: "2FA setup generated" } },
        },
      },
      "/settings/2fa/verify": {
        post: {
          tags: ["Settings"],
          summary: "Verify TOTP to enable 2FA or regenerate backup codes",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["code"],
                  properties: { code: { type: "string", pattern: "^\\d{6}$" } },
                },
              },
            },
          },
          responses: { "200": { description: "2FA enabled or backup codes regenerated" } },
        },
      },
      "/settings/2fa/regenerate-codes": {
        post: {
          tags: ["Settings"],
          summary: "Regenerate 10 new backup codes",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["code"],
                  properties: { code: { type: "string", pattern: "^\\d{6}$" } },
                },
              },
            },
          },
          responses: { "200": { description: "New backup codes returned once" } },
        },
      },
      "/settings/2fa/disable": {
        post: {
          tags: ["Settings"],
          summary: "Disable 2FA",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["password"],
                  properties: { password: { type: "string" } },
                },
              },
            },
          },
          responses: { "200": { description: "2FA disabled" } },
        },
      },
      "/settings/notifications": {
        get: {
          tags: ["Settings"],
          summary: "Get notification preferences",
          responses: { "200": { description: "Notification preferences" } },
        },
        put: {
          tags: ["Settings"],
          summary: "Update notification preferences",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    emailCreditLow: { type: "boolean" },
                    emailCampaignDone: { type: "boolean" },
                    emailWeeklyReport: { type: "boolean" },
                    smsCreditLow: { type: "boolean" },
                    smsCampaignDone: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Preferences updated" } },
        },
      },

      // ===================== CUSTOM FIELDS =====================
      "/custom-fields": {
        get: {
          tags: ["Custom Fields"],
          summary: "List custom fields",
          responses: {
            "200": {
              description: "Custom fields array",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/CustomField" } } } },
            },
          },
        },
        post: {
          tags: ["Custom Fields"],
          summary: "Create custom field",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "type"],
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["text", "number", "date", "boolean"] },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Custom field created" } },
        },
      },
      "/custom-fields/{id}": {
        put: {
          tags: ["Custom Fields"],
          summary: "Update custom field",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Custom field updated" } },
        },
        delete: {
          tags: ["Custom Fields"],
          summary: "Delete custom field",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Custom field deleted" } },
        },
      },

      // ===================== ORGANIZATIONS =====================
      "/organizations": {
        get: {
          tags: ["Organizations"],
          summary: "List user organizations",
          responses: {
            "200": {
              description: "Organizations array",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Organization" } } } },
            },
          },
        },
        post: {
          tags: ["Organizations"],
          summary: "Create organization",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: { name: { type: "string" } },
                },
              },
            },
          },
          responses: { "201": { description: "Organization created" } },
        },
      },
      "/organizations/{id}": {
        get: {
          tags: ["Organizations"],
          summary: "Get organization details",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Organization details" } },
        },
        put: {
          tags: ["Organizations"],
          summary: "Update organization",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Organization updated" } },
        },
      },
      "/organizations/{id}/members": {
        get: {
          tags: ["Organizations"],
          summary: "List organization members",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Members array" } },
        },
      },
      "/organizations/{id}/invites": {
        post: {
          tags: ["Organizations"],
          summary: "Invite member to organization",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "201": { description: "Invitation sent" } },
        },
      },

      // ===================== PDPA =====================
      "/pdpa/consent": {
        get: {
          tags: ["PDPA"],
          summary: "Get consent status",
          responses: { "200": { description: "Consent records" } },
        },
        post: {
          tags: ["PDPA"],
          summary: "Record consent",
          responses: { "201": { description: "Consent recorded" } },
        },
      },
      "/pdpa/opt-out": {
        post: {
          tags: ["PDPA"],
          summary: "Process opt-out request",
          responses: { "200": { description: "Opt-out processed" } },
        },
      },
      "/pdpa/data-requests": {
        get: {
          tags: ["PDPA"],
          summary: "List data requests",
          responses: { "200": { description: "Data requests array" } },
        },
        post: {
          tags: ["PDPA"],
          summary: "Create data access/deletion request",
          responses: { "201": { description: "Request created" } },
        },
      },
      "/pdpa/data-requests/{id}": {
        get: {
          tags: ["PDPA"],
          summary: "Get data request status",
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Data request details" } },
        },
      },

      // ===================== ONBOARDING =====================
      "/onboarding/status": {
        get: {
          tags: ["Onboarding"],
          summary: "Get onboarding status",
          responses: { "200": { description: "Onboarding progress" } },
        },
      },
      "/onboarding/progress": {
        post: {
          tags: ["Onboarding"],
          summary: "Update onboarding progress",
          responses: { "200": { description: "Progress updated" } },
        },
      },
      "/onboarding/complete": {
        post: {
          tags: ["Onboarding"],
          summary: "Mark onboarding as complete",
          responses: { "200": { description: "Onboarding completed" } },
        },
      },

      // ===================== TOS =====================
      "/tos": {
        get: {
          tags: ["Account"],
          summary: "Get terms of service acceptance status",
          responses: { "200": { description: "TOS status" } },
        },
        post: {
          tags: ["Account"],
          summary: "Accept terms of service",
          responses: { "200": { description: "TOS accepted" } },
        },
      },

      // ===================== ADMIN =====================
      "/admin/auth": {
        post: {
          tags: ["Admin - Auth"],
          summary: "Admin login",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Admin token returned" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },

      // Admin - Ops
      "/admin/ops/metrics": {
        get: {
          tags: ["Admin - Ops"],
          summary: "Operations dashboard metrics",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "SMS delivery stats, queue health, provider status" } },
        },
      },
      "/admin/ops/providers": {
        get: {
          tags: ["Admin - Ops"],
          summary: "List SMS providers",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Provider list with status" } },
        },
      },
      "/admin/ops/providers/{id}": {
        put: {
          tags: ["Admin - Ops"],
          summary: "Update provider configuration",
          security: [{ AdminAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Provider updated" } },
        },
      },
      "/admin/ops/failover": {
        get: {
          tags: ["Admin - Ops"],
          summary: "Get failover configuration",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Failover settings" } },
        },
        post: {
          tags: ["Admin - Ops"],
          summary: "Trigger manual failover",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Failover executed" } },
        },
      },
      "/admin/ops/failed": {
        get: {
          tags: ["Admin - Ops"],
          summary: "List failed messages",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Failed messages with retry info" } },
        },
      },
      "/admin/ops/blacklist": {
        get: {
          tags: ["Admin - Ops"],
          summary: "Get phone number blacklist",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Blacklisted numbers" } },
        },
        post: {
          tags: ["Admin - Ops"],
          summary: "Add number to blacklist",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Number blacklisted" } },
        },
      },

      // Admin - Finance
      "/admin/finance/revenue": {
        get: {
          tags: ["Admin - Finance"],
          summary: "Revenue metrics",
          security: [{ AdminAuth: [] }],
          parameters: [
            { name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month", "year"] } },
          ],
          responses: { "200": { description: "Revenue data with trends" } },
        },
      },
      "/admin/finance/refunds": {
        get: {
          tags: ["Admin - Finance"],
          summary: "List refund requests",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Refund requests" } },
        },
        post: {
          tags: ["Admin - Finance"],
          summary: "Process refund",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Refund processed" } },
        },
      },
      "/admin/senders": {
        get: {
          tags: ["Admin - Ops"],
          summary: "List all sender name requests",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "All sender requests with status" } },
        },
        post: {
          tags: ["Admin - Ops"],
          summary: "Approve/reject sender name",
          security: [{ AdminAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "action"],
                  properties: {
                    id: { type: "string" },
                    action: { type: "string", enum: ["approve", "reject"] },
                    rejectNote: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Action applied" } },
        },
      },
      "/admin/transactions": {
        get: {
          tags: ["Admin - Finance"],
          summary: "List all transactions (admin view)",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "All transactions" } },
        },
        post: {
          tags: ["Admin - Finance"],
          summary: "Verify/reject transaction",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Transaction updated" } },
        },
      },

      // Admin - Support
      "/admin/support/metrics": {
        get: {
          tags: ["Admin - Support"],
          summary: "Support dashboard metrics",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Ticket counts, response times, satisfaction" } },
        },
      },
      "/admin/support/tickets": {
        get: {
          tags: ["Admin - Support"],
          summary: "List support tickets",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Tickets with pagination" } },
        },
        post: {
          tags: ["Admin - Support"],
          summary: "Create support ticket",
          security: [{ AdminAuth: [] }],
          responses: { "201": { description: "Ticket created" } },
        },
      },
      "/admin/support/tickets/{id}": {
        get: {
          tags: ["Admin - Support"],
          summary: "Get ticket details",
          security: [{ AdminAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Ticket details" } },
        },
        put: {
          tags: ["Admin - Support"],
          summary: "Update ticket status",
          security: [{ AdminAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Ticket updated" } },
        },
      },
      "/admin/support/tickets/{id}/reply": {
        post: {
          tags: ["Admin - Support"],
          summary: "Reply to ticket",
          security: [{ AdminAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "201": { description: "Reply sent" } },
        },
      },
      "/admin/support/tickets/{id}/escalate": {
        post: {
          tags: ["Admin - Support"],
          summary: "Escalate ticket",
          security: [{ AdminAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Ticket escalated" } },
        },
      },
      "/admin/support/customers/{id}/credit-adjust": {
        post: {
          tags: ["Admin - Support"],
          summary: "Adjust customer SMS quota",
          security: [{ AdminAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "SMS quota adjusted" } },
        },
      },
      "/admin/support/customers/{id}/suspend": {
        post: {
          tags: ["Admin - Support"],
          summary: "Suspend/unsuspend customer",
          security: [{ AdminAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdPath" }],
          responses: { "200": { description: "Customer status changed" } },
        },
      },
      "/admin/support/kb": {
        get: {
          tags: ["Admin - Support"],
          summary: "List knowledge base articles",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "KB articles" } },
        },
        post: {
          tags: ["Admin - Support"],
          summary: "Create KB article",
          security: [{ AdminAuth: [] }],
          responses: { "201": { description: "Article created" } },
        },
      },
      "/admin/support/kb/analytics": {
        get: {
          tags: ["Admin - Support"],
          summary: "KB analytics (views, helpfulness)",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "KB analytics" } },
        },
      },

      // Admin - CEO
      "/admin/ceo/metrics": {
        get: {
          tags: ["Admin - CEO"],
          summary: "CEO executive dashboard",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "High-level business metrics" } },
        },
      },
      "/admin/ceo/revenue-trend": {
        get: {
          tags: ["Admin - CEO"],
          summary: "Revenue trend over time",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Revenue trend data" } },
        },
      },
      "/admin/ceo/user-growth": {
        get: {
          tags: ["Admin - CEO"],
          summary: "User growth metrics",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "User growth data" } },
        },
      },
      "/admin/ceo/arpu": {
        get: {
          tags: ["Admin - CEO"],
          summary: "Average revenue per user",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "ARPU metrics" } },
        },
      },
      "/admin/ceo/ltv": {
        get: {
          tags: ["Admin - CEO"],
          summary: "Customer lifetime value",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "LTV data" } },
        },
      },
      "/admin/ceo/churn": {
        get: {
          tags: ["Admin - CEO"],
          summary: "Churn rate analysis",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Churn metrics" } },
        },
      },
      "/admin/ceo/churned": {
        get: {
          tags: ["Admin - CEO"],
          summary: "List churned customers",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Churned customer list" } },
        },
      },
      "/admin/ceo/top-customers": {
        get: {
          tags: ["Admin - CEO"],
          summary: "Top customers by revenue",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Top customers ranked" } },
        },
      },
      "/admin/ceo/recent-signups": {
        get: {
          tags: ["Admin - CEO"],
          summary: "Recent signups",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Recent signups list" } },
        },
      },
      "/admin/ceo/revenue-by-plan": {
        get: {
          tags: ["Admin - CEO"],
          summary: "Revenue breakdown by plan",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Revenue by plan" } },
        },
      },

      // Admin - CTO
      "/admin/cto/metrics": {
        get: {
          tags: ["Admin - CTO"],
          summary: "CTO technical dashboard",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "System health, latency, error rates" } },
        },
      },
      "/admin/cto/health-check": {
        get: {
          tags: ["Admin - CTO"],
          summary: "System health check",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Health status of all services" } },
        },
      },
      "/admin/cto/errors": {
        get: {
          tags: ["Admin - CTO"],
          summary: "Recent error logs",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Error logs" } },
        },
      },
      "/admin/cto/alerts": {
        get: {
          tags: ["Admin - CTO"],
          summary: "Active alerts",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Alert list" } },
        },
      },
      "/admin/cto/api-keys": {
        get: {
          tags: ["Admin - CTO"],
          summary: "API key usage analytics",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "API key usage stats" } },
        },
      },
      "/admin/cto/deployments": {
        get: {
          tags: ["Admin - CTO"],
          summary: "Deployment history",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Deployment records" } },
        },
      },
      "/admin/cto/maintenance": {
        get: {
          tags: ["Admin - CTO"],
          summary: "Maintenance windows",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Maintenance schedule" } },
        },
        post: {
          tags: ["Admin - CTO"],
          summary: "Schedule maintenance window",
          security: [{ AdminAuth: [] }],
          responses: { "201": { description: "Maintenance scheduled" } },
        },
      },

      // Admin - Marketing
      "/admin/marketing/metrics": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "Marketing dashboard metrics",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Conversion rates, campaign performance" } },
        },
      },
      "/admin/marketing/funnel": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "Conversion funnel analysis",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Funnel data" } },
        },
      },
      "/admin/marketing/cohort": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "Cohort analysis",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Cohort retention data" } },
        },
      },
      "/admin/marketing/power-users": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "Power user identification",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Power users list" } },
        },
      },
      "/admin/marketing/inactive": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "Inactive user list",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Inactive users" } },
        },
      },
      "/admin/marketing/trial-conversion": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "Trial to paid conversion rate",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Trial conversion data" } },
        },
      },
      "/admin/marketing/promo-codes": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "List promo codes",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Promo codes" } },
        },
        post: {
          tags: ["Admin - Marketing"],
          summary: "Create promo code",
          security: [{ AdminAuth: [] }],
          responses: { "201": { description: "Promo code created" } },
        },
      },
      "/admin/marketing/promo-credits": {
        get: {
          tags: ["Admin - Marketing"],
          summary: "Promo credit distribution stats",
          security: [{ AdminAuth: [] }],
          responses: { "200": { description: "Promo credit stats" } },
        },
      },
    },
  };
}
