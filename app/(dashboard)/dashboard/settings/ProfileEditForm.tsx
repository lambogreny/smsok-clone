"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/settings";
import { fieldCls } from "@/lib/form-utils";

type Props = {
  userId: string;
  initialName: string;
};

export default function ProfileEditForm({ userId, initialName }: Props) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) return;
    setResult(null);
    startTransition(async () => {
      try {
        await updateProfile(userId, { name: name.trim() });
        setResult({ type: "success", message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
        toast.success("บันทึกโปรไฟล์สำเร็จ");
      } catch (err) {
        setResult({ type: "error", message: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" });
        toast.error("ไม่สามารถบันทึกโปรไฟล์ได้");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">ชื่อ</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldCls(name.trim().length < 2 && name.length > 0 ? "ชื่อสั้นเกินไป" : undefined, name)}
          placeholder="สมชาย ใจดี"
          minLength={2}
          maxLength={100}
          required
        />
        {name.trim().length < 2 && name.length > 0 && (
          <p className="text-[var(--error)] text-xs mt-1">ชื่อต้องมีอย่างน้อย 2 ตัวอักษร</p>
        )}
      </div>

      {result && (
        <p className={`text-xs font-medium ${result.type === "success" ? "text-emerald-400" : "text-[var(--error)]"}`}>
          {result.message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending || !name.trim() || name.trim().length < 2}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              กำลังบันทึก...
            </>
          ) : (
            "บันทึกชื่อ"
          )}
        </button>
      </div>
    </form>
  );
}
