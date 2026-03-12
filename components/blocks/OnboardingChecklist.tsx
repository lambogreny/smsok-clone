"use client";

import { useState } from "react";
import {
  Gift,
  Type,
  Users,
  MessageSquare,
  Package,
  Send,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type OnboardingChecklistProps = {
  completedSteps?: string[]; // e.g. ["sender", "contacts", "test-sms"]
};

const STEPS = [
  {
    id: "sender",
    label: "ตั้งชื่อ Sender Name",
    icon: Type,
    href: "/sender-names",
  },
  {
    id: "contacts",
    label: "นำเข้ารายชื่อ",
    icon: Users,
    href: "/contacts",
  },
  {
    id: "test-sms",
    label: "ทดสอบ SMS",
    icon: MessageSquare,
    href: "/send",
  },
  {
    id: "packages",
    label: "ซื้อแพ็กเกจ",
    icon: Package,
    href: "/packages",
  },
  {
    id: "campaign",
    label: "สร้าง Campaign แรก",
    icon: Send,
    href: "/campaigns/new",
  },
] as const;

export default function OnboardingChecklist({
  completedSteps = [],
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const completedCount = STEPS.filter((step) =>
    completedSteps.includes(step.id)
  ).length;
  const totalSteps = STEPS.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  const allDone = completedCount === totalSteps;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift
            size={18}
            style={{ color: "var(--accent)" }}
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-white leading-none">
            เริ่มต้นใช้งาน SMSOK
          </h2>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setDismissed(true)}
          className="text-xs h-auto px-2 py-1"
          style={{ color: "var(--text-muted)" }}
          aria-label="ซ่อน onboarding checklist"
        >
          ซ่อน
        </Button>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden mb-2"
        style={{
          height: "6px",
          background: "var(--border-default)",
        }}
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`ความคืบหน้า ${completedCount} จาก ${totalSteps} ขั้นตอน`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: "var(--accent)",
          }}
        />
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="font-semibold text-white">{completedCount}</span>{" "}
          จาก {totalSteps} ขั้นตอน
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {percentage}%
        </span>
      </div>

      {/* Checklist items */}
      <ul className="space-y-2.5 mb-4" role="list">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className="flex items-center gap-3"
            >
              {/* Status icon */}
              {isCompleted ? (
                <CheckCircle2
                  size={18}
                  className="shrink-0"
                  style={{ color: "var(--accent)" }}
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  size={18}
                  className="shrink-0"
                  style={{ color: "var(--border-default)" }}
                  aria-hidden="true"
                />
              )}

              {/* Step icon */}
              <Icon
                size={14}
                className="shrink-0"
                style={{
                  color: isCompleted
                    ? "var(--text-muted)"
                    : "var(--text-secondary)",
                }}
                aria-hidden="true"
              />

              {/* Label */}
              <span
                className={`flex-1 text-sm leading-none ${
                  isCompleted ? "line-through" : ""
                }`}
                style={{
                  color: isCompleted
                    ? "var(--text-muted)"
                    : "var(--text-secondary)",
                }}
              >
                {step.label}
              </span>

              {/* CTA link */}
              {!isCompleted && (
                <a
                  href={step.href}
                  className="text-xs font-medium shrink-0 transition-opacity hover:opacity-70"
                  style={{ color: "var(--accent)" }}
                  aria-label={`ทำขั้นตอน: ${step.label}`}
                >
                  ทำเลย →
                </a>
              )}
            </li>
          );
        })}
      </ul>

      {/* Bonus banner */}
      <div
        className="rounded-xl px-4 py-3 text-center text-sm font-medium"
        style={{
          background: allDone
            ? "rgba(var(--accent-rgb, 0 128 128) / 0.08)"
            : "var(--border-default)",
          color: allDone ? "var(--accent)" : "var(--text-secondary)",
        }}
      >
        {allDone
          ? "✅ คุณได้รับ 50 SMS ฟรีแล้ว!"
          : "🎁 ทำครบ 5 ขั้นตอน รับ 50 SMS ฟรี!"}
      </div>
    </div>
  );
}
