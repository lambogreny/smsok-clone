"use client";

import { useState, useTransition } from "react";
import { sendSms, sendBatchSms } from "@/lib/actions/sms";
import { smsCounterText } from "@/lib/form-utils";
import { calculateCreditCost } from "@/lib/validations";
import { safeErrorMessage } from "@/lib/error-messages";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Send, ArrowRight, Loader2 } from "lucide-react";

type MsgType = "english" | "thai" | "unicode";

const MSG_LIMITS: Record<MsgType, { single: number; multi: number }> = {
  english: { single: 160, multi: 153 },
  thai: { single: 70, multi: 67 },
  unicode: { single: 70, multi: 67 },
};

export default function SendSmsForm({ userId, senderNames = ["EasySlip"] }: { userId: string; senderNames?: string[] }) {
  const [senderName, setSenderName] = useState(senderNames[0] || "EasySlip");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<MsgType>("thai");
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const limits = MSG_LIMITS[msgType];
  const charCount = message.length;
  const smsCount = charCount === 0 ? 0 : charCount <= limits.single ? 1 : Math.ceil(charCount / limits.multi);

  const recipientList = recipients.split(/[,\n]/).map((r) => r.trim()).filter(Boolean);
  const recipientCount = recipientList.length;

  const validPhones = recipientList.filter((r) => /^0[0-9]\d{8}$/.test(r.replace(/[^0-9]/g, "")));
  const invalidPhones = recipientList.filter((r) => !/^0[0-9]\d{8}$/.test(r.replace(/[^0-9]/g, "")));
  const phoneError = invalidPhones.length > 0 ? `เบอร์ไม่ถูกต้อง: ${invalidPhones.slice(0, 3).join(", ")}${invalidPhones.length > 3 ? ` +${invalidPhones.length - 3} เบอร์` : ""}` : "";

  const creditPerSms = message ? calculateCreditCost(message) : 0;
  const totalCredit = creditPerSms * recipientCount;

  // Character counter progress
  const maxChars = limits.single;
  const charProgress = Math.min((charCount / maxChars) * 100, 100);

  const handleSend = () => {
    if (!recipients.trim() || !message.trim()) return;
    setResult(null);

    startTransition(async () => {
      try {
        if (recipientCount === 1) {
          await sendSms(userId, { senderName, recipient: recipientList[0], message });
        } else {
          await sendBatchSms(userId, { senderName, recipients: recipientList, message });
        }
        setResult({ type: "success", text: `ส่งสำเร็จ ${recipientCount} เบอร์!` });
        setRecipients("");
        setMessage("");
      } catch (e) {
        setResult({ type: "error", text: safeErrorMessage(e) });
      }
    });
  };

  return (
    <div className="p-6 md:p-8 pb-20 md:pb-8 max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-white">ส่ง SMS</h1>

      {/* Feedback */}
      {result && (
        <div className={`p-3 rounded-xl text-sm font-medium border transition-opacity duration-200 ${
          result.type === "success"
            ? "bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.15)] text-[#10B981]"
            : "bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.15)] text-[#F87171]"
        }`}>
          {result.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Compose Panel ── */}
        <Card className="lg:col-span-3 bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px]">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-[rgba(0,255,167,0.08)] flex items-center justify-center">
                <Send className="w-4 h-4 text-[var(--accent)]" />
              </div>
              เขียนข้อความ
            </h3>

            <div className="space-y-5">
              {/* Sender */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-1.5">ผู้ส่ง</label>
                <Select value={senderName} onValueChange={(v) => v && setSenderName(v)}>
                  <SelectTrigger className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                    {senderNames.map((name) => (
                      <SelectItem key={name} value={name} className="hover:bg-[var(--bg-surface-hover)]">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-1.5">ประเภทข้อความ</label>
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
                        className="h-9 px-4 rounded-lg text-xs font-medium border border-[var(--border-subtle)] text-[var(--text-secondary)] data-[state=active]:bg-[rgba(0,255,167,0.08)] data-[state=active]:border-[rgba(0,255,167,0.3)] data-[state=active]:text-[var(--accent)]"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-1.5">ผู้รับ</label>
                <Textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className={`bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-secondary)] rounded-lg resize-none focus:border-[rgba(0,255,167,0.6)] focus:ring-[rgba(0,255,167,0.12)] ${phoneError ? "border-[rgba(239,68,68,0.6)]" : validPhones.length > 0 ? "border-[rgba(16,185,129,0.4)]" : ""}`}
                  rows={4}
                  placeholder={"กรอกเบอร์โทร (คั่นด้วย Enter หรือ comma)\n0891234567\n0891234568"}
                />
                {phoneError ? (
                  <p className="text-[#F87171] text-xs mt-1">{phoneError}</p>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {validPhones.length > 0 ? (
                      <><span className="text-[#10B981]">{validPhones.length} เบอร์ถูกต้อง</span>{invalidPhones.length > 0 && <>, <span className="text-[#F87171]">{invalidPhones.length} ไม่ถูกต้อง</span></>}</>
                    ) : (
                      `${recipientCount} เบอร์ — คั่นด้วยจุลภาค หรือขึ้นบรรทัดใหม่`
                    )}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-1.5">ข้อความ</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-secondary)] rounded-lg resize-none focus:border-[rgba(0,255,167,0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                  rows={5}
                  placeholder="พิมพ์ข้อความ SMS ที่นี่..."
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {smsCounterText(message) || `0/${limits.single} ตัวอักษร · 0 SMS`}
                  </p>
                  {message.length > 0 && (
                    <p className="text-xs text-[#F59E0B] font-medium">
                      {creditPerSms} เครดิต/SMS
                    </p>
                  )}
                </div>
                {/* Progress bar */}
                <div className="h-0.5 mt-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
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
          <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px]">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-4">ตัวอย่าง</h3>
              <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl p-4 min-h-[120px]">
                <div className="text-xs text-[var(--accent)] mb-2">From: {senderName || "EasySlip"}</div>
                <p className="text-sm text-white whitespace-pre-wrap">
                  {message || <span className="text-[var(--text-secondary)]">ข้อความจะแสดงที่นี่...</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px]">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-4">สรุปค่าใช้จ่าย</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13px] border-b border-[var(--border-subtle)] pb-2.5">
                  <span className="text-[var(--text-secondary)]">ผู้รับ</span>
                  <span className="text-white">{recipientCount} เบอร์</span>
                </div>
                <div className="flex justify-between text-[13px] border-b border-[var(--border-subtle)] pb-2.5">
                  <span className="text-[var(--text-secondary)]">SMS/เบอร์</span>
                  <span className="text-white">{smsCount}</span>
                </div>
                <div className="flex justify-between text-[13px] border-b border-[var(--border-subtle)] pb-2.5">
                  <span className="text-[var(--text-secondary)]">เครดิต/SMS</span>
                  <span className="text-white">{creditPerSms}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-base font-bold text-white">รวม</span>
                  <span className="text-base font-bold text-[var(--accent)]">{totalCredit} เครดิต</span>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={isPending || !recipients.trim() || !message.trim() || !!phoneError}
                className="w-full mt-4 h-12 bg-[var(--accent)] hover:bg-[#0AE99C] text-[var(--bg-base)] rounded-xl font-semibold"
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
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-[var(--bg-base)] border-t border-[var(--border-subtle)] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-[var(--text-secondary)]">รวม: </span>
            <span className="text-base font-bold text-[var(--accent)]">{totalCredit} เครดิต</span>
          </div>
          <Button
            onClick={handleSend}
            disabled={isPending || !recipients.trim() || !message.trim() || !!phoneError}
            className="h-11 px-6 bg-[var(--accent)] hover:bg-[#0AE99C] text-[var(--bg-base)] rounded-xl font-semibold"
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
