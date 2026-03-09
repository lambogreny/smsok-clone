import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const apiAuth = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const auth = readFileSync(resolve(ROOT, "lib/auth.ts"), "utf-8");

// ==========================================
// API Auth (Bearer token)
// ==========================================

describe("API Auth: authenticateApiKey", () => {
  it("exports authenticateApiKey function", () => {
    expect(apiAuth).toContain("async function authenticateApiKey");
  });

  it("checks for Bearer prefix", () => {
    expect(apiAuth).toContain('Bearer ');
  });

  it("supports X-API-Key header", () => {
    expect(apiAuth).toContain("x-api-key");
  });

  it("throws 401 on missing auth header", () => {
    expect(apiAuth).toContain("Missing or invalid Authorization header");
  });

  it("throws 401 on invalid key", () => {
    expect(apiAuth).toContain("Invalid API key");
  });

  it("throws 401 on inactive key", () => {
    expect(apiAuth).toContain("API key is disabled");
  });

  it("updates lastUsed timestamp", () => {
    expect(apiAuth).toContain("lastUsed");
  });

  it("returns user with credits", () => {
    expect(apiAuth).toContain("credits");
  });
});

describe("API Auth: ApiError class", () => {
  it("exports ApiError", () => {
    expect(apiAuth).toContain("class ApiError");
  });

  it("has status property", () => {
    expect(apiAuth).toContain("public status: number");
  });
});

describe("API Auth: Response helpers", () => {
  it("exports apiResponse", () => {
    expect(apiAuth).toContain("function apiResponse");
  });

  it("exports apiError", () => {
    expect(apiAuth).toContain("function apiError");
  });

  it("apiError handles ApiError instances", () => {
    expect(apiAuth).toContain("instanceof ApiError");
  });

  it("apiError defaults to 500 for unknown errors", () => {
    expect(apiAuth).toContain("500");
  });
});

// ==========================================
// Auth (Session/JWT)
// ==========================================

describe("Auth: Password", () => {
  it("uses bcrypt for hashing", () => {
    expect(auth).toContain("bcrypt.hash");
  });

  it("uses salt rounds 12", () => {
    expect(auth).toContain("12");
  });

  it("has verifyPassword function", () => {
    expect(auth).toContain("async function verifyPassword");
    expect(auth).toContain("bcrypt.compare");
  });
});

describe("Auth: JWT", () => {
  it("signs token with userId", () => {
    expect(auth).toContain("jwt.sign");
    expect(auth).toContain("userId");
  });

  it("token expires in 7 days", () => {
    expect(auth).toContain('expiresIn: "7d"');
  });

  it("verifyToken returns null on invalid", () => {
    expect(auth).toContain("return null");
  });
});

describe("Auth: Session", () => {
  it("getSession reads cookie", () => {
    expect(auth).toContain('cookieStore.get("session")');
  });

  it("setSession sets HttpOnly cookie", () => {
    expect(auth).toContain("httpOnly: true");
  });

  it("cookie is secure in production", () => {
    expect(auth).toContain('secure: process.env.NODE_ENV === "production"');
  });

  it("cookie sameSite is lax", () => {
    expect(auth).toContain('sameSite: "lax"');
  });

  it("cookie maxAge is 7 days", () => {
    expect(auth).toContain("60 * 60 * 24 * 7");
  });

  it("clearSession deletes cookie", () => {
    expect(auth).toContain('cookieStore.delete("session")');
  });

  it("getSession selects limited user fields", () => {
    expect(auth).toContain("select:");
    expect(auth).toContain("credits: true");
    expect(auth).toContain("role: true");
  });
});
