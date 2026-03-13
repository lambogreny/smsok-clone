import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const switchSource = readFileSync(resolve(ROOT, "components/ui/switch.tsx"), "utf-8");

describe("Task #2812: switch off-state contrast", () => {
  it("uses a darker off track with a visible border and thumb", () => {
    expect(switchSource).toContain("data-unchecked:border-[#4a5568]");
    expect(switchSource).toContain("data-unchecked:bg-[#374151]");
    expect(switchSource).toContain("data-unchecked:bg-[#9ca3af]");
    expect(switchSource).toContain("data-disabled:opacity-70");
  });
});
