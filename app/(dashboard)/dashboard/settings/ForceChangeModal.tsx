"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changePasswordForced } from "@/lib/actions";
import { fieldCls } from "@/lib/form-utils";
import { safeErrorMessage } from "@/lib/error-messages";

export default function ForceChangeModal({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const isValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    newPassword === confirmPassword;

  function handleSubmit() {
    if (!isValid) return;
    setError("");
    startTransition(async () => {
      try {
        await changePasswordForced(userId, newPassword);
        toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
        router.replace("/dashboard");
      } catch (e) {
        const msg = safeErrorMessage(e);
        setError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent-secondary)] to-[var(--accent)]" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">ต้องเปลี่ยนรหัสผ่าน</h2>
          <p className="text-sm text-[var(--text-secondary)]">คุณกำลังใช้รหัสผ่านชั่วคราว กรุณาตั้งรหัสผ่านใหม่ก่อนดำเนินการต่อ</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(var(--error-rgb,239,68,68),0.08)] border border-[rgba(var(--error-rgb,239,68,68),0.15)] text-[var(--error)] text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={fieldCls(
                newPassword && (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) ? "error" : undefined,
                newPassword
              )}
              placeholder="อย่างน้อย 8 ตัว มีตัวใหญ่และตัวเลข"
              autoFocus
            />
            {newPassword.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {[{ re: /.{8}/, label: "8+ ตัว" }, { re: /[A-Z]/, label: "A-Z" }, { re: /[0-9]/, label: "0-9" }].map(({ re, label }) => (
                  <span key={label} className={`text-[10px] px-1.5 py-0.5 rounded ${re.test(newPassword) ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-[var(--text-secondary)]"}`}>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldCls(
                confirmPassword && newPassword !== confirmPassword ? "error" : undefined,
                confirmPassword
              )}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              onKeyUp={(e) => e.key === "Enter" && handleSubmit()}
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[var(--error)] text-xs mt-1">รหัสผ่านไม่ตรงกัน</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending || !isValid}
            className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังบันทึก...
              </>
            ) : (
              "ตั้งรหัสผ่านใหม่ →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
