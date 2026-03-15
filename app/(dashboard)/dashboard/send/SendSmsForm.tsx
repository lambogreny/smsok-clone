"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { sendSms, sendBatchSms } from "@/lib/actions/sms";
import { calculateCreditCost as calculateSmsCost } from "@/lib/validations";
import { safeErrorMessage } from "@/lib/error-messages";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SenderDropdown from "@/components/ui/SenderDropdown";
import { SmsCharCounter, UnicodeWarning } from "@/components/sms/SmsCharCounter";
import { PhonePreview } from "@/components/sms/PhonePreview";
import {
  VariableInsertButtons,
  useVariableAutocomplete,
  VariableSuggestionDropdown,
} from "@/components/sms/VariableInsert";

import { toast } from "sonner";
import { ArrowRight, Loader2, AlertTriangle, Send, FlaskConical, Upload, Calendar, X } from "lucide-react";
import SendingHoursWarning, { checkSendingHours } from "@/components/blocks/SendingHoursWarning";

type MsgType = "english" | "thai" | "unicode";

export default function SendSmsForm({ senderNames: rawNames = [] }: { senderNames?: string[] }) {
  const router = useRouter();
  const senderNames = rawNames.length > 0 ? rawNames : [];
  const [senderName, setSenderName] = useState(senderNames[0]);
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<MsgType>("thai");
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [smsRemaining, setSmsRemaining] = useState<number | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [showTestSend, setShowTestSend] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCursorPos = useRef<{ start: number; end: number } | null>(null);

  // Today's date (client-only to avoid hydration mismatch)
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setTodayStr(new Date().toISOString().slice(0, 10));
  }, []);

  // Fetch SMS quota on mount
  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/v1/credits/balance");
        if (res.ok) {
          const data = await res.json();
          const remaining = data.smsRemaining ?? data.remaining ?? data.balance;
          if (typeof remaining === "number") { setSmsRemaining(remaining); return; }
        }
      } catch { /* endpoint may not exist yet */ }
    }
    fetchBalance();
  }, []);

  const hasThai = /[\u0E00-\u0E7F]/.test(message);
  const hasNonGsm = /[^\x00-\x7F]/.test(message);
  const isUcs2 = hasThai || hasNonGsm;
  const smsCount = message ? calculateSmsCost(message) : 0;

  const recipientList = recipients.split(/[,\n]/).map((r) => r.trim()).filter(Boolean);
  const recipientCount = recipientList.length;
  const validPhones = recipientList.filter((r) => /^0[0-9]\d{8}$/.test(r.replace(/[^0-9]/g, "")));
  const invalidPhones = recipientList.filter((r) => !/^0[0-9]\d{8}$/.test(r.replace(/[^0-9]/g, "")));
  const phoneError = invalidPhones.length > 0 ? `เบอร์ไม่ถูกต้อง: ${invalidPhones.slice(0, 3).join(", ")}${invalidPhones.length > 3 ? ` +${invalidPhones.length - 3} เบอร์` : ""}` : "";

  const costPerSms = smsCount;
  const totalSmsCost = costPerSms * recipientCount;
  const sendingHoursState = checkSendingHours();
  const isOutsideSendingHours = sendingHoursState.isOutside;

  const hasInsufficientCredits = smsRemaining !== null && totalSmsCost > 0 && totalSmsCost > smsRemaining;
  const hasNoCredits = smsRemaining !== null && smsRemaining <= 0;
  const hasNoSenders = senderNames.length === 0;

  // Variable insertion into message textarea
  const insertVariable = useCallback((variable: string) => {
    const textarea = messageTextareaRef.current;
    if (textarea) {
      // Use saved cursor position (from before button click stole focus), fallback to current
      const saved = lastCursorPos.current;
      const start = saved?.start ?? textarea.selectionStart;
      const end = saved?.end ?? textarea.selectionEnd;
      const newMessage = message.substring(0, start) + variable + message.substring(end);
      setMessage(newMessage);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(message + variable);
    }
  }, [message]);

  // Variable autocomplete — replaces the partial "{{..." typed text with the full token
  const autocompleteInsert = useCallback((variable: string) => {
    const textarea = messageTextareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const textBefore = message.substring(0, cursorPos);
    const match = textBefore.match(/\{\{(\w*)$/);
    if (match) {
      const replaceStart = cursorPos - match[0].length;
      const newMessage = message.substring(0, replaceStart) + variable + message.substring(cursorPos);
      setMessage(newMessage);
      setTimeout(() => {
        const newPos = replaceStart + variable.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    }
  }, [message]);

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const phones = text
        .split(/[\r\n,;]+/)
        .map((line) => line.replace(/[^0-9]/g, "").trim())
        .filter((p) => /^0[0-9]\d{8}$/.test(p));
      if (phones.length > 0) {
        setRecipients((prev) => {
          const existing = prev.trim();
          return existing ? `${existing}\n${phones.join("\n")}` : phones.join("\n");
        });
        toast.success(`นำเข้า ${phones.length} เบอร์จาก CSV`);
      } else {
        toast.error("ไม่พบเบอร์โทรที่ถูกต้องในไฟล์");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const autocomplete = useVariableAutocomplete(
    messageTextareaRef,
    autocompleteInsert,
  );

  const handleSend = () => {
    if (!recipients.trim() || !message.trim()) return;
    if (isOutsideSendingHours && scheduleMode === "now") {
      const errorMessage = sendingHoursState.message || "ไม่สามารถส่ง SMS นอกเวลาที่กำหนด";
      setResult({ type: "error", text: errorMessage });
      toast.error(errorMessage);
      return;
    }
    setResult(null);

    startTransition(async () => {
      try {
        // Scheduled SMS
        if (scheduleMode === "later" && scheduleDate && scheduleTime) {
          const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
          const res = await fetch("/api/v1/sms/scheduled", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              action: "create",
              senderName: senderName || "",
              recipients: validPhones,
              message,
              scheduledAt,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "ตั้งเวลาส่งล้มเหลว" }));
            throw new Error(err.error || "ตั้งเวลาส่งล้มเหลว");
          }
          setResult({ type: "success", text: `ตั้งเวลาส่งสำเร็จ ${validPhones.length} เบอร์ — ${scheduleDate} ${scheduleTime}` });
          toast.success("ตั้งเวลาส่ง SMS สำเร็จ!");
          setRecipients("");
          setMessage("");
          setScheduleMode("now");
          setScheduleDate("");
          setScheduleTime("");
          return;
        }

        // Immediate send
        const result = recipientCount === 1
          ? await sendSms({ senderName, recipient: recipientList[0], message })
          : await sendBatchSms({ senderName, recipients: recipientList, message });

        if (result && "error" in result && result.error === "INSUFFICIENT_CREDITS") {
          const detail = `SMS ไม่พอ — เหลือ ${result.creditsRemaining} ต้องการ ${result.creditsRequired}`;
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

  const handleTestSend = async () => {
    if (!testPhone.trim() || !message.trim()) return;
    if (isOutsideSendingHours) {
      toast.error(sendingHoursState.message || "ไม่สามารถส่ง SMS นอกเวลาที่กำหนด");
      return;
    }
    const cleanPhone = testPhone.replace(/[^0-9]/g, "");
    if (!/^0[0-9]\d{8}$/.test(cleanPhone)) {
      toast.error("เบอร์โทรไม่ถูกต้อง");
      return;
    }
    setIsTestSending(true);
    try {
      const result = await sendSms({ senderName, recipient: cleanPhone, message });
      if (result && "error" in result && result.error === "INSUFFICIENT_CREDITS") {
        toast.error("SMS ไม่พอสำหรับทดสอบ");
      } else {
        toast.success("ส่งทดสอบสำเร็จ!");
        setShowTestSend(false);
      }
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setIsTestSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">ส่ง SMS</h1>

      {/* No Approved Senders Warning */}
      {hasNoSenders && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-lg text-sm border"
          style={{
            background: "rgba(var(--warning-rgb,245,158,11),0.06)",
            borderColor: "rgba(var(--warning-rgb,245,158,11),0.15)",
          }}
        >
          <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
          <span style={{ color: "var(--warning)" }}>
            ยังไม่มีชื่อผู้ส่งที่ได้รับอนุมัติ — กรุณาเพิ่มและรออนุมัติก่อนส่ง SMS
          </span>
        </div>
      )}

      {/* No SMS Quota — Full blocking state */}
      {hasNoCredits && (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            background: "rgba(var(--error-rgb), 0.04)",
            border: "1px solid rgba(var(--error-rgb), 0.15)",
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(var(--error-rgb), 0.1)",
              border: "1px solid rgba(var(--error-rgb), 0.2)",
            }}
          >
            <AlertTriangle size={24} style={{ color: "var(--error)" }} />
          </div>
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: "var(--error)" }}
          >
            โควต้าข้อความหมด
          </h3>
          <p
            className="text-sm mb-5"
            style={{ color: "var(--text-secondary)" }}
          >
            ไม่สามารถส่ง SMS ได้ กรุณาซื้อแพ็กเกจเพื่อเติมโควต้าข้อความ
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/billing/packages")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--bg-base)" }}
          >
            ซื้อแพ็กเกจ →
          </button>
        </div>
      )}

      {/* Insufficient Credits Warning (have some but not enough) */}
      {!hasNoCredits && hasInsufficientCredits && (
        <div
          className="flex items-center justify-between gap-3 p-3.5 rounded-lg text-sm border flex-wrap"
          style={{
            background: "rgba(var(--warning-rgb,245,158,11),0.06)",
            borderColor: "rgba(var(--warning-rgb,245,158,11),0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
            <span style={{ color: "var(--warning)" }}>
              SMS ไม่พอ (เหลือ {smsRemaining?.toLocaleString()} SMS, ต้องใช้ {totalSmsCost.toLocaleString()})
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/billing/packages")}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--warning)", color: "var(--bg-base)" }}
          >
            ซื้อแพ็กเกจ →
          </button>
        </div>
      )}

      {/* Feedback Alert */}
      {result && (
        <div className={`p-3 rounded-lg text-sm font-medium border transition-opacity duration-200 ${
          result.type === "success"
            ? "bg-[var(--success-bg)] border-[rgba(8,153,129,0.15)] text-[var(--success)]"
            : "bg-[var(--danger-bg)] border-[rgba(242,54,69,0.15)] text-[var(--error)]"
        }`}>
          {result.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Compose Panel */}
        <Card className="lg:col-span-3 bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5 md:p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5">เขียนข้อความ</h3>

            <div className="space-y-5">
              {/* Sender */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-1.5">ผู้ส่ง</label>
                <SenderDropdown value={senderName} onChange={setSenderName} senderNames={senderNames} />
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">ผู้รับ</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    นำเข้า CSV
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </div>
                <Textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300); }}
                  className={`bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg resize-none focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.15)] ${phoneError ? "border-[rgba(239,68,68,0.6)]" : validPhones.length > 0 ? "border-[rgba(16,185,129,0.4)]" : ""}`}
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

              {/* Variable Insert Buttons */}
              <VariableInsertButtons onInsert={insertVariable} />

              {/* Message */}
              <div className="relative">
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-1.5">ข้อความ</label>
                <Textarea
                  ref={messageTextareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={autocomplete.handleInput}
                  onKeyDown={autocomplete.handleKeyDown}
                  onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300); }}
                  onSelect={(e) => {
                    const t = e.currentTarget;
                    lastCursorPos.current = { start: t.selectionStart, end: t.selectionEnd };
                  }}
                  onBlur={() => setTimeout(autocomplete.closeSuggestions, 150)}
                  className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg resize-none focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
                  rows={5}
                  placeholder="พิมพ์ข้อความ SMS ที่นี่... พิมพ์ {{ เพื่อแทรกตัวแปร"
                  maxLength={1000}
                />
                <VariableSuggestionDropdown
                  show={autocomplete.showSuggestions}
                  position={autocomplete.suggestionPos}
                  variables={autocomplete.filteredVars}
                  selectedIndex={autocomplete.selectedIndex}
                  onSelect={(v) => {
                    autocompleteInsert(v);
                    autocomplete.closeSuggestions();
                  }}
                  onHover={autocomplete.setSelectedIndex}
                />

                {/* Enhanced char counter */}
                <div className="mt-1.5">
                  <SmsCharCounter message={message} recipientCount={recipientCount} />
                </div>
              </div>

              {/* Unicode Warning */}
              <UnicodeWarning message={message} />
            </div>
          </CardContent>
        </Card>

        {/* Preview & Cost Panel */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-[80px] lg:self-start pb-20 lg:pb-0">
          {/* Phone Preview */}
          <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-4">ตัวอย่าง</h3>
              <PhonePreview message={message} senderName={senderName || "SMS"} />
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
                  <span className="text-[var(--text-muted)]">Encoding</span>
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded font-mono font-medium"
                    style={{
                      background: isUcs2
                        ? "rgba(var(--warning-rgb,245,158,11),0.08)"
                        : "rgba(var(--accent-rgb),0.08)",
                      color: isUcs2 ? "var(--warning)" : "var(--accent)",
                    }}
                  >
                    {message ? (isUcs2 ? "UCS-2 (70/SMS)" : "GSM-7 (160/SMS)") : "—"}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-base font-bold text-[var(--text-primary)]">รวม</span>
                  <span className="text-base font-bold text-[var(--accent)]">{totalSmsCost} SMS</span>
                </div>
              </div>

              <SendingHoursWarning className="mt-3" />

              {/* Test Send */}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowTestSend(!showTestSend)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all border"
                  style={{
                    borderColor: "rgba(var(--accent-rgb),0.2)",
                    color: "var(--accent)",
                    background: showTestSend ? "rgba(var(--accent-rgb),0.06)" : "transparent",
                  }}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  ทดสอบส่ง
                </button>
                {showTestSend && (
                  <div
                    className="p-3 rounded-lg border space-y-2"
                    style={{
                      background: "rgba(var(--accent-rgb),0.02)",
                      borderColor: "rgba(var(--accent-rgb),0.1)",
                    }}
                  >
                    <label className="block text-[11px] text-[var(--text-muted)]">
                      เบอร์ทดสอบ (ส่งไปเบอร์ตัวเอง)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="08X-XXX-XXXX"
                        className="flex-1 h-9 px-3 rounded-lg text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--accent-rgb),0.6)]"
                        maxLength={12}
                      />
                      <Button
                        type="button"
                        onClick={handleTestSend}
                        disabled={isTestSending || !testPhone.trim() || !message.trim() || isOutsideSendingHours}
                        className="h-9 px-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold text-xs"
                      >
                        {isTestSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">ใช้ 1 SMS สำหรับทดสอบ</p>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="mt-4 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">กำหนดเวลาส่ง</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("now")}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium border transition-colors ${
                      scheduleMode === "now"
                        ? "bg-[rgba(var(--accent-rgb),0.08)] border-[rgba(var(--accent-rgb),0.3)] text-[var(--accent)]"
                        : "border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    ส่งทันที
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("later")}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      scheduleMode === "later"
                        ? "bg-[rgba(var(--accent-rgb),0.08)] border-[rgba(var(--accent-rgb),0.3)] text-[var(--accent)]"
                        : "border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    ตั้งเวลา
                  </button>
                </div>
                {scheduleMode === "later" && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={todayStr || undefined}
                      className="flex-1 h-9 px-3 rounded-lg text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[rgba(var(--accent-rgb),0.6)]"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-[120px] h-9 px-3 rounded-lg text-sm bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[rgba(var(--accent-rgb),0.6)]"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={isPending || !recipients.trim() || !message.trim() || !!phoneError || hasNoCredits || hasInsufficientCredits || isOutsideSendingHours || hasNoSenders || (scheduleMode === "later" && (!scheduleDate || !scheduleTime))}
                className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-lg font-semibold disabled:opacity-50" size="lg"
              >
                {isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังส่ง...</span>
                ) : scheduleMode === "later" ? (
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />ตั้งเวลาส่ง</span>
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
            onClick={() => setShowConfirmModal(true)}
            disabled={isPending || !recipients.trim() || !message.trim() || !!phoneError || hasNoCredits || hasInsufficientCredits || (scheduleMode === "now" && isOutsideSendingHours) || hasNoSenders || (scheduleMode === "later" && (!scheduleDate || !scheduleTime))}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="sms-confirm-title">
          <div className="w-full max-w-md rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 id="sms-confirm-title" className="text-lg font-bold text-[var(--text-primary)]">ยืนยันการส่ง SMS</h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm border-b border-[var(--border-default)] pb-2">
                <span className="text-[var(--text-muted)]">ผู้รับ</span>
                <span className="text-[var(--text-primary)] font-medium">{validPhones.length} เบอร์</span>
              </div>
              <div className="flex justify-between text-sm border-b border-[var(--border-default)] pb-2">
                <span className="text-[var(--text-muted)]">ผู้ส่ง</span>
                <span className="text-[var(--text-primary)]">{senderName || "—"}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-[var(--border-default)] pb-2">
                <span className="text-[var(--text-muted)]">ข้อความ</span>
                <span className="text-[var(--text-primary)] text-right max-w-[200px] truncate">{message.slice(0, 50)}{message.length > 50 ? "..." : ""}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-[var(--border-default)] pb-2">
                <span className="text-[var(--text-muted)]">เวลาส่ง</span>
                <span className="text-[var(--text-primary)]">
                  {scheduleMode === "now" ? "ทันที" : `${scheduleDate} ${scheduleTime}`}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-base font-bold text-[var(--text-primary)]">ใช้ SMS</span>
                <span className="text-base font-bold text-[var(--accent)]">{totalSmsCost} SMS</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
                onClick={() => setShowConfirmModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSend();
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />ส่ง...</span>
                ) : (
                  <span className="flex items-center gap-2"><Send className="w-4 h-4" />ยืนยันส่ง</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
