import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Task #1888 — SlipOK migration for order system", () => {
  describe("lib/slipok.ts adapter", () => {
    it("should exist and export verifySlip", async () => {
      const slipokPath = path.resolve("lib/slipok.ts");
      expect(fs.existsSync(slipokPath)).toBe(true);

      const content = fs.readFileSync(slipokPath, "utf-8");
      expect(content).toContain("export async function verifySlip");
      expect(content).toContain("SLIPOK_BRANCH_ID");
      expect(content).toContain("SLIPOK_API_KEY");
      expect(content).toContain("x-authorization");
    });

    it("should handle SlipOK error codes 1012, 1013, 1014", () => {
      const content = fs.readFileSync(
        path.resolve("lib/slipok.ts"),
        "utf-8",
      );
      expect(content).toContain('"1012"');
      expect(content).toContain('"1013"');
      expect(content).toContain('"1014"');
    });

    it("should use form-data with files field", () => {
      const content = fs.readFileSync(
        path.resolve("lib/slipok.ts"),
        "utf-8",
      );
      expect(content).toContain('formData.append("files"');
    });

    it("should support optional amount parameter for server-side validation", () => {
      const content = fs.readFileSync(
        path.resolve("lib/slipok.ts"),
        "utf-8",
      );
      expect(content).toContain('formData.append("amount"');
    });
  });

  describe("order slip route uses SlipOK", () => {
    it("should import from slipok, not easyslip", () => {
      const routePath = path.resolve("app/api/orders/[id]/slip/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content).toContain('from "@/lib/slipok"');
      expect(content).not.toContain('from "@/lib/easyslip"');
    });

    it("should call verifySlip with the original file", () => {
      const content = fs.readFileSync(
        path.resolve("app/api/orders/[id]/slip/route.ts"),
        "utf-8",
      );
      expect(content).toContain("verifySlip(slip");
    });

    it("should support pending manual review when SlipOK cannot auto-verify", () => {
      const content = fs.readFileSync(
        path.resolve("app/api/orders/[id]/slip/route.ts"),
        "utf-8",
      );
      expect(content).toContain("getPendingReviewMessage");
      expect(content).toContain("getManualReviewNote");
      expect(content).toContain('status: "VERIFYING"');
      expect(content).toContain("pending_review: true");
    });

    it("should auto-pay on successful verification", () => {
      const content = fs.readFileSync(
        path.resolve("app/api/orders/[id]/slip/route.ts"),
        "utf-8",
      );
      expect(content).toContain('"PAID"');
      expect(content).toContain("activateOrderPurchase");
      expect(content).toContain("ensureOrderDocument");
      expect(content).toContain("SlipOK verified");
    });

    it("should still check for duplicate transRef in our DB", () => {
      const content = fs.readFileSync(
        path.resolve("app/api/orders/[id]/slip/route.ts"),
        "utf-8",
      );
      expect(content).toContain("orderSlip.findFirst");
      expect(content).toContain("transRef");
    });
  });

  describe("upload route re-exports slip route", () => {
    it("v1 upload route should re-export from slip route", () => {
      const content = fs.readFileSync(
        path.resolve("app/api/v1/orders/[id]/upload/route.ts"),
        "utf-8",
      );
      expect(content).toContain("slip/route");
    });
  });

  describe("env configuration", () => {
    it("should have SLIPOK vars in env.ts schema", () => {
      const content = fs.readFileSync(
        path.resolve("lib/env.ts"),
        "utf-8",
      );
      expect(content).toContain("SLIPOK_BRANCH_ID");
      expect(content).toContain("SLIPOK_API_KEY");
    });

    it("should have SLIPOK vars in .env.example", () => {
      const content = fs.readFileSync(
        path.resolve(".env.example"),
        "utf-8",
      );
      expect(content).toContain("SLIPOK_BRANCH_ID");
      expect(content).toContain("SLIPOK_API_KEY");
    });

    it("should have SLIPOK vars in docker-compose.prod.yml", () => {
      const content = fs.readFileSync(
        path.resolve("docker-compose.prod.yml"),
        "utf-8",
      );
      expect(content).toContain("SLIPOK_BRANCH_ID");
      expect(content).toContain("SLIPOK_API_KEY");
    });
  });

  describe("easyslip.ts is preserved for topup flow", () => {
    it("easyslip.ts should still exist (used by topup, not order)", () => {
      expect(fs.existsSync(path.resolve("lib/easyslip.ts"))).toBe(true);
    });
  });
});
