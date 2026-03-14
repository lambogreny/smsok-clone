"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Type,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─── Types ─── */

type DeliveryStatus = "idle" | "sending" | "delivered" | "failed";

/* ─── Confetti ─── */

function ConfettiEffect() {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; color: string; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    const colors = [
      "var(--accent)",
      "#FFD700",
      "#FF6B6B",
      "#4ECDC4",
      "#A78BFA",
      "#F472B6",
    ];
    const items = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -(Math.random() * 20),
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 6,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${1.5 + Math.random() * 1.5}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.3); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/* ─── Segment Calculator ─── */

function calcSegments(text: string): { chars: number; segments: number; encoding: string } {
  const chars = text.length;
  // Check if all chars are GSM 7-bit compatible
  const gsmRegex = /^[@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑÜa-zäöñüà\n\r]*$/;
  const isGsm = gsmRegex.test(text);
  const encoding = isGsm ? "GSM 7-bit" : "Unicode (UCS-2)";

  if (chars === 0) return { chars: 0, segments: 0, encoding };

  let segments: number;
  if (isGsm) {
    segments = chars <= 160 ? 1 : Math.ceil(chars / 153);
  } else {
    segments = chars <= 70 ? 1 : Math.ceil(chars / 67);
  }

  return { chars, segments, encoding };
}

/* ─── Delivery Timeline ─── */

