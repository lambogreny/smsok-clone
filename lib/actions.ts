"use server";

import { prisma } from "./db";
import { hashPassword, verifyPassword, verifyAndMigratePassword, setSession, clearSession } from "./auth";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema, normalizePhone } from "./validations";
import { forgotPassword as forgotPasswordAction, resetPassword as resetPasswordAction } from "./actions/auth";
import { resolveActionUserId } from "./action-user";
import { logger } from "./logger";

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
  const user = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    const newUser = await tx.user.create({
      data: { name, email, phone, password: hashed },
    });
    return newUser;
  });

  // Create trial package for new user
  const { createTrialPackage } = await import("./package/quota");
  await createTrialPackage(user.id).catch((err) => {
    logger.error("Failed to create trial package", { userId: user.id, error: err instanceof Error ? err.message : String(err) });
  });

  await setSession(user.id);
  redirect("/dashboard");
}

// ==========================================
// Register with OTP verification
// ==========================================

export async function registerWithOtp(data: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  password: string;
  otpRef: string;
  otpCode: string;
  acceptTerms?: boolean;
  consentService?: boolean;
  consentThirdParty?: boolean;
  consentMarketing?: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { verifyOtpForRegister } = await import("./actions/otp");
  const requiredConsentsAccepted =
    data.acceptTerms === true ||
    (data.consentService === true && data.consentThirdParty === true);
  const consentService = data.consentService ?? requiredConsentsAccepted;
  const consentThirdParty = data.consentThirdParty ?? requiredConsentsAccepted;
  const consentMarketing = data.consentMarketing ?? false;

  if (!requiredConsentsAccepted || !consentService || !consentThirdParty) {
    throw new Error("กรุณายอมรับเงื่อนไขการใช้งานและความยินยอมที่จำเป็น");
  }

  const combinedName = data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
  const nameParts = combinedName.split(/\s+/).filter(Boolean);
  const derivedFirstName = data.firstName?.trim() || nameParts[0] || combinedName;
  const derivedLastName = data.lastName?.trim() || nameParts.slice(1).join(" ") || derivedFirstName;

  // Validate schema + check duplicates BEFORE consuming OTP
  // (prevents OTP being permanently used if validation or duplicate check fails)
  const parsed = registerSchema.safeParse({
    firstName: derivedFirstName,
    lastName: derivedLastName,
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
    phone ? prisma.user.findUnique({ where: { phone }, select: { id: true } }) : null,
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
  const acceptedTermsAt = new Date();
  const user = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        phone,
        password: hashed,
        phoneVerified: true,
        acceptedTermsAt,
      },
    });

    await tx.termsAcceptance.create({
      data: {
        userId: newUser.id,
        version: "1.0",
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });

    const activePolicies = await tx.pdpaPolicy.findMany({
      where: {
        isActive: true,
        type: { in: ["TERMS", "PRIVACY", "MARKETING"] },
      },
      select: {
        id: true,
        type: true,
      },
    });
    const policyMap = new Map(activePolicies.map((policy: (typeof activePolicies)[number]) => [policy.type, policy.id]));
    const consentLogs = [
      {
        policyId: policyMap.get("TERMS"),
        consentType: "SERVICE",
        action: "OPT_IN",
      },
      {
        policyId: policyMap.get("PRIVACY"),
        consentType: "THIRD_PARTY",
        action: "OPT_IN",
      },
      {
        policyId: policyMap.get("MARKETING"),
        consentType: "MARKETING",
        action: consentMarketing ? "OPT_IN" : "OPT_OUT",
      },
    ]
      .filter((entry): entry is { policyId: string; consentType: "SERVICE" | "THIRD_PARTY" | "MARKETING"; action: "OPT_IN" | "OPT_OUT" } => Boolean(entry.policyId))
      .map((entry) => ({
        userId: newUser.id,
        policyId: entry.policyId,
        consentType: entry.consentType,
        action: entry.action,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      }));

    if (consentLogs.length > 0) {
      await tx.pdpaConsentLog.createMany({
        data: consentLogs,
      });
    }

    return newUser;
  });

  // Create trial package for new user
  const { createTrialPackage } = await import("./package/quota");
  await createTrialPackage(user.id).catch((err) => {
    logger.error("Failed to create trial package", { userId: user.id, error: err instanceof Error ? err.message : String(err) });
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

  const { valid, newHash } = await verifyAndMigratePassword(password, user.password);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  // Lazy migrate bcrypt → argon2id on successful login
  if (newHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    }).catch(() => {}); // non-blocking — don't fail login if rehash fails
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
  userId = await resolveActionUserId(userId);
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
