import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const slipRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");

describe("Task #2905: slip uploads enqueue BullMQ jobs with a valid custom job id", () => {
  it("uses a hyphenated custom job id instead of a colon-delimited value that BullMQ rejects", () => {
    expect(slipRouteSource).toContain("jobId: `order-slip-${orderSlipId}`");
    expect(slipRouteSource).not.toContain("jobId: `order-slip:${orderSlipId}`");
  });
});
