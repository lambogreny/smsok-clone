"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  Upload,
  Keyboard,
  SkipForward,
  MessageSquare,
  Package,
  Megaphone,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  Phone,
  User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactImportMode = "csv" | "manual" | "skip";
interface ApiPackage {
  id: string;
  sms: number;
  price: number;
  label?: string;
}

interface WizardState {
  senderName: string;
  contactMode: ContactImportMode | null;
  manualPhones: string;
  testPhone: string;
  testMessage: string;
  testSent: boolean;
  testSending: boolean;
  testError: string | null;
  selectedPackage: string | null;
  campaignName: string;
}

// ─── Step Progress Bar ─────────────────────────────────────────────────────────

const STEP_LABELS = [
  "ชื่อผู้ส่ง",
  "รายชื่อ",
  "ทดสอบ SMS",
  "ซื้อแพ็กเกจ",
  "Campaign",
];

function StepProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Circle + Label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={{
                  backgroundColor:
                    isCompleted || isActive
                      ? "var(--accent)"
                      : "transparent",
                  border:
                    isCompleted || isActive
                      ? "2px solid var(--accent)"
                      : "2px solid var(--border-default)",
                  color:
                    isCompleted || isActive
                      ? "var(--text-on-accent)"
                      : "var(--text-muted)",
                }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{
                  color: isActive
                    ? "var(--accent)"
                    : isCompleted
                    ? "var(--text-secondary)"
                    : "var(--text-muted)",
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEP_LABELS.length - 1 && (
              <div
                className="w-12 h-0.5 mx-1 mb-5 transition-all"
                style={{
                  backgroundColor:
                    step < currentStep
                      ? "var(--accent)"
                      : "var(--border-default)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — ตั้งชื่อ Sender Name ────────────────────────────────────────────

function Step1({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  const value = state.senderName;
  const sanitized = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const isValid = sanitized.length >= 3 && sanitized.length <= 11;
  const tooShort = sanitized.length > 0 && sanitized.length < 3;
  const tooLong = sanitized.length > 11;

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          ตั้งชื่อ Sender Name
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ชื่อที่ผู้รับจะเห็นแทนเบอร์โทรศัพท์ของคุณ
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Sender Name (3–11 ตัวอักษร, ภาษาอังกฤษ/ตัวเลข)
        </label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            className="pl-9 uppercase tracking-widest"
            placeholder="MYSENDER"
            value={sanitized}
            maxLength={11}
            onChange={(e) =>
              onChange({
                senderName: e.target.value
                  .replace(/[^A-Za-z0-9]/g, "")
                  .toUpperCase(),
              })
            }
          />
        </div>

        {tooShort && (
          <p className="text-xs text-[var(--error)]">ต้องมีอย่างน้อย 3 ตัวอักษร</p>
        )}
        {tooLong && (
          <p className="text-xs text-[var(--error)]">ต้องไม่เกิน 11 ตัวอักษร</p>
        )}
        {isValid && (
          <p className="text-xs" style={{ color: "var(--accent)" }}>
            ✓ รูปแบบถูกต้อง
          </p>
        )}
      </div>

      {/* Preview */}
      {sanitized.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            ตัวอย่างที่ผู้รับจะเห็น
          </p>
          <div
            className="rounded-lg p-3 inline-block text-sm font-medium"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
          >
            ผู้รับจะเห็น:{" "}
            <span className="font-bold tracking-wide">
              {sanitized || "SENDER"}
            </span>
          </div>
        </div>
      )}

      {/* Info box */}
      <div
        className="rounded-lg p-4 flex gap-3"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <span className="text-lg">ℹ️</span>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ชื่อผู้ส่งต้องได้รับอนุมัติจาก NBTC (1–3 วันทำการ)
          ในระหว่างนี้คุณยังสามารถส่ง SMS ด้วยเบอร์โทรศัพท์ปกติได้
        </p>
      </div>
    </div>
  );
}

// ─── Step 2 — นำเข้ารายชื่อ ───────────────────────────────────────────────────

const IMPORT_OPTIONS = [
  {
    id: "csv" as ContactImportMode,
    icon: Upload,
    title: "อัปโหลด CSV",
    desc: "นำเข้าจากไฟล์ Excel หรือ CSV",
  },
  {
    id: "manual" as ContactImportMode,
    icon: Keyboard,
    title: "พิมพ์เอง",
    desc: "กรอกเบอร์โทรศัพท์ด้วยตนเอง",
  },
  {
    id: "skip" as ContactImportMode,
    icon: SkipForward,
    title: "ข้ามไปก่อน",
    desc: "เพิ่มรายชื่อภายหลังได้",
  },
];

function Step2({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const phoneCount = state.manualPhones
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^0\d{8,9}$/.test(s)).length;

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          นำเข้ารายชื่อผู้รับ
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          เลือกวิธีที่สะดวกสำหรับคุณ
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {IMPORT_OPTIONS.map(({ id, icon: Icon, title, desc }) => {
          const selected = state.contactMode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ contactMode: id })}
              className="flex flex-col items-center gap-2 rounded-lg p-4 text-center transition-all cursor-pointer"
              style={{
                border: selected
                  ? "2px solid var(--accent)"
                  : "2px solid var(--border-default)",
                backgroundColor: selected
                  ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                  : "var(--bg-surface)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: selected
                    ? "var(--accent)"
                    : "var(--border-default)",
                  color: selected ? "var(--text-on-accent)" : "var(--text-muted)",
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* CSV hidden input */}
      {state.contactMode === "csv" && (
        <div
          className="rounded-lg p-6 text-center"
          style={{ border: "2px dashed var(--border-default)" }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
          />
          <Upload
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            ลากไฟล์มาวางที่นี่ หรือ
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            เลือกไฟล์ CSV
          </Button>
        </div>
      )}

      {/* Manual textarea */}
      {state.contactMode === "manual" && (
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            กรอกเบอร์โทรศัพท์ (1 เบอร์ต่อบรรทัด)
          </label>
          <textarea
            className="w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 transition-all"
            rows={6}
            placeholder={"0812345678\n0898765432\n0661234567"}
            value={state.manualPhones}
            onChange={(e) => onChange({ manualPhones: e.target.value })}
            style={{
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            {phoneCount} เบอร์พร้อมใช้
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 3 — ทดสอบ SMS ───────────────────────────────────────────────────────

function Step3({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  async function handleSend() {
    onChange({ testSending: true, testError: null });
    try {
      const res = await fetch("/api/v1/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: state.testPhone,
          message: state.testMessage,
          sender: state.senderName || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `ส่งไม่สำเร็จ (${res.status})`);
      }
      onChange({ testSent: true, testSending: false });
    } catch (err) {
      onChange({
        testSending: false,
        testError: err instanceof Error ? err.message : "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          ทดสอบส่ง SMS
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ส่ง SMS ทดสอบไปยังเบอร์ของคุณเพื่อตรวจสอบการตั้งค่า
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            เบอร์ทดสอบ
          </label>
          <div className="relative">
            <Phone
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <Input
              type="tel"
              className="pl-9"
              placeholder="0812345678"
              maxLength={10}
              value={state.testPhone}
              onChange={(e) =>
                onChange({ testPhone: e.target.value.replace(/\D/g, "") })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            ข้อความทดสอบ
          </label>
          <textarea
            className="w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 transition-all"
            rows={4}
            value={state.testMessage}
            onChange={(e) => onChange({ testMessage: e.target.value })}
            style={{
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          />
          <p className="text-xs text-right" style={{ color: "var(--text-muted)" }}>
            {state.testMessage.length} ตัวอักษร
          </p>
        </div>
      </div>

      {state.testError && (
        <div
          className="rounded-lg p-4 flex items-center gap-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--error, #ef4444) 10%, transparent)",
            border: "1px solid var(--error, #ef4444)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--error, #ef4444)" }}>
            {state.testError}
          </p>
        </div>
      )}

      {state.testSent ? (
        <div
          className="rounded-lg p-4 flex items-center gap-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
            border: "1px solid var(--accent)",
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--accent)]">
            <Check className="w-4 h-4 text-[var(--bg-base)]" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>ส่งสำเร็จ!</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              ตรวจสอบ SMS ที่เบอร์ {state.testPhone}
            </p>
          </div>
        </div>
      ) : (
        <Button
          className="w-full font-semibold"
          disabled={state.testPhone.length < 9 || state.testSending}
          onClick={handleSend}
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--text-on-accent)",
          }}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {state.testSending ? "กำลังส่ง..." : "ส่ง SMS ทดสอบ"}
        </Button>
      )}
    </div>
  );
}

// ─── Step 4 — ซื้อแพ็กเกจ ──────────────────────────────────────────────────────

function Step4({
  state,
  onChange,
  onSkip,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
  onSkip: () => void;
}) {
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPackages() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/packages");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setPackages(Array.isArray(data) ? data : data.packages ?? []);
        }
      } catch {
        if (!cancelled) {
          setError("ไม่สามารถโหลดแพ็กเกจได้");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPackages();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          ซื้อแพ็กเกจ SMS
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          เลือกแพ็กเกจที่เหมาะกับการใช้งานของคุณ
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            กำลังโหลดแพ็กเกจ...
          </p>
        </div>
      ) : error || packages.length === 0 ? (
        <div
          className="rounded-lg p-6 text-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Package className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ยังไม่มีแพ็กเกจ — ไปหน้าซื้อแพ็กเกจได้ภายหลัง
          </p>
        </div>
      ) : (
        <div className={`grid gap-3 ${packages.length >= 3 ? "grid-cols-3" : packages.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"}`}>
          {packages.map((pkg) => {
            const selected = state.selectedPackage === pkg.id;
            const featured = pkg.label === "ยอดนิยม";

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => onChange({ selectedPackage: pkg.id })}
                className="relative flex flex-col items-center gap-2 rounded-lg p-4 text-center transition-all cursor-pointer"
                style={{
                  border: selected
                    ? "2px solid var(--accent)"
                    : featured
                    ? "2px solid var(--accent)"
                    : "2px solid var(--border-default)",
                  backgroundColor: selected
                    ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                    : featured
                    ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                    : "var(--bg-surface)",
                }}
              >
                {featured && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--text-on-accent)",
                    }}
                  >
                    ยอดนิยม
                  </span>
                )}

                <Package
                  className="w-6 h-6"
                  style={{ color: selected ? "var(--accent)" : "var(--text-muted)" }}
                />
                <div>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {pkg.sms.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    SMS
                  </p>
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  ฿{pkg.price.toLocaleString()}
                </p>
                {selected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    <Check className="w-3 h-3" style={{ color: "var(--text-on-accent)" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm underline underline-offset-2 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          ข้ามไปก่อน
        </button>
      </div>
    </div>
  );
}

// ─── Step 5 — สร้าง Campaign แรก ─────────────────────────────────────────────

function Step5({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  const phoneCount = state.manualPhones
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^0\d{8,9}$/.test(s)).length;

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          สร้าง Campaign แรก
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ตั้งชื่อ Campaign และตรวจสอบรายละเอียดก่อนเริ่มต้น
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          ชื่อ Campaign
        </label>
        <div className="relative">
          <Megaphone
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            className="pl-9"
            placeholder="Campaign แรกของฉัน"
            value={state.campaignName}
            onChange={(e) => onChange({ campaignName: e.target.value })}
          />
        </div>
      </div>

      {/* Preview card */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          สรุป Campaign
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Sender Name</span>
            <span
              className="font-semibold tracking-wide"
              style={{ color: "var(--text-primary)" }}
            >
              {state.senderName || "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>ข้อความ</span>
            <span
              className="text-right max-w-[60%] truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {state.testMessage || "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>จำนวนผู้รับ</span>
            <span style={{ color: "var(--text-primary)" }}>
              {phoneCount > 0
                ? `${phoneCount} เบอร์`
                : state.contactMode === "skip"
                ? "ยังไม่มีรายชื่อ"
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>SMS ที่ต้องใช้</span>
            <span style={{ color: "var(--text-primary)" }}>
              {phoneCount > 0 ? `${phoneCount} SMS` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Completion State ─────────────────────────────────────────────────────────

function CompletionCard({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="text-center space-y-6 py-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
      >
        <PartyPopper className="w-10 h-10" style={{ color: "var(--accent)" }} />
      </div>

      <div className="space-y-2">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          ยินดีด้วย! 🎉
        </h2>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          คุณพร้อมใช้งาน SMSOK แล้ว
        </p>
      </div>

      <Button
        size="lg"
        className="w-full font-semibold"
        onClick={onGoToDashboard}
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--text-on-accent)",
        }}
      >
        ไปหน้า Dashboard
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [wizardState, setWizardState] = useState<WizardState>({
    senderName: "",
    contactMode: null,
    manualPhones: "",
    testPhone: "",
    testMessage: "ทดสอบจาก SMSOK",
    testSent: false,
    testSending: false,
    testError: null,
    selectedPackage: null,
    campaignName: "",
  });

  function updateState(patch: Partial<WizardState>) {
    setWizardState((prev) => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    } else {
      setCompleted(true);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleSkipPackage() {
    updateState({ selectedPackage: null });
    setCurrentStep(5);
  }

  function handleGoToDashboard() {
    router.push("/dashboard");
  }

  const canProceed = (() => {
    if (currentStep === 1) return wizardState.senderName.length >= 3;
    if (currentStep === 2) return wizardState.contactMode !== null;
    return true;
  })();

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-10"
      style={{ backgroundColor: "var(--bg-base, var(--bg-surface))" }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            ยินดีต้อนรับสู่ SMSOK
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            ตั้งค่าง่ายๆ ใน 5 ขั้นตอน พร้อมส่ง SMS ทันที
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-8 shadow-sm"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {completed ? (
            <CompletionCard onGoToDashboard={handleGoToDashboard} />
          ) : (
            <>
              <StepProgressBar currentStep={currentStep} />

              {/* Step Content */}
              <div className="min-h-[320px]">
                {currentStep === 1 && (
                  <Step1 state={wizardState} onChange={updateState} />
                )}
                {currentStep === 2 && (
                  <Step2 state={wizardState} onChange={updateState} />
                )}
                {currentStep === 3 && (
                  <Step3 state={wizardState} onChange={updateState} />
                )}
                {currentStep === 4 && (
                  <Step4
                    state={wizardState}
                    onChange={updateState}
                    onSkip={handleSkipPackage}
                  />
                )}
                {currentStep === 5 && (
                  <Step5 state={wizardState} onChange={updateState} />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
                {/* Back */}
                <div>
                  {currentStep > 1 ? (
                    <Button variant="outline" onClick={handleBack}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      ย้อนกลับ
                    </Button>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Step counter + Next */}
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    ขั้นตอน {currentStep} จาก 5
                  </span>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    style={{
                      backgroundColor: canProceed ? "var(--accent)" : undefined,
                      color: canProceed ? "var(--text-on-accent)" : undefined,
                    }}
                  >
                    {currentStep === 5 ? "เสร็จสิ้น" : "ถัดไป"}
                    {currentStep < 5 && (
                      <ChevronRight className="w-4 h-4 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
