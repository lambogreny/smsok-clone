import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const switchSource = readFileSync(resolve(ROOT, "components/ui/switch.tsx"), "utf-8");

describe("Task #2812: switch off-state contrast", () => {
  it("uses a darker off track with a visible border and thumb", () => {
    expect(switchSource).toContain("data-unchecked:border-[#3a4050]");
    expect(switchSource).toContain("data-unchecked:bg-[#2a3040]");
    expect(switchSource).toContain("data-unchecked:bg-[#6b7280]");
    expect(switchSource).toContain("data-disabled:opacity-70");
  });
});
