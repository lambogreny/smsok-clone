"use server";

import { prisma } from "./db";
import { hashPassword, verifyPassword, setSession, clearSession } from "./auth";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema, normalizePhone } from "./validations";
import { forgotPassword as forgotPasswordAction, resetPassword as resetPasswordAction } from "./actions/auth";

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const { firstName, lastName, email, phone: rawPhone, password } = parsed.data;
  const name = `${firstName} ${lastName}`;
  const phone = rawPhone ? normalizePhone(rawPhone) : "";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const hashed = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, phone, password: hashed },
    });
    await tx.creditTransaction.create({
      data: {
        userId: newUser.id,
        amount: 15,
        balance: 15,
        type: "WELCOME_BONUS",
        description: "เครดิตต้อนรับสมาชิกใหม่",
      },
    });
    return newUser;
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
  acceptTerms?: boolean;
}) {
  const { verifyOtpForRegister } = await import("./actions/otp");

  // Validate schema + check duplicates BEFORE consuming OTP
  // (prevents OTP being permanently used if validation or duplicate check fails)
  const parsed = registerSchema.safeParse({
    firstName: data.name.split(" ")[0] || data.name,
    lastName: data.name.split(" ").slice(1).join(" ") || data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const { firstName, lastName, email, phone: rawPhone, password } = parsed.data;
  const name = `${firstName} ${lastName}`;
  const phone = rawPhone ? normalizePhone(rawPhone) : "";

  const [existingEmail, existingPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    phone ? prisma.user.findFirst({ where: { phone }, select: { id: true } }) : null,
  ]);
  if (existingEmail) throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
  if (existingPhone) throw new Error("เบอร์โทรนี้ถูกใช้งานแล้ว");

  // Verify OTP last — only consumed after validation passes
  const otpResult = await verifyOtpForRegister(data.otpRef, data.otpCode);
  if (!otpResult.valid) {
    throw new Error("OTP ไม่ถูกต้อง");
  }

  // Verify OTP phone matches registration phone (both normalized to +66 format)
  if (phone && otpResult.phone !== phone) {
    throw new Error("เบอร์โทรไม่ตรงกับ OTP ที่ยืนยัน");
  }

  const hashed = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        phone,
        password: hashed,
        phoneVerified: true,
        acceptedTermsAt: data.acceptTerms ? new Date() : null,
      },
    });
    await tx.creditTransaction.create({
      data: {
        userId: newUser.id,
        amount: 15,
        balance: 15,
        type: "WELCOME_BONUS",
        description: "เครดิตต้อนรับสมาชิกใหม่",
      },
    });
    return newUser;
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
    select: {
      id: true,
      password: true,
      mustChangePassword: true,
      twoFactorAuth: { select: { enabled: true } },
    },
  });
  if (!user) {
    // Constant-time: always run bcrypt even when user not found
    await verifyPassword(password, "$2b$12$qF1xea/GGCtjbQ6FC32FAu0YSQWxmgOuBDgvb4IVBhTrnjXPVYwoC");
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  // If 2FA is enabled, return challenge token instead of session
  if (user.twoFactorAuth?.enabled) {
    const jwt = await import("jsonwebtoken");
    const { env } = await import("./env");
    const challengeToken = jwt.default.sign(
      { userId: user.id, purpose: "2fa-challenge" },
      env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    return { needs2FA: true, challengeToken };
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

export async function resetPassword(token: string, newPassword: string) {
  return resetPasswordAction({ token, newPassword });
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
