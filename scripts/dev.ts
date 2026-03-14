import { spawn, type ChildProcess } from "node:child_process"
import { getEnv } from "../lib/env"

getEnv()

const RUNTIME = process.execPath
const WEB_ARGS = ["run", "dev:web"]
const WORKER_ARGS = ["run", "workers:start"]
const WORKER_RESTART_RESET_MS = 30_000
const WORKER_FORCE_KILL_TIMEOUT_MS = 5_000
const WORKER_MAX_RESTART_DELAY_MS = 10_000

let isShuttingDown = false
let nextProcess: ChildProcess | null = null
let workerProcess: ChildProcess | null = null
let workerRestartTimer: ReturnType<typeof setTimeout> | null = null
let workerRestartCount = 0
let workerStartedAt = 0

function spawnProcess(label: string, args: string[]) {
  console.log(`[dev] starting ${label}: ${RUNTIME} ${args.join(" ")}`)

  return spawn(RUNTIME, args, {
    stdio: "inherit",
    env: process.env,
  })
}

function getWorkerRestartDelay(attempt: number) {
  return Math.min(1_000 * 2 ** Math.max(attempt - 1, 0), WORKER_MAX_RESTART_DELAY_MS)
}

function clearWorkerRestartTimer() {
  if (!workerRestartTimer) {
    return
  }

  clearTimeout(workerRestartTimer)
  workerRestartTimer = null
}

function startNextDevServer() {
  nextProcess = spawnProcess("next-dev", WEB_ARGS)

  nextProcess.on("exit", (code, signal) => {
    nextProcess = null

    if (isShuttingDown) {
      return
    }

    console.error(
      `[dev] next-dev exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"})`,
    )
    void shutdown(code ?? 1)
  })
}

function scheduleWorkerRestart() {
  clearWorkerRestartTimer()
  const delayMs = getWorkerRestartDelay(workerRestartCount)

  console.log(`[dev] restarting workers in ${delayMs}ms`)
  workerRestartTimer = setTimeout(() => {
    workerRestartTimer = null
    startWorkerSupervisor()
  }, delayMs)
}

function startWorkerSupervisor() {
  workerStartedAt = Date.now()
  workerProcess = spawnProcess("workers", WORKER_ARGS)

  workerProcess.on("exit", (code, signal) => {
    workerProcess = null

    if (isShuttingDown) {
      return
    }

    const uptimeMs = Date.now() - workerStartedAt
    if (uptimeMs >= WORKER_RESTART_RESET_MS) {
      workerRestartCount = 0
    }

    workerRestartCount += 1

    console.error(
      `[dev] workers exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"}, uptime=${uptimeMs}ms)`,
    )

    scheduleWorkerRestart()
  })
}

async function stopProcess(label: string, child: ChildProcess | null) {
  if (!child || child.exitCode !== null) {
    return
  }

  child.kill("SIGTERM")

  await new Promise<void>((resolve) => {
    const timeoutId = setTimeout(() => {
      if (child.exitCode === null) {
        console.error(`[dev] ${label} did not exit after SIGTERM, sending SIGKILL`)
        child.kill("SIGKILL")
      }
      resolve()
    }, WORKER_FORCE_KILL_TIMEOUT_MS)

    child.once("exit", () => {
      clearTimeout(timeoutId)
      resolve()
    })
  })
}

async function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  clearWorkerRestartTimer()

  console.log("[dev] shutting down next-dev and workers")

  await Promise.allSettled([
    stopProcess("workers", workerProcess),
    stopProcess("next-dev", nextProcess),
  ])

  process.exit(exitCode)
}

console.log("[dev] starting SMSOK local development stack")
console.log("[dev] next-dev + BullMQ workers will run together")

startNextDevServer()
startWorkerSupervisor()

process.on("SIGINT", () => {
  void shutdown(0)
})

process.on("SIGTERM", () => {
  void shutdown(0)
})
