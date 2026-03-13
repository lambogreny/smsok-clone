"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2 } from "lucide-react";

interface ReconsentModalProps {
  fromVersion: string;
  toVersion: string;
  date: string;
  changes: string[];
  policyUrl?: string;
  onAccept: () => void | Promise<void>;
}

export default function ReconsentModal({
  fromVersion,
  toVersion,
  date,
  changes,
  policyUrl = "/privacy",
  onAccept,
}: ReconsentModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleAccept() {
    if (!accepted) return;
    setSubmitting(true);
    try {
      await onAccept();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-[440px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-8 shadow-2xl">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-5">
          <FileText className="w-6 h-6 text-[var(--accent)]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">
          นโยบายความเป็นส่วนตัวมีการอัพเดท
        </h2>

        {/* Version info */}
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] mb-1">
          <span>เวอร์ชัน: {fromVersion}</span>
          <span className="text-[var(--text-muted)]">→</span>
          <span className="text-[var(--accent)] font-medium">{toVersion}</span>
        </div>
        <p className="text-[13px] text-[var(--text-muted)] text-center mb-5">วันที่: {date}</p>

        {/* Changes */}
        <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl p-4 mb-5">
          <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-2">สรุปการเปลี่ยนแปลง:</p>
          <ul className="space-y-1.5">
            {changes.map((change) => (
              <li key={change} className="text-[13px] text-[var(--text-muted)] flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">•</span>
                {change}
              </li>
            ))}
          </ul>
        </div>

        {/* Read full policy link */}
        <Link
          href={policyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[13px] text-[var(--accent-blue)] hover:underline mb-5"
        >
          <FileText className="w-3.5 h-3.5" />
          อ่านนโยบายฉบับเต็ม
        </Link>

        {/* Consent checkbox */}
        <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5 border-[var(--border-subtle)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
          />
          <span className="text-[13px] text-[var(--text-secondary)] leading-snug">
            ฉันยอมรับนโยบายฉบับใหม่ ({toVersion})
          </span>
        </label>

        {/* Accept button */}
        <Button
          onClick={handleAccept}
          disabled={!accepted || submitting}
          className={cn(
            "w-full h-12 rounded-xl text-[15px] font-semibold transition-all duration-200",
            "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)]",
            "hover:shadow-[0_4px_16px_rgba(0,255,167,0.25)]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังบันทึก...
            </span>
          ) : (
            "ยอมรับและดำเนินการต่อ"
          )}
        </Button>
      </div>
    </div>
  );
}
