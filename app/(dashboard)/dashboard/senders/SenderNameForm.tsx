"use client";

import { useState } from "react";
import { requestSenderName } from "@/lib/actions/sender-names";

export default function SenderNameForm({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isValid = /^[A-Za-z0-9]{3,11}$/.test(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setResult(null);

    try {
      await requestSenderName(userId, { name });
      setResult({ type: "success", message: "ส่งคำขอชื่อผู้ส่งเรียบร้อยแล้ว รอการอนุมัติ" });
      setName("");
    } catch (e) {
      setResult({ type: "error", message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ชื่อผู้ส่ง (3-11 ตัวอักษร, A-Z, 0-9)</label>
          <input
            type="text"
            className="input-glass"
            placeholder="MySender"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
            maxLength={11}
            minLength={3}
          />
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs ${name.length >= 3 && name.length <= 11 ? "text-emerald-400" : "text-white/20"}`}>
              {name.length}/11 ตัวอักษร
            </span>
            {name.length > 0 && !isValid && (
              <span className="text-xs text-red-400">ต้องมี 3-11 ตัวอักษร (A-Z, 0-9 เท่านั้น)</span>
            )}
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!isValid || loading}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                กำลังส่ง...
              </span>
            ) : (
              <>
                ขอชื่อผู้ส่ง
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
      {result && (
        <p className={`mt-3 text-xs font-medium ${result.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
