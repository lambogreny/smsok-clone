"use server";

import { prisma } from "./db";
import { hashPassword, verifyPassword, setSession, clearSession } from "./auth";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "./validations";
import { forgotPassword as forgotPasswordAction } from "./actions/auth";

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed },
  });

  await setSession(user.id);
  redirect("/dashboard");
}

// ==========================================
// Register with OTP verification
// ==========================================

export async function registerWithOtp(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  otpRef: string;
  otpCode: string;
}) {
  const { verifyOtpForRegister } = await import("./actions/otp");

  // Verify OTP first
  const otpResult = await verifyOtpForRegister(data.otpRef, data.otpCode);
  if (!otpResult.valid) {
    throw new Error("OTP ไม่ถูกต้อง");
  }

  const parsed = registerSchema.safeParse({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const { name, email, phone, password } = parsed.data;

  const [existingEmail, existingPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    phone ? prisma.user.findFirst({ where: { phone }, select: { id: true } }) : null,
  ]);
  if (existingEmail) throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
  if (existingPhone) throw new Error("เบอร์โทรนี้ถูกใช้งานแล้ว");

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed, phoneVerified: true },
  });

  await setSession(user.id);
}

// ==========================================
// Login (with mustChangePassword redirect)
// ==========================================

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, mustChangePassword: true },
  });
  if (!user) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await setSession(user.id);

  if (user.mustChangePassword) {
    redirect("/dashboard/settings?forceChange=true");
  }
  redirect("/dashboard");
}

export async function forgotPassword(phone: string) {
  return forgotPasswordAction({ phone });
}

// ==========================================
// Change Password (force change flow)
// ==========================================

export async function changePasswordForced(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) throw new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: false },
  });
}

export async function logout() {
  await clearSession();
  redirect("/");
}
