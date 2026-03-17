import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { redisHealthCheck } from "@/lib/redis";
import { allQueues } from "@/lib/queue/queues";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string; queues?: Record<string, number> }> = {};
  checks.app = { status: "ok" };

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (e) {
    const rawError = e instanceof Error ? e.message : "unknown";
    checks.database = { status: "error", error: "database unreachable" };
    logger.error("Health check: database unreachable", { error: rawError });
  }

  // Redis check
  checks.redis = await redisHealthCheck();

  // BullMQ queues check
  try {
    const queueStats: Record<string, number> = {};
    for (const q of allQueues) {
      try {
        queueStats[q.name] = await q.getWaitingCount();
      } catch {
        queueStats[q.name] = -1;
      }
    }
    const hasQueueError = Object.values(queueStats).some((v) => v === -1);
    checks.queues = {
      status: hasQueueError ? "error" : "ok",
      queues: queueStats,
    };
  } catch {
    checks.queues = { status: "error", error: "queues unreachable" };
  }

  // Memory usage
  const mem = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(mem.rss / 1024 / 1024),
    heap: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
  };

  const ready = checks.app.status === "ok" && checks.database?.status === "ok";
  const dependenciesHealthy = [checks.redis, checks.queues].every((check) => check?.status === "ok");
  const status = ready
    ? dependenciesHealthy ? "healthy" : "degraded"
    : "degraded";

  return NextResponse.json(
    {
      status,
      ready,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      latency: Date.now() - start,
      memory: memoryMB,
      checks,
      version: env.COMMIT_SHA,
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
