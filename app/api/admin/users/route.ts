import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateAdmin } from "@/lib/admin-auth";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { createContactSchema, emailSchema, passwordSchema, phoneSchema } from "@/lib/validations";

const createAdminUserSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  name: createContactSchema.shape.name,
  password: passwordSchema,
  role: z.string().trim().min(1).max(50).default("user"),
});

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPER_ADMIN", "OPERATIONS"]);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const input = createAdminUserSchema.parse(body);

    const [existingUserEmail, existingAdminEmail, existingPhone] = await Promise.all([
      db.user.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
        select: { id: true },
      }),
      db.adminUser.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
        select: { id: true },
      }),
      db.user.findUnique({
        where: { phone: input.phone },
        select: { id: true },
      }),
    ]);

    if (existingUserEmail || existingAdminEmail) {
      throw new ApiError(409, "อีเมลนี้ถูกใช้งานแล้ว", "DUPLICATE");
    }

    if (existingPhone) {
      throw new ApiError(409, "เบอร์โทรนี้ถูกใช้งานแล้ว", "DUPLICATE");
    }

    const password = await hashPassword(input.password);
    const user = await db.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        name: input.name,
        password,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return apiResponse(user, 201);
  } catch (error) {
    return apiError(error);
  }
}
