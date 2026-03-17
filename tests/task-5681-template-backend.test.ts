import { describe, expect, it } from "vitest";
import {
  buildTemplatePreview,
  extractVariableTokens,
  findTemplateSyntaxWarnings,
} from "@/lib/template-utils";

describe("Task #5681 template backend helpers", () => {
  it("extracts unique template tokens and preserves default values", () => {
    expect(extractVariableTokens("สวัสดี {{name|ลูกค้า}} {{name|ลูกค้า}} {{order.id}}")).toEqual([
      { key: "name", defaultValue: "ลูกค้า" },
      { key: "order.id" },
    ]);
  });

  it("builds preview content with provided variables, sample fallbacks, and worst-case text", () => {
    const preview = buildTemplatePreview("สวัสดี {{name}} เบอร์ {{phone}}", { name: "สมชาย" });

    expect(preview.rendered).toContain("สมชาย");
    expect(preview.rendered).toContain("0812345678");
    expect(preview.missing).toEqual(["phone"]);
    expect(preview.previewVariables).toEqual({
      name: "สมชาย",
      phone: "0812345678",
    });
    expect(preview.worstCaseVariables).toEqual({
      name: "Very Important Customer",
      phone: "0812345678",
    });
    expect(preview.worstCaseRendered).toContain("Very Important Customer");
  });

  it("keeps duplicate placeholders with per-occurrence defaults in rendered preview", () => {
    const preview = buildTemplatePreview("{{name|ลูกค้า A}} / {{name|ลูกค้า B}}");

    expect(preview.rendered).toBe("ลูกค้า A / ลูกค้า B");
    expect(preview.worstCaseRendered).toBe("ลูกค้า A / ลูกค้า B");
  });

  it("does not mark default-backed variables as missing", () => {
    const preview = buildTemplatePreview("OTP {{code|000000}} ถึง {{name|ลูกค้า}}");

    expect(preview.missing).toEqual([]);
    expect(preview.rendered).toBe("OTP 000000 ถึง ลูกค้า");
  });

  it("reports syntax warnings for unmatched braces and empty variable names", () => {
    expect(findTemplateSyntaxWarnings("รหัส {{ }} และ {{name")).toEqual([
      "Unmatched template braces",
      "Template variable name is required",
    ]);
  });
});