function DeliveryTimeline({
  status,
  latencyMs,
}: {
  status: DeliveryStatus;
  latencyMs: number | null;
}) {
  const steps = [
    { id: "sent", label: "ส่งคำสั่ง", icon: Send },
    { id: "gateway", label: "Gateway รับ", icon: Zap },
    { id: "delivered", label: "ส่งถึงปลายทาง", icon: CheckCircle2 },
  ];

  const activeStep =
    status === "sending" ? 0 : status === "delivered" ? 3 : status === "failed" ? -1 : -1;

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="size-4" style={{ color: "var(--text-muted)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          สถานะการส่ง
        </span>
        {latencyMs != null && status === "delivered" && (
          <span
            className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(var(--accent-rgb), 0.1)",
              color: "var(--accent)",
            }}
          >
            {latencyMs < 1000 ? `${latencyMs}ms` : `${(latencyMs / 1000).toFixed(1)}s`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeStep;
          const isActive = idx === activeStep - 1 || (status === "sending" && idx === 0);
          const isPending = !isDone && !isActive;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isDone
                      ? "var(--accent)"
                      : isActive
                        ? "rgba(var(--accent-rgb), 0.15)"
                        : "var(--bg-muted)",
                    border: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  {isActive && status === "sending" ? (
                    <Loader2
                      className="size-4 animate-spin"
                      style={{ color: "var(--accent)" }}
                    />
                  ) : (
                    <Icon
                      className="size-4"
                      style={{
                        color: isDone
                          ? "var(--text-on-accent)"
                          : isActive
                            ? "var(--accent)"
                            : "var(--text-muted)",
                      }}
                    />
                  )}
                </div>
                <span
                  className="text-xs whitespace-nowrap"
                  style={{
                    color: isDone || isActive ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mb-5 rounded transition-all"
                  style={{
                    backgroundColor: isDone ? "var(--accent)" : "var(--border-default)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {status === "failed" && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: "rgba(var(--error-rgb, 239 68 68), 0.1)",
            color: "var(--error)",
            border: "1px solid rgba(var(--error-rgb, 239 68 68), 0.2)",
          }}
        >
          ส่งไม่สำเร็จ — กรุณาตรวจสอบเบอร์แล้วลองใหม่
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

const DEFAULT_MESSAGE = "ทดสอบจาก SMSOK — ระบบส่ง SMS สำหรับธุรกิจ สมัครฟรีวันนี้!";

export default function TestSmsPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [status, setStatus] = useState<DeliveryStatus>("idle");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { chars, segments, encoding } = calcSegments(message);
  const isPhoneValid = /^0\d{8,9}$/.test(phone);
  const canSend = isPhoneValid && message.trim().length > 0 && status !== "sending";

  const handleSend = useCallback(async () => {
    setStatus("sending");
    setError(null);
    setLatencyMs(null);
    setShowConfetti(false);

    const startTime = Date.now();

    try {
      const res = await fetch("/api/v1/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          message,
        }),
      });

      const elapsed = Date.now() - startTime;

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `ส่งไม่สำเร็จ (${res.status})`);
      }

      setLatencyMs(elapsed);
      setStatus("delivered");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }, [phone, message]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setLatencyMs(null);
    setError(null);
    setShowConfetti(false);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <MessageSquare className="size-6" style={{ color: "var(--accent)" }} />
          ทดสอบส่ง SMS
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          ส่ง SMS ทดสอบไปยังเบอร์ของคุณ เพื่อตรวจสอบว่าระบบทำงานได้ถูกต้อง
        </p>
      </div>

      {/* Form Card */}
      <div
        className="rounded-lg p-6 space-y-5"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Phone Input */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <Phone className="size-3.5" />
            เบอร์โทรศัพท์ผู้รับ
          </label>
          <Input
            type="tel"
            placeholder="0812345678"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            disabled={status === "sending"}
          />
          {phone.length > 0 && !isPhoneValid && (
            <p className="text-xs" style={{ color: "var(--error)" }}>
              กรุณากรอกเบอร์ 10 หลัก เริ่มต้นด้วย 0
            </p>
          )}
        </div>

        {/* Message Textarea */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <Type className="size-3.5" />
            ข้อความ
          </label>
          <textarea
            className="w-full rounded-lg p-3 text-sm resize-none outline-none transition-all focus:ring-2"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === "sending"}
            style={{
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-base)",
              color: "var(--text-primary)",
            }}
          />

          {/* Character & Segment Counter */}
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
            <span>{encoding}</span>
            <span>
              <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                {chars}
              </span>{" "}
              ตัวอักษร ·{" "}
              <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                {segments}
              </span>{" "}
              segment{segments !== 1 ? "s" : ""} ={" "}
              <span className="font-semibold" style={{ color: "var(--accent)" }}>
                {segments} SMS
              </span>
            </span>
          </div>
        </div>

        {/* Send Button */}
        {status === "delivered" ? (
          <div className="space-y-3">
            <div
              className="rounded-lg p-4 flex items-center gap-3"
              style={{
                backgroundColor: "rgba(var(--accent-rgb), 0.08)",
                border: "1px solid rgba(var(--accent-rgb), 0.2)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <Sparkles className="size-5" style={{ color: "var(--text-on-accent)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  ส่งสำเร็จ!
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  SMS ถูกส่งไปยังเบอร์ {phone} เรียบร้อยแล้ว
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleReset}
            >
              ส่งทดสอบอีกครั้ง
            </Button>
          </div>
        ) : (
          <Button
            className="w-full font-semibold"
            disabled={!canSend}
            onClick={handleSend}
            style={{
              backgroundColor: canSend ? "var(--accent)" : undefined,
              color: canSend ? "var(--text-on-accent)" : undefined,
            }}
          >
            {status === "sending" ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                ส่ง SMS ทดสอบ
              </>
            )}
          </Button>
        )}

        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "rgba(var(--error-rgb, 239 68 68), 0.08)",
              color: "var(--error)",
              border: "1px solid rgba(var(--error-rgb, 239 68 68), 0.2)",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Delivery Timeline */}
      {status !== "idle" && (
        <DeliveryTimeline status={status} latencyMs={latencyMs} />
      )}

      {/* Next Steps */}
      {status === "delivered" && (
        <div
          className="rounded-lg p-5 space-y-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            ขั้นตอนถัดไป
          </h3>
          <div className="space-y-2">
            {[
              {
                href: "/dashboard/senders",
                label: "ลงทะเบียน Sender Name",
                desc: "แสดงชื่อธุรกิจแทนเบอร์โทร",
                icon: Type,
              },
              {
                href: "/dashboard/contacts",
                label: "นำเข้ารายชื่อผู้ติดต่อ",
                desc: "เพิ่มเบอร์จาก CSV หรือพิมพ์เอง",
                icon: Phone,
              },
              {
                href: "/dashboard/send",
                label: "ส่ง SMS จริง",
                desc: "ส่ง SMS ถึงลูกค้าของคุณ",
                icon: Send,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-[rgba(var(--accent-rgb),0.05)]"
                style={{ border: "1px solid var(--border-default)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--bg-muted)" }}
                >
                  <item.icon className="size-4" style={{ color: "var(--accent)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0" style={{ color: "var(--text-muted)" }} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
