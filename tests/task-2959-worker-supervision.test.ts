import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = process.cwd()
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as {
  scripts: Record<string, string>
}
const devSupervisorSource = readFileSync(resolve(root, "scripts/dev.ts"), "utf-8")

describe("Task #2959: dev worker supervision", () => {
  it("runs the local dev stack through the supervisor script", () => {
    expect(packageJson.scripts.dev).toBe("bun scripts/dev.ts")
    expect(packageJson.scripts["dev:web"]).toBe("next dev --port 3000")
  })

  it("starts both next-dev and workers from the supervisor", () => {
    expect(devSupervisorSource).toContain('const WEB_ARGS = ["run", "dev:web"]')
    expect(devSupervisorSource).toContain('const WORKER_ARGS = ["run", "workers:start"]')
    expect(devSupervisorSource).toContain("startNextDevServer()")
    expect(devSupervisorSource).toContain("startWorkerSupervisor()")
  })

  it("restarts workers automatically when they exit unexpectedly", () => {
    expect(devSupervisorSource).toContain("workerRestartCount += 1")
    expect(devSupervisorSource).toContain("scheduleWorkerRestart()")
    expect(devSupervisorSource).toContain("restarting workers in")
  })
})
