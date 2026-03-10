import { allQueues } from "@/lib/queue/queues"
import type { QueueHealthInfo, QueuesHealthResponse } from "@/lib/queue/types"

// GET /api/health/queues — Queue health check
export async function GET() {
  try {
    const queueInfos: QueueHealthInfo[] = await Promise.all(
      allQueues.map(async (queue) => {
        try {
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
          ])
          const isPaused = await queue.isPaused()

          return {
            name: queue.name,
            waiting,
            active,
            completed,
            failed,
            delayed,
            paused: isPaused,
          }
        } catch {
          return {
            name: queue.name,
            waiting: -1,
            active: -1,
            completed: -1,
            failed: -1,
            delayed: -1,
            paused: false,
          }
        }
      })
    )

    // Determine overall health
    const hasErrors = queueInfos.some((q) => q.waiting === -1)
    const hasHighBacklog = queueInfos.some((q) => q.waiting > 10000)

    const response: QueuesHealthResponse = {
      status: hasErrors ? "down" : hasHighBacklog ? "degraded" : "healthy",
      redis: hasErrors ? "disconnected" : "connected",
      queues: queueInfos,
      timestamp: new Date().toISOString(),
    }

    return Response.json(response, {
      status: hasErrors ? 503 : 200,
    })
  } catch (error) {
    const response: QueuesHealthResponse = {
      status: "down",
      redis: "disconnected",
      queues: [],
      timestamp: new Date().toISOString(),
    }
    return Response.json(response, { status: 503 })
  }
}
