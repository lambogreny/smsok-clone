import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const homePageSource = readFileSync(resolve(ROOT, "app/page.tsx"), "utf-8");
const rootLayoutSource = readFileSync(resolve(ROOT, "app/layout.tsx"), "utf-8");

describe("Task #2795: home SEO title override", () => {
  it("uses an absolute home title so the root layout template does not duplicate SMSOK", () => {
    expect(homePageSource).toContain('absolute: "SMSOK - แพลตฟอร์มส่ง SMS มาตรฐานระดับโลก"');
    expect(homePageSource).not.toContain('title: "SMSOK — แพลตฟอร์มส่ง SMS สำหรับธุรกิจ | ทดลองฟรี 500 SMS"');
    expect(rootLayoutSource).toContain('template: "%s | SMSOK"');
  });
});
