"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Type,
  Users,
  Send,
  Key,
  Check,
  ChevronRight,
  Sparkles,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type WelcomeContentProps = {
  firstName: string;
  completedSteps: string[];
  smsRemaining: number;
};

const ONBOARDING_STEPS = [
  {
    id: "sender",
    number: 1,
    title: "ตั้งค่า Sender Name",
    description: "ขอชื่อผู้ส่ง SMS เพื่อสร้างความน่าเชื่อถือ",
    href: "/dashboard/senders",
    icon: Type,
    cta: "ตั้งค่า Sender Name",
  },
  {
    id: "contacts",
    number: 2,
    title: "นำเข้ารายชื่อผู้ติดต่อ",
    description: "อัพโหลด CSV หรือเพิ่มเบอร์โทรด้วยตนเอง",
    href: "/dashboard/contacts",
    icon: Users,
    cta: "เพิ่มรายชื่อ",
  },
  {
    id: "test-sms",
    number: 3,
    title: "ทดลองส่ง SMS",
    description: "ลองส่ง SMS ฟรี 15 ข้อความแรก",
    href: "/dashboard/send",
    icon: Send,
    cta: "ส่ง SMS ทดลอง",
  },
  {
    id: "api",
    number: 4,
    title: "สำรวจ API",
    description: "สร้าง API Key สำหรับเชื่อมต่อระบบ",
    href: "/dashboard/api-keys",
    icon: Key,
    cta: "สร้าง API Key",
  },
] as const;

export default function WelcomeContent({
  firstName,
  completedSteps,
  smsRemaining,
}: WelcomeContentProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(() => {
    const firstIncomplete = ONBOARDING_STEPS.find(
      (s) => !completedSteps.includes(s.id)
    );
    return firstIncomplete?.id ?? null;
  });

  const completedCount = ONBOARDING_STEPS.filter((s) =>
    completedSteps.includes(s.id)
  ).length;
  const totalSteps = ONBOARDING_STEPS.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="px-8 py-6 max-md:px-4 max-w-3xl mx-auto">
      {/* ── Hero Welcome ── */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
          style={{
            background: "rgba(var(--accent-rgb), 0.08)",
            border: "1px solid rgba(var(--accent-rgb), 0.2)",
          }}
        >
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
          <span
            className="text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            {smsRemaining} SMS ฟรีพร้อมใช้งาน
          </span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          ยินดีต้อนรับสู่ SMSOK!
        </h1>
        <p className="text-base text-[var(--text-secondary)] mb-1">
          สวัสดี {firstName}!
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          เริ่มต้นใช้งานง่ายๆ ใน 4 ขั้นตอน
        </p>
      </div>

      {/* ── Progress Bar ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift
              size={16}
              style={{ color: "var(--accent)" }}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              ความคืบหน้า
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {completedCount} จาก {totalSteps} ขั้นตอน
          </span>
        </div>

        <div
          className="w-full h-2 rounded-full overflow-hidden mb-1"
          style={{ background: "var(--border-default)" }}
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-label={`ความคืบหน้า ${percentage}%`}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              background: "var(--accent)",
            }}
          />
        </div>
        <div className="text-right">
          <span className="text-[11px] text-[var(--text-muted)]">
            {percentage}%
          </span>
        </div>
      </div>

      {/* ── Onboarding Steps ── */}
      <div className="space-y-3 mb-6">
        {ONBOARDING_STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isExpanded = expandedStep === step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden transition-all duration-200"
              style={
                isExpanded && !isCompleted
                  ? { borderColor: "rgba(var(--accent-rgb), 0.3)" }
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedStep(isExpanded ? null : step.id)
                }
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
              >
                {/* Number circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors"
                  style={
                    isCompleted
                      ? {
                          background: "var(--accent)",
                          color: "var(--bg-base)",
                        }
                      : {
                          background: "var(--border-default)",
                          color: "var(--text-secondary)",
                        }
                  }
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Title + icon */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon
                    size={16}
                    className="shrink-0"
                    style={{
                      color: isCompleted
                        ? "var(--text-muted)"
                        : "var(--text-secondary)",
                    }}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isCompleted ? "line-through" : ""
                    }`}
                    style={{
                      color: isCompleted
                        ? "var(--text-muted)"
                        : "var(--text-primary)",
                    }}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Completed badge or chevron */}
                {isCompleted ? (
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(var(--accent-rgb), 0.08)",
                      color: "var(--accent)",
                    }}
                  >
                    เสร็จแล้ว
                  </span>
                ) : (
                  <ChevronRight
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    style={{ color: "var(--text-muted)" }}
                  />
                )}
              </button>

              {/* Expandable content */}
              {isExpanded && !isCompleted && (
                <div className="px-4 pb-4 pt-0">
                  <div className="ml-11">
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                      {step.description}
                    </p>
                    <Link href={step.href}>
                      <Button
                        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold rounded-lg text-sm"
                        size="sm"
                      >
                        {step.cta}
                        <ChevronRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Skip to Dashboard ── */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          ข้ามไปหน้า Dashboard
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
