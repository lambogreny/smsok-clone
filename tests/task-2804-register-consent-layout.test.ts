import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const registerPageSource = readFileSync(resolve(ROOT, "app/(auth)/register/page.tsx"), "utf-8");

describe("Task #2804: register consent layout", () => {
  it("keeps the consent copy wrapping cleanly inside a slightly wider shell", () => {
    expect(registerPageSource).toContain('max-w-[460px]');
    expect(registerPageSource).toContain('leading-relaxed break-words');
    expect(registerPageSource).not.toContain("whitespace-nowrap");
    expect(registerPageSource).toContain("อ่านเพิ่มเติม");
  });
});
