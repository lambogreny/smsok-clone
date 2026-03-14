import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Task #1888 — EasySlip verification for order system", () => {
  describe("lib/easyslip.ts adapter", () => {
    it("exists and exports verifySlipByUrl", () => {
      const easyslipPath = path.resolve("lib/easyslip.ts");
      expect(fs.existsSync(easyslipPath)).toBe(true);

      const content = fs.readFileSync(easyslipPath, "utf-8");
      expect(content).toContain("export async function verifySlipByUrl");
      expect(content).toContain("EASYSLIP_API_KEY");
    });
  });

  describe("order slip verification flow uses EasySlip through the worker service", () => {
    it("queues the canonical route instead of verifying inside the request", () => {
      const routePath = path.resolve("app/api/orders/[id]/slip/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content).toContain('from "@/lib/queue/queues"');
      expect(content).toContain("slipVerifyQueue.add");
    });

    it("calls verifySlipByUrl with an R2-backed public URL inside the worker service", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain("verifySlipByUrl");
      expect(content).toContain("R2_PUBLIC_URL");
      expect(content).toContain("verifySlipByUrl(publicUrl)");
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

    it("still checks for duplicate transRef in our DB", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain("orderSlip.findFirst");
      expect(content).toContain("transRef");
    });
  });

  describe("upload route re-exports slip route", () => {
    it("v1 upload route re-exports from slip route", () => {
      const content = fs.readFileSync(
        path.resolve("app/api/v1/orders/[id]/upload/route.ts"),
        "utf-8",
      );
      expect(content).toContain("slip/route");
    });
  });

  describe("env configuration", () => {
    it("has EASYSLIP_API_KEY in env.ts schema", () => {
      const content = fs.readFileSync(
        path.resolve("lib/env.ts"),
        "utf-8",
      );
      expect(content).toContain("EASYSLIP_API_KEY");
    });

    it("has EasySlip config in .env.example", () => {
      const content = fs.readFileSync(
        path.resolve(".env.example"),
        "utf-8",
      );
      expect(content).toContain("EASYSLIP_API_KEY");
      expect(content).toContain("EASYSLIP_API_URL");
    });

    it("has EasySlip config in docker-compose.prod.yml", () => {
      const content = fs.readFileSync(
        path.resolve("docker-compose.prod.yml"),
        "utf-8",
      );
      expect(content).toContain("EASYSLIP_API_KEY");
      expect(content).toContain("EASYSLIP_API_URL");
    });
  });
});
