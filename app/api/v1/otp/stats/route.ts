import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

type OtpStatus = "verified" | "expired" | "wrong_otp" | "pending";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDelta(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return "0%";
    return "+100%";
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function deriveStatus(otp: {
  verified: boolean;
  attempts: number;
  expiresAt: Date;
}, now: Date): OtpStatus {
  if (otp.verified) return "verified";
  if (otp.expiresAt < now) return "expired";
  if (otp.attempts > 0) return "wrong_otp";
  return "pending";
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatVerifySeconds(seconds: number | null) {
  if (seconds === null) return "—";
  return `${seconds} วิ`;
}

// GET /api/v1/otp/stats — OTP analytics for dashboard
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = addDays(todayStart, -1);
    const last7DaysStart = addDays(todayStart, -6);

    const [
      sentToday,
      sentYesterday,
      verifiedToday,
      expiredToday,
      verifiedForAverage,
      chartRows,
      recentRows,
      historyRows,
    ] = await Promise.all([
      db.otpRequest.count({
        where: { userId: user.id, createdAt: { gte: todayStart } },
      }),
      db.otpRequest.count({
        where: {
          userId: user.id,
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),
      db.otpRequest.count({
        where: { userId: user.id, createdAt: { gte: todayStart }, verified: true },
      }),
      db.otpRequest.count({
        where: {
          userId: user.id,
          createdAt: { gte: todayStart },
          verified: false,
          expiresAt: { lt: now },
        },
      }),
      db.otpRequest.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: todayStart },
          verified: true,
          verifiedAt: { not: null },
        },
        select: {
          createdAt: true,
          verifiedAt: true,
        },
      }),
      db.otpRequest.findMany({
        where: { userId: user.id, createdAt: { gte: last7DaysStart } },
        select: {
          createdAt: true,
          verified: true,
          expiresAt: true,
          attempts: true,
        },
      }),
      db.otpRequest.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          phone: true,
          refCode: true,
          verified: true,
          attempts: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.otpRequest.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          phone: true,
          refCode: true,
          verified: true,
          verifiedAt: true,
          attempts: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const verifyRate = sentToday > 0 ? (verifiedToday / sentToday) * 100 : 0;
    const expireRate = sentToday > 0 ? (expiredToday / sentToday) * 100 : 0;

    const avgVerifyTime =
      verifiedForAverage.length > 0
        ? Math.round(
            verifiedForAverage.reduce((sum, otp) => {
              if (!otp.verifiedAt) return sum;
              return sum + Math.max(0, (otp.verifiedAt.getTime() - otp.createdAt.getTime()) / 1000);
            }, 0) / verifiedForAverage.length
          )
        : null;

    const chartMap = new Map<string, { sent: number; verified: number; expired: number }>();
    for (let i = 0; i < 7; i += 1) {
      const day = addDays(last7DaysStart, i);
      chartMap.set(day.toISOString().slice(0, 10), {
        sent: 0,
        verified: 0,
        expired: 0,
      });
    }

    for (const otp of chartRows) {
      const key = otp.createdAt.toISOString().slice(0, 10);
      const bucket = chartMap.get(key);
      if (!bucket) continue;

      bucket.sent += 1;
      if (otp.verified) {
        bucket.verified += 1;
      } else if (otp.expiresAt < now) {
        bucket.expired += 1;
      }
    }

    const chart = Array.from(chartMap.entries()).map(([day, stats]) => ({
      day,
      ...stats,
    }));

    const recentOtps = recentRows.map((otp, index) => ({
      id: index + 1,
      phone: otp.phone,
      ref: otp.refCode,
      status: deriveStatus(otp, now),
      time: formatClock(otp.createdAt),
    }));

    const history = historyRows.map((otp, index) => ({
      id: index + 1,
      phone: otp.phone,
      ref: otp.refCode,
      otp: "******",
      status: deriveStatus(otp, now),
      verifyTime: formatVerifySeconds(
        otp.verified && otp.verifiedAt
          ? Math.round((otp.verifiedAt.getTime() - otp.createdAt.getTime()) / 1000)
          : null
      ),
      time: otp.createdAt.toISOString(),
    }));

    return apiResponse({
      stats: {
        sentToday,
        verifiedToday,
        expiredToday,
        avgVerifyTime,
        sentDelta: formatDelta(sentToday, sentYesterday),
        verifyRate: formatPercent(verifyRate),
        expireRate: formatPercent(expireRate),
        timeDelta: verifiedForAverage.length > 0 ? "จากข้อมูลจริง" : "ยังไม่มีข้อมูล",
      },
      chart,
      recentOtps,
      history,
    });
  } catch (error) {
    return apiError(error);
  }
}
