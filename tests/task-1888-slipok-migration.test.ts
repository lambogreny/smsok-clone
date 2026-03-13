import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Task #1888 — EasySlip verification for order system", () => {
  describe("lib/easyslip.ts adapter", () => {
    it("should exist and export verifySlipByUrl", async () => {
      const easyslipPath = path.resolve("lib/easyslip.ts");
      expect(fs.existsSync(easyslipPath)).toBe(true);

      const content = fs.readFileSync(easyslipPath, "utf-8");
      expect(content).toContain("export async function verifySlipByUrl");
      expect(content).toContain("EASYSLIP_API_KEY");
    });

    it("should NOT have any SlipOK references", () => {
      const content = fs.readFileSync(
        path.resolve("lib/easyslip.ts"),
        "utf-8",
      );
      expect(content.toLowerCase()).not.toContain("slipok");
    });
  });

  describe("lib/slipok.ts should NOT exist", () => {
    it("slipok.ts must be deleted", () => {
      expect(fs.existsSync(path.resolve("lib/slipok.ts"))).toBe(false);
    });
  });

  describe("order slip verification flow uses EasySlip through the worker service", () => {
    it("queues the canonical route instead of verifying inside the request", () => {
      const routePath = path.resolve("app/api/orders/[id]/slip/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content).toContain('from "@/lib/queue/queues"');
      expect(content).toContain("slipVerifyQueue.add");
    });

    it("calls verifySlipByUrl with signed R2 URL inside the worker service", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain("verifySlipByUrl");
      expect(content).toContain("getSignedDownloadUrlFromR2");
      expect(content).not.toContain("from \"@/lib/slipok\"");
    });

    it("supports pending manual review when EasySlip cannot auto-verify", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain("getPendingReviewMessage");
      expect(content).toContain("getManualReviewNote");
      expect(content).toContain('status: "VERIFYING"');
      expect(content).toContain("manual_review");
    });

    it("auto-pays on successful verification inside the worker service", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain('"PAID"');
      expect(content).toContain("activateOrderPurchase");
      expect(content).toContain("ensureOrderDocument");
      expect(content).toContain("EasySlip verified");
    });

    it("has NO SlipOK references in slip-verification.ts", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).not.toContain("SlipOK");
      expect(content).not.toContain("slipok");
    });

    it("still checks for duplicate transRef in our DB", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
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
    it("should have EASYSLIP_API_KEY in env.ts schema", () => {
      const content = fs.readFileSync(
        path.resolve("lib/env.ts"),
        "utf-8",
      );
      expect(content).toContain("EASYSLIP_API_KEY");
    });

    it("should NOT have SLIPOK vars in env.ts schema", () => {
      const content = fs.readFileSync(
        path.resolve("lib/env.ts"),
        "utf-8",
      );
      expect(content).not.toContain("SLIPOK_BRANCH_ID");
      expect(content).not.toContain("SLIPOK_API_KEY");
    });

    it("should NOT have SLIPOK vars in .env.example", () => {
      const content = fs.readFileSync(
        path.resolve(".env.example"),
        "utf-8",
      );
      expect(content).not.toContain("SLIPOK_BRANCH_ID");
      expect(content).not.toContain("SLIPOK_API_KEY");
    });

    it("should NOT have SLIPOK vars in docker-compose.prod.yml", () => {
      const content = fs.readFileSync(
        path.resolve("docker-compose.prod.yml"),
        "utf-8",
      );
      expect(content).not.toContain("SLIPOK_BRANCH_ID");
      expect(content).not.toContain("SLIPOK_API_KEY");
    });
  });
});
