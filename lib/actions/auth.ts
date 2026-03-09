"use server";

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendSingleSms } from "@/lib/sms-gateway";
import { forgotPasswordSchema } from "@/lib/validations";

const TEMP_PASSWORD_LENGTH = 8;
const TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function alternatePhone(phone: string) {
  if (phone.startsWith("+66")) {
    return `0${phone.slice(3)}`;
  }

  if (phone.startsWith("0")) {
    return `+66${phone.slice(1)}`;
  }

  return phone;
}

function generateTemporaryPassword() {
  return Array.from({ length: TEMP_PASSWORD_LENGTH }, () =>
    TEMP_PASSWORD_CHARS[crypto.randomInt(0, TEMP_PASSWORD_CHARS.length)]
  ).join("");
}

export async function forgotPassword(input: unknown) {
  const { phone } = forgotPasswordSchema.parse(input);
  const fallbackPhone = alternatePhone(phone);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, { phone: fallbackPhone }],
    },
    select: {
      id: true,
      phone: true,
      password: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    throw new Error("ไม่พบเบอร์โทรนี้ในระบบ");
  }

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(tempPassword);
  const destinationPhone = user.phone || phone;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      mustChangePassword: true,
    },
  });

  const message = `รหัสชั่วคราว: ${tempPassword} ใช้ได้ครั้งเดียว`;

  try {
    const smsResult = await sendSingleSms(destinationPhone, message, "EasySlip");
    if (!smsResult.success) {
      throw new Error(smsResult.error || "ส่ง SMS ไม่สำเร็จ");
    }
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: user.password,
        mustChangePassword: user.mustChangePassword,
      },
    });

    if (error instanceof Error) {
      throw new Error(error.message || "ส่ง SMS ไม่สำเร็จ");
    }

    throw new Error("ส่ง SMS ไม่สำเร็จ");
  }

  return { success: true };
}
