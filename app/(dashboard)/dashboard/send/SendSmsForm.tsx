"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendSms, sendBatchSms } from "@/lib/actions/sms";

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
    <motion.div
      className="p-6 md:p-8 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h2 className="text-2xl font-bold mb-1 tracking-tight bg-gradient-to-r from-sky-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">ส่ง SMS</h2>
      <p className="text-sm text-white/40 mb-8">ส่งข้อความ SMS ถึงผู้รับ</p>

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/[0.12] to-violet-500/[0.08] border border-sky-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">เขียนข้อความ</span>
          </h3>

          <div className="space-y-5">
            {/* Sender Name */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">ชื่อผู้ส่ง</label>
              <div className="relative">
                <select
                  className="input-glass cursor-pointer appearance-none pr-10"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                >
                  <option value="EasySlip" className="bg-[#0a0f1a] text-white">EasySlip (ค่าเริ่มต้น)</option>
                  {senderNames.filter(n => n !== "EasySlip").map((name) => (
                    <option key={name} value={name} className="bg-[#0a0f1a] text-white">
                      {name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
              <p className="text-[11px] text-white/20 mt-1.5">
                {senderName === "EasySlip" ? "ใช้ชื่อค่าเริ่มต้นได้เลย หรือ" : "Sender ที่ผ่านอนุมัติแล้ว — "}{" "}
                <a href="/dashboard/senders" className="text-sky-400/60 hover:text-sky-400 transition-colors">ขอ Sender Name ใหม่ →</a>
              </p>
            </div>

            {/* Message Type */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">ประเภทข้อความ</label>
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
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">ผู้รับ</label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className="input-glass resize-none"
                rows={3}
                placeholder={"0891234567\n0891234568, 0891234569"}
              />
              <p className="text-[11px] text-white/20 mt-1">
                {recipientCount} เบอร์ — คั่นด้วยเครื่องหมายจุลภาค หรือขึ้นบรรทัดใหม่
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">ข้อความ</label>
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
                  {charCount} ตัวอักษร | {smsCount} ส่วน SMS
                </span>
                <span>
                  {msgType === "english" ? "160" : "70"} ตัวอักษร/SMS
                </span>
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
            <h3 className="text-xs text-white/50 uppercase tracking-wider mb-4">ตัวอย่าง</h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 min-h-[120px]">
              <div className="text-xs text-sky-400 mb-2">จาก: {senderName || "EasySlip"}</div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">
                {message || "ข้อความจะแสดงที่นี่..."}
              </p>
            </div>
            <div className="flex justify-between text-xs text-white/30 mt-3">
              <span>{charCount} ตัวอักษร</span>
              <span>{smsCount} ส่วน SMS</span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="glass p-6">
            <h3 className="text-xs text-white/50 uppercase tracking-wider mb-4">สรุปค่าใช้จ่าย</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/50">
                <span>จำนวนผู้รับ</span>
                <span className="text-white">{recipientCount}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>จำนวนส่วน SMS</span>
                <span className="text-white">{smsCount}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>ราคา/SMS</span>
                <span className="text-white">฿0.22</span>
              </div>
              <div className="border-t border-white/5 pt-2 mt-2 flex justify-between font-semibold">
                <span className="text-white">รวม</span>
                <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent text-lg">฿{totalCost}</span>
              </div>
            </div>

            <div className="mt-5">
              <motion.button
                onClick={handleSend}
                disabled={isPending || !recipients.trim() || !message.trim()}
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
