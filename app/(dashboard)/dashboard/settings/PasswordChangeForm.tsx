"use client";

import { useState } from "react";

export default function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isValid = currentPassword.length >= 1 && newPassword.length >= 8 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (newPassword !== confirmPassword) {
      setResult({ type: "error", message: "รหัสผ่านใหม่ไม่ตรงกัน" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      setResult({ type: "success", message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setResult({ type: "error", message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">รหัสผ่านปัจจุบัน</label>
          <input
            type="password"
            className="input-glass"
            placeholder="กรอกรหัสผ่านปัจจุบัน"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">รหัสผ่านใหม่</label>
            <input
              type="password"
              className="input-glass"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-400 mt-1">ต้องมีอย่างน้อย 8 ตัวอักษร</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              className="input-glass"
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">รหัสผ่านไม่ตรงกัน</p>
            )}
          </div>
        </div>
      </div>

      {result && (
        <p className={`mt-4 text-xs font-medium ${result.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {result.message}
        </p>
      )}

      <div className="mt-5">
        <button
          type="submit"
          disabled={!isValid || loading}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              กำลังบันทึก...
            </span>
          ) : (
            "เปลี่ยนรหัสผ่าน"
          )}
        </button>
      </div>
    </form>
  );
}
