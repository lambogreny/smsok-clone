import { NextRequest } from "next/server";
import { prisma as db } from "./db";
import { ApiError } from "./api-auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "./env";

const ADMIN_JWT_SECRET = env.JWT_SECRET + "_admin";

type AdminPayload = { adminId: string; role: string };

export function signAdminToken(adminId: string, role: string) {
  return jwt.sign({ adminId, role }, ADMIN_JWT_SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * Authenticate admin via Bearer token or cookie
 * Returns admin user with role
 */
export async function authenticateAdmin(req: NextRequest, allowedRoles?: string[]) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : req.cookies.get("admin_session")?.value;

  if (!token) {
    throw new ApiError(401, "Admin authentication required", "ADMIN_AUTH_MISSING");
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    throw new ApiError(401, "Invalid or expired admin token", "ADMIN_AUTH_INVALID");
  }

  const admin = await db.adminUser.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    throw new ApiError(401, "Admin account not found or disabled", "ADMIN_AUTH_DISABLED");
  }

  if (allowedRoles && !allowedRoles.includes(admin.role) && admin.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "ไม่มีสิทธิ์ดำเนินการนี้", "ADMIN_FORBIDDEN");
  }

  return admin;
}

export async function loginAdmin(email: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) {
    throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  // Update last login
  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });

  const token = signAdminToken(admin.id, admin.role);
  return { token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } };
}
