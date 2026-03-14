import { allQueues } from "@/lib/queue/queues"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const start = Date.now()
  const queueStats: Record<string, { active: number; waiting: number; failed: number; delayed: number; completed: number }> = {}
  let redisStatus = "connected"

  try {
    for (const q of allQueues) {
      try {
        const [active, waiting, failed, delayed, completed] = await Promise.all([
          q.getActiveCount(),
          q.getWaitingCount(),
          q.getFailedCount(),
          q.getDelayedCount(),
          q.getCompletedCount(),
        ])
        queueStats[q.name] = { active, waiting, failed, delayed, completed }
      } catch {
        queueStats[q.name] = { active: -1, waiting: -1, failed: -1, delayed: -1, completed: -1 }
        redisStatus = "error"
      }
    }
  } catch {
    redisStatus = "disconnected"
  }

  // Check for stuck jobs (active > 5 min)
  const alerts: string[] = []
  for (const q of allQueues) {
    try {
      const activeJobs = await q.getActive()
      for (const job of activeJobs) {
        const elapsed = Date.now() - (job.processedOn || job.timestamp)
        if (elapsed > 5 * 60 * 1000) {
          alerts.push(`STUCK: ${q.name} job ${job.id} active for ${Math.round(elapsed / 60000)}m`)
        }
      }
    } catch {
      // skip if can't fetch
    }
  }

  const healthy = redisStatus === "connected" && alerts.length === 0

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      redis: redisStatus,
      queues: queueStats,
      alerts,
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  )
}
