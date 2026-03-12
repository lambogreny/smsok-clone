"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/CustomSelect";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

/* ─── Config ─── */

const LANG_OPTIONS = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "English" },
];

/* ─── Main Component ─── */

export default function OptoutPage() {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState("th");
  const [title, setTitle] = useState("ยกเลิกการรับข้อความจาก SMSOK");
  const [confirmMsg, setConfirmMsg] = useState(
    "คุณจะไม่ได้รับข้อความจากเราอีก\nการดำเนินการจะเสร็จภายใน 24 ชม."
  );
  const [blockStart, setBlockStart] = useState("20");
  const [blockEnd, setBlockEnd] = useState("08");

  const optoutUrl = "https://smsok.app/optout/abc123";

  function handleCopy() {
    navigator.clipboard.writeText(optoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
    value: String(i).padStart(2, "0"),
    label: `${String(i).padStart(2, "0")}:00`,
  }));

  return (
    <PageLayout>
      <PageHeader title="ลิงก์ยกเลิกการรับข้อความ" />

      <div className="space-y-5 max-w-2xl">
        {/* Active Link */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            ลิงก์ opt-out ที่ใช้งานอยู่
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] font-mono truncate">
              {optoutUrl}
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-[var(--border-default)] text-[var(--text-secondary)] gap-2 rounded-xl flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[var(--success)]" /> คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> คัดลอก
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Opt-out Message Settings */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 space-y-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            ตั้งค่าข้อความ opt-out
          </h3>

          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">ภาษา</label>
            <div className="w-[160px]">
              <CustomSelect
                value={lang}
                onChange={setLang}
                options={LANG_OPTIONS}
                placeholder="เลือกภาษา"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">หัวข้อ</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[var(--bg-surface)] border-[var(--border-default)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
              ข้อความยืนยัน
            </label>
            <textarea
              value={confirmMsg}
              onChange={(e) => setConfirmMsg(e.target.value)}
              rows={3}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* SMS Preview */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <p className="text-sm text-[var(--text-secondary)] mb-3">ตัวอย่างลิงก์ใน SMS:</p>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] italic">
            &ldquo;ยกเลิกรับข้อความ: https://smsok.app/o/abc123&rdquo;
          </div>
        </div>

        {/* Sending Hours */}
        <div className="rounded-xl border-l-[3px] border-[var(--warning)] bg-[rgba(var(--warning-rgb),0.06)] px-4 py-3">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-[var(--warning)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium mb-2">
                Sending hours
              </p>
              <p className="text-[13px] text-[var(--text-secondary)] mb-3">
                ไม่ส่ง marketing SMS ระหว่าง
              </p>
              <div className="flex items-center gap-2">
                <div className="w-[100px]">
                  <CustomSelect
                    value={blockStart}
                    onChange={setBlockStart}
                    options={HOUR_OPTIONS}
                    placeholder="เริ่ม"
                  />
                </div>
                <span className="text-sm text-[var(--text-secondary)]">ถึง</span>
                <div className="w-[100px]">
                  <CustomSelect
                    value={blockEnd}
                    onChange={setBlockEnd}
                    options={HOUR_OPTIONS}
                    placeholder="สิ้นสุด"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <Button className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold rounded-xl">
          บันทึกการตั้งค่า
        </Button>
      </div>
    </PageLayout>
  );
}
