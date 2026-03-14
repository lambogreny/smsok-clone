"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLICY_VERSION_KEY = "smsok-policy-version";
const CURRENT_POLICY_VERSION = "v1.0";

export default function ReconsentModal() {
  const [open, setOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    // Check if user has accepted current policy version
    const storedVersion = localStorage.getItem(POLICY_VERSION_KEY);

    // Only show if user previously accepted a different version
    // (not for brand new users who haven't accepted anything yet)
    if (storedVersion && storedVersion !== CURRENT_POLICY_VERSION) {
      setOpen(true);
    } else if (!storedVersion) {
      // First visit — save current version silently
      localStorage.setItem(POLICY_VERSION_KEY, CURRENT_POLICY_VERSION);
    }
  }, []);

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    try {
      await fetch("/api/v1/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          consents: [
            { consentType: "SERVICE", action: "OPT_IN", policyVersion: CURRENT_POLICY_VERSION },
            { consentType: "THIRD_PARTY", action: "OPT_IN", policyVersion: CURRENT_POLICY_VERSION },
          ],
        }),
      });
    } catch {
      // Still close — consent logged client-side
    }

    localStorage.setItem(POLICY_VERSION_KEY, CURRENT_POLICY_VERSION);
    setOpen(false);
    setAccepting(false);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in-scale">
      {/* Backdrop — no dismiss on click (forced acceptance) */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Icon */}
        <div className="w-14 h-14 rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-5">
          <Shield className="w-7 h-7 text-[var(--accent)]" />
        </div>

        <h2 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">
          นโยบายอัปเดต
        </h2>
        <p className="text-[13px] text-[var(--text-secondary)] text-center mb-5 leading-relaxed">
          เราได้ปรับปรุงข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว
          เป็นเวอร์ชัน <span className="font-semibold text-[var(--accent)]">{CURRENT_POLICY_VERSION}</span>{" "}
          กรุณาอ่านและยอมรับเพื่อใช้งานต่อ
        </p>

        {/* Policy links */}
        <div className="space-y-2 mb-6">
          <Link
            href="/terms"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <FileText className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)]">
              ข้อกำหนดการใช้งาน
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </Link>
          <Link
            href="/privacy"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)]">
              นโยบายความเป็นส่วนตัว
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </Link>
        </div>

        {/* Accept button (mandatory) */}
        <Button
          className="w-full font-semibold bg-[var(--accent)] text-[var(--text-on-accent)] hover:brightness-110 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? "กำลังบันทึก..." : "ฉันยอมรับข้อกำหนดใหม่"}
        </Button>

        <p className="mt-3 text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
          คุณต้องยอมรับเพื่อใช้งาน SMSOK ต่อ หากไม่ยอมรับ
          กรุณาติดต่อ support@smsok.com
        </p>
      </div>
    </div>
  );
}
