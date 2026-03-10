"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendSms, sendBatchSms } from "@/lib/actions/sms";
import { smsCounterText } from "@/lib/form-utils";
import { calculateCreditCost, calculateSmsCount } from "@/lib/validations";
import CustomSelect from "@/components/ui/CustomSelect";
import { safeErrorMessage } from "@/lib/error-messages";

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

  const invalidPhones = recipientList.filter(r => !/^0[689]\d{8}$/.test(r.replace(/[^0-9]/g, "")));
  const phoneError = invalidPhones.length > 0 ? `เบอร์ไม่ถูกต้อง: ${invalidPhones.slice(0, 3).join(", ")}${invalidPhones.length > 3 ? ` +${invalidPhones.length - 3} เบอร์` : ""}` : "";

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
          text: safeErrorMessage(e),
        });
      }
    });
  };

  return (
    <motion.div
      className="p-6 md:p-8 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h2 className="text-2xl font-bold mb-1 tracking-tight gradient-text-mixed">ส่ง SMS</h2>
      <p className="text-sm text-slate-300 mb-8">ส่งข้อความ SMS ถึงผู้รับ</p>

      {/* Feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
              result.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {result.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose */}
        <motion.div
          className="lg:col-span-3 glass p-6 md:p-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/[0.12] to-cyan-500/[0.08] border border-violet-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <span className="gradient-text-mixed">เขียนข้อความ</span>
          </h3>

          <div className="space-y-5">
            {/* Sender Name */}
            <div>
              <label className="block text-xs text-slate-300 uppercase tracking-wider mb-2">ชื่อผู้ส่ง</label>
              <CustomSelect
                value={senderName}
                onChange={setSenderName}
                options={[
                  { value: "EasySlip", label: "EasySlip (ค่าเริ่มต้น)" },
                  ...senderNames.filter((n) => n !== "EasySlip").map((name) => ({ value: name, label: name })),
                ]}
              />
              <p className="text-[11px] text-slate-300 mt-1.5">
                {senderName === "EasySlip" ? "ใช้ชื่อค่าเริ่มต้นได้เลย หรือ" : "Sender ที่ผ่านอนุมัติแล้ว — "}{" "}
                <a href="/dashboard/senders" className="text-violet-400 hover:text-violet-300 transition-colors">ขอ Sender Name ใหม่ →</a>
              </p>
            </div>

            {/* Message Type */}
            <div>
              <label className="block text-xs text-slate-300 uppercase tracking-wider mb-2">ประเภทข้อความ</label>
              <div className="flex gap-2">
                {(["english", "thai", "unicode"] as MsgType[]).map((type) => (
                  <motion.button
                    key={type}
                    onClick={() => setMsgType(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      msgType === type
                        ? "btn-primary"
                        : "btn-glass"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {type === "english" ? "อังกฤษ (160)" : type === "thai" ? "ภาษาไทย (70)" : "Unicode (70)"}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-xs text-slate-300 uppercase tracking-wider mb-2">ผู้รับ</label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className={`input-glass resize-none${phoneError ? " border-red-500/60" : recipientCount > 0 && !phoneError ? " border-emerald-500/40" : ""}`}
                rows={3}
                placeholder={"0891234567\n0891234568, 0891234569"}
              />
              {phoneError
                ? <p className="text-red-400 text-xs mt-1">{phoneError}</p>
                : <p className="text-[11px] text-[var(--text-muted)] mt-1">{recipientCount} เบอร์ — คั่นด้วยจุลภาค หรือขึ้นบรรทัดใหม่</p>
              }
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs text-slate-300 uppercase tracking-wider mb-2">ข้อความ</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-glass resize-none"
                rows={5}
                placeholder="พิมพ์ข้อความ SMS ที่นี่..."
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {smsCounterText(message) || `0 ตัวอักษร • 0 SMS (${msgType === "english" ? "EN: 160/SMS" : "Thai: 70/SMS"})`}
                </p>
                {message.length > 0 && (
                  <p className="text-[11px] text-amber-400 font-medium">
                    💳 จะใช้ {calculateCreditCost(message)} เครดิต
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preview & Cost */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Preview */}
          <div className="glass p-6">
            <h3 className="text-xs text-slate-300 uppercase tracking-wider mb-4">ตัวอย่าง</h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 min-h-[120px]">
              <div className="text-xs text-cyan-400 mb-2">จาก: {senderName || "EasySlip"}</div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {message || "ข้อความจะแสดงที่นี่..."}
              </p>
            </div>
            <div className="flex justify-between text-xs text-slate-300 mt-3">
              <span>{charCount} ตัวอักษร</span>
              <span>{smsCount} ส่วน SMS</span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="glass p-6">
            <h3 className="text-xs text-slate-300 uppercase tracking-wider mb-4">สรุปเครดิตที่ใช้</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>จำนวนผู้รับ</span>
                <span className="text-white">{recipientCount}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>เครดิต/เบอร์</span>
                <span className="text-white">{message ? calculateCreditCost(message) : 0}</span>
              </div>
              <div className="border-t border-white/5 pt-2 mt-2 flex justify-between font-semibold">
                <span className="text-white">รวมเครดิต</span>
                <span className="text-amber-400 text-lg font-bold">
                  {message && recipientCount > 0 ? calculateCreditCost(message) * recipientCount : 0} เครดิต
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] flex-shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {/[\u0E00-\u0E7F]/.test(message) ? "ไทย: 70 ตัว/SMS" : "EN: 160 ตัว/SMS"} • 1 เครดิต = 1 SMS part
                </p>
              </div>
            </div>

            <div className="mt-5">
              <motion.button
                onClick={handleSend}
                disabled={isPending || !recipients.trim() || !message.trim() || !!phoneError}
                className="w-full btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                    ส่งเลย
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
