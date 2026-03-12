"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendSms, sendBatchSms } from "@/lib/actions/sms";
import { smsCounterText } from "@/lib/form-utils";
import { calculateCreditCost as calculateSmsCost } from "@/lib/validations";
import { safeErrorMessage } from "@/lib/error-messages";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import SendingHoursWarning from "@/components/blocks/SendingHoursWarning";

type MsgType = "english" | "thai" | "unicode";

const MSG_LIMITS: Record<MsgType, { single: number; multi: number }> = {
  english: { single: 160, multi: 153 },
  thai: { single: 70, multi: 67 },
  unicode: { single: 70, multi: 67 },
};

export default function SendSmsForm({ userId, senderNames: rawNames = ["EasySlip"] }: { userId: string; senderNames?: string[] }) {
  const router = useRouter();
  const senderNames = rawNames.length > 0 ? rawNames : ["EasySlip"];
  const [senderName, setSenderName] = useState(senderNames[0]);
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<MsgType>("thai");
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [smsRemaining, setSmsRemaining] = useState<number | null>(null);

  // Fetch credit balance on mount — graceful fallback chain
  useEffect(() => {
    async function fetchBalance() {
      // Try primary endpoint
      try {
        const res = await fetch("/api/v1/credits/balance");
        if (res.ok) {
          const data = await res.json();
          const remaining = data.smsRemaining ?? data.remaining ?? data.balance;
          if (typeof remaining === "number") { setSmsRemaining(remaining); return; }
        }
      } catch { /* endpoint may not exist yet — leave as null, backend enforces */ }
    }
    fetchBalance();
  }, []);

  const charCount = message.length;
  // Auto-detect encoding: Thai/emoji/non-ASCII → UCS-2 (70/67), pure ASCII → GSM-7 (160/153)
  const hasThai = /[\u0E00-\u0E7F]/.test(message);
  const hasNonGsm = /[^\x00-\x7F]/.test(message);
  const isUcs2 = hasThai || hasNonGsm;
  const detectedType: MsgType = hasThai ? "thai" : hasNonGsm ? "unicode" : "english";
  const limits = MSG_LIMITS[message ? detectedType : msgType];

  // Use shared calculateSmsCost (synced with backend formula)
  const smsCount = message ? calculateSmsCost(message) : 0;

  const recipientList = recipients.split(/[,\n]/).map((r) => r.trim()).filter(Boolean);
  const recipientCount = recipientList.length;

  const validPhones = recipientList.filter((r) => /^0[0-9]\d{8}$/.test(r.replace(/[^0-9]/g, "")));
  const invalidPhones = recipientList.filter((r) => !/^0[0-9]\d{8}$/.test(r.replace(/[^0-9]/g, "")));
  const phoneError = invalidPhones.length > 0 ? `เบอร์ไม่ถูกต้อง: ${invalidPhones.slice(0, 3).join(", ")}${invalidPhones.length > 3 ? ` +${invalidPhones.length - 3} เบอร์` : ""}` : "";

  const costPerSms = smsCount;
  const totalSmsCost = costPerSms * recipientCount;

  const maxChars = limits.single;
  const charProgress = Math.min((charCount / maxChars) * 100, 100);

  const hasInsufficientCredits = smsRemaining !== null && totalSmsCost > 0 && totalSmsCost > smsRemaining;
  const hasNoCredits = smsRemaining !== null && smsRemaining <= 0;

  const handleSend = () => {
    if (!recipients.trim() || !message.trim()) return;
    setResult(null);

    startTransition(async () => {
      try {
        const result = recipientCount === 1
          ? await sendSms(userId, { senderName, recipient: recipientList[0], message })
          : await sendBatchSms(userId, { senderName, recipients: recipientList, message });

        // Check for structured insufficient credits error (returned, not thrown)
        if (result && "error" in result && result.error === "INSUFFICIENT_CREDITS") {
          const detail = `เครดิตไม่พอ — เหลือ ${result.creditsRemaining} ต้องการ ${result.creditsRequired}`;
          setResult({ type: "error", text: detail });
          toast.error(detail);
          setSmsRemaining(result.creditsRemaining);
          return;
        }

        setResult({ type: "success", text: `ส่งสำเร็จ ${recipientCount} เบอร์!` });
        toast.success("ส่ง SMS สำเร็จ!");
        setRecipients("");
        setMessage("");
      } catch (e) {
        setResult({ type: "error", text: safeErrorMessage(e) });
        toast.error(safeErrorMessage(e));
      }
    });
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">ส่ง SMS</h1>

      {/* Insufficient Credits Warning */}
      {(hasNoCredits || hasInsufficientCredits) && (
        <div
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl text-sm border flex-wrap"
          style={{
            background: "rgba(var(--warning-rgb,245,158,11),0.06)",
            borderColor: "rgba(var(--warning-rgb,245,158,11),0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
            <span style={{ color: "var(--warning)" }}>
              {hasNoCredits
                ? "เครดิต SMS หมดแล้ว — ไม่สามารถส่งได้"
                : `เครดิตไม่พอ (เหลือ ${smsRemaining?.toLocaleString()} SMS, ต้องใช้ ${totalSmsCost.toLocaleString()})`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/packages")}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--warning)", color: "var(--bg-base)" }}
          >
            เติมเครดิต →
          </button>
        </div>
      )}

      {/* Feedback Alert */}
      {result && (
        <div className={`p-3 rounded-xl text-sm font-medium border transition-opacity duration-200 ${
          result.type === "success"
            ? "bg-[var(--success-bg)] border-[rgba(8,153,129,0.15)] text-[var(--success)]"
            : "bg-[var(--danger-bg)] border-[rgba(242,54,69,0.15)] text-[var(--error)]"
        }`}>
          {result.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Compose Panel ── */}
        <Card className="lg:col-span-3 bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5 md:p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5">เขียนข้อความ</h3>

            <div className="space-y-5">
              {/* Sender */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-1.5">ผู้ส่ง</label>
                <Select value={senderName} onValueChange={(v) => v && setSenderName(v)}>
                  <SelectTrigger className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-xl focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.15)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-xl">
                    {senderNames.map((name) => (
                      <SelectItem key={name} value={name} className="hover:bg-[var(--bg-base)] text-[var(--text-primary)]">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-1.5">ประเภทข้อความ</label>
                <Tabs value={msgType} onValueChange={(v) => setMsgType(v as MsgType)}>
                  <TabsList className="h-9 bg-transparent gap-2 p-0">
                    {([
                      { value: "thai", label: "ภาษาไทย (70)" },
                      { value: "english", label: "English (160)" },
                      { value: "unicode", label: "Unicode (70)" },
                    ] as const).map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="h-9 px-4 rounded-lg text-xs font-medium border border-[var(--border-default)] text-[var(--text-muted)] data-[state=active]:bg-[rgba(var(--accent-rgb),0.08)] data-[state=active]:border-[rgba(var(--accent-rgb),0.3)] data-[state=active]:text-[var(--accent)]"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-1.5">ผู้รับ</label>
                <Textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className={`bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl resize-none focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.15)] ${phoneError ? "border-[rgba(239,68,68,0.6)]" : validPhones.length > 0 ? "border-[rgba(16,185,129,0.4)]" : ""}`}
                  rows={4}
                  placeholder={"กรอกเบอร์โทร (คั่นด้วย Enter หรือ comma)\n0891234567\n0891234568"}
                />
                {phoneError ? (
                  <p className="text-[var(--error)] text-xs mt-1">{phoneError}</p>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {validPhones.length > 0 ? (
                      <><span className="text-[var(--success)]">{validPhones.length} เบอร์ถูกต้อง</span>{invalidPhones.length > 0 && <>, <span className="text-[var(--error)]">{invalidPhones.length} ไม่ถูกต้อง</span></>}</>
                    ) : (
                      `${recipientCount} เบอร์ — คั่นด้วยจุลภาค หรือขึ้นบรรทัดใหม่`
                    )}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-1.5">ข้อความ</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl resize-none focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.15)]"
                  rows={5}
                  placeholder="พิมพ์ข้อความ SMS ที่นี่..."
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {charCount > 0
                      ? `${charCount}/${limits.single} ตัวอักษร · ${smsCount} SMS (${isUcs2 ? "UCS-2" : "GSM-7"})`
                      : `0/${limits.single} ตัวอักษร · 0 SMS`}
                  </p>
                  {charCount > 0 && (
                    <p className={`text-xs font-semibold ${charCount > limits.single ? "text-[var(--warning)]" : "text-[var(--accent)]"}`}>
                      {smsCount} SMS{recipientCount > 1 ? ` × ${recipientCount} = ${totalSmsCost}` : ""}
                    </p>
                  )}
                </div>
                {/* Progress bar */}
                <div className="h-0.5 mt-1 rounded-full bg-[var(--border-default)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                    style={{ width: `${charProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Preview & Cost Panel ── */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-[80px] lg:self-start pb-20 lg:pb-0">
          {/* Preview */}
          <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-4">ตัวอย่าง</h3>
              <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl p-4 min-h-[120px]">
                <div className="text-xs text-[var(--accent)] mb-2">From: {senderName || "EasySlip"}</div>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                  {message || <span className="text-[var(--text-muted)]">ข้อความจะแสดงที่นี่...</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-4">สรุปค่าใช้จ่าย</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13px] border-b border-[var(--border-default)] pb-2.5">
                  <span className="text-[var(--text-muted)]">ผู้รับ</span>
                  <span className="text-[var(--text-primary)]">{recipientCount} เบอร์</span>
                </div>
                <div className="flex justify-between text-[13px] border-b border-[var(--border-default)] pb-2.5">
                  <span className="text-[var(--text-muted)]">SMS/เบอร์</span>
                  <span className="text-[var(--text-primary)]">{smsCount}</span>
                </div>
                <div className="flex justify-between text-[13px] border-b border-[var(--border-default)] pb-2.5">
                  <span className="text-[var(--text-muted)]">ต้นทุน/SMS</span>
                  <span className="text-[var(--text-primary)]">{costPerSms}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-base font-bold text-[var(--text-primary)]">รวม</span>
                  <span className="text-base font-bold text-[var(--accent)]">{totalSmsCost} SMS</span>
                </div>
              </div>

              <SendingHoursWarning className="mt-3" />

              <Button
                onClick={handleSend}
                disabled={isPending || !recipients.trim() || !message.trim() || !!phoneError || hasNoCredits || hasInsufficientCredits}
                className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-lg font-semibold disabled:opacity-50" size="lg"
              >
                {isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังส่ง...</span>
                ) : (
                  <span className="flex items-center gap-2">ส่ง SMS <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-[var(--bg-base)] border-t border-[var(--border-default)] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-[var(--text-muted)]">รวม: </span>
            <span className="text-base font-bold text-[var(--accent)]">{totalSmsCost} SMS</span>
          </div>
          <Button
            onClick={handleSend}
            disabled={isPending || !recipients.trim() || !message.trim() || !!phoneError || hasNoCredits || hasInsufficientCredits}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-lg font-semibold disabled:opacity-50" size="lg"
          >
            {isPending ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />ส่ง...</span>
            ) : (
              <span className="flex items-center gap-2">ส่ง SMS <ArrowRight className="w-4 h-4" /></span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
