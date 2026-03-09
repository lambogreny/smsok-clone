"use client";

import { useState, useTransition } from "react";
import { sendSms, sendBatchSms } from "@/lib/actions/sms";

type MsgType = "english" | "thai" | "unicode";

const MSG_LIMITS: Record<MsgType, { single: number; multi: number }> = {
  english: { single: 160, multi: 153 },
  thai: { single: 70, multi: 67 },
  unicode: { single: 70, multi: 67 },
};

export default function SendSmsForm({ userId }: { userId: string }) {
  const [senderName, setSenderName] = useState("EasySlip");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<MsgType>("thai");
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const limits = MSG_LIMITS[msgType];
  const charCount = message.length;
  const smsCount =
    charCount === 0
      ? 0
      : charCount <= limits.single
        ? 1
        : Math.ceil(charCount / limits.multi);

  const recipientList = recipients
    .split(/[,\n]/)
    .map((r) => r.trim())
    .filter(Boolean);
  const recipientCount = recipientList.length;
  const totalCost = (recipientCount * smsCount * 0.22).toFixed(2);

  const handleSend = () => {
    if (!recipients.trim() || !message.trim()) return;
    setResult(null);

    startTransition(async () => {
      try {
        if (recipientCount === 1) {
          await sendSms(userId, {
            senderName,
            recipient: recipientList[0],
            message,
          });
        } else {
          await sendBatchSms(userId, {
            senderName,
            recipients: recipientList,
            message,
          });
        }
        setResult({ type: "success", text: `ส่งสำเร็จ ${recipientCount} เบอร์!` });
        setRecipients("");
        setMessage("");
      } catch (e) {
        setResult({
          type: "error",
          text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        });
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Send SMS</h2>
      <p className="text-sm text-white/40 mb-8">ส่งข้อความ SMS ถึงผู้รับ</p>

      {/* Feedback */}
      {result && (
        <div
          className={`mb-6 p-4 rounded-xl border text-sm font-medium animate-fade-in ${
            result.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {result.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose */}
        <div className="lg:col-span-3 glass p-6 md:p-8">
          <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            Compose
          </h3>

          <div className="space-y-5">
            {/* Sender Name */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Sender Name</label>
              <input
                type="text"
                className="input-glass"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value.slice(0, 11))}
                maxLength={11}
                placeholder="EasySlip"
              />
              <p className="text-[11px] text-white/20 mt-1">{senderName.length}/11 characters</p>
            </div>

            {/* Message Type */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Message Type</label>
              <div className="flex gap-2">
                {(["english", "thai", "unicode"] as MsgType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMsgType(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      msgType === type
                        ? "btn-primary"
                        : "btn-glass"
                    }`}
                  >
                    {type === "english" ? "English (160)" : type === "thai" ? "Thai (70)" : "Unicode (70)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Recipients</label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className="input-glass resize-none"
                rows={3}
                placeholder={"0891234567\n0891234568, 0891234569"}
              />
              <p className="text-[11px] text-white/20 mt-1">
                {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} — comma or newline separated
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-glass resize-none"
                rows={5}
                placeholder="พิมพ์ข้อความ SMS ที่นี่..."
                maxLength={1000}
              />
              <div className="flex justify-between text-[11px] text-white/30 mt-1.5">
                <span>
                  {charCount} chars | {smsCount} SMS part{smsCount !== 1 ? "s" : ""}
                </span>
                <span>
                  {msgType === "english" ? "160" : "70"} chars/SMS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Cost */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview */}
          <div className="glass p-6">
            <h3 className="text-xs text-white/50 uppercase tracking-wider mb-4">Preview</h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 min-h-[120px]">
              <div className="text-xs text-sky-400 mb-2">From: {senderName || "EasySlip"}</div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">
                {message || "ข้อความจะแสดงที่นี่..."}
              </p>
            </div>
            <div className="flex justify-between text-xs text-white/30 mt-3">
              <span>{charCount} chars</span>
              <span>{smsCount} SMS part{smsCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="glass p-6">
            <h3 className="text-xs text-white/50 uppercase tracking-wider mb-4">Cost Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/50">
                <span>Recipients</span>
                <span className="text-white">{recipientCount}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>SMS Parts</span>
                <span className="text-white">{smsCount}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Cost/SMS</span>
                <span className="text-white">0.22 credits</span>
              </div>
              <div className="border-t border-white/5 pt-2 mt-2 flex justify-between font-semibold">
                <span className="text-white">Total</span>
                <span className="neon-blue">{totalCost} credits</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={handleSend}
                disabled={isPending || !recipients.trim() || !message.trim()}
                className="w-full btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังส่ง...
                  </span>
                ) : (
                  <>
                    Send Now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
