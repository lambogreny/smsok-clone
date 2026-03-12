"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";

export default function ScheduledPage() {
  const router = useRouter();

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              ตั้งเวลาส่ง SMS
            </h1>
            <span className="badge badge-warning">เร็วๆ นี้</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            จัดตารางส่ง SMS อัตโนมัติตามเวลาที่กำหนด
          </p>
        </div>
        <Link
          href="/dashboard"
          className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] px-4 py-2 text-sm font-medium"
        >
          กลับแดชบอร์ด
        </Link>
      </div>

      {/* Schedule Form */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          ตั้งเวลาส่งข้อความใหม่
        </h2>

        <form className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sender Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                ชื่อผู้ส่ง
              </label>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none px-3 py-2 w-full flex items-center justify-between opacity-50 cursor-not-allowed">
                <span className="text-sm text-[var(--text-muted)]">เลือกชื่อผู้ส่ง</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                เบอร์ปลายทาง
              </label>
              <input
                type="tel"
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none px-3 py-2 w-full"
                placeholder="08XXXXXXXX"
                disabled
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              ข้อความ
            </label>
            <textarea
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none px-3 py-2 w-full min-h-[100px] resize-none"
              placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
              rows={4}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                วันที่
              </label>
              <Input type="date" className="w-full" disabled />
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                เวลา
              </label>
              <Input type="time" className="w-full" disabled />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="btn-primary px-6 py-2.5 text-sm font-medium opacity-50 cursor-not-allowed"
              disabled
            >
              ตั้งเวลาส่ง
            </button>
          </div>
        </form>
      </div>

      {/* Scheduled Messages Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          รายการตั้งเวลา
        </h2>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)]">
          <div>ชื่อผู้ส่ง</div>
          <div>เบอร์ปลายทาง</div>
          <div>ข้อความ</div>
          <div>วันที่</div>
          <div>เวลา</div>
          <div>สถานะ</div>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={CalendarClock}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb), 0.1)"
          title="ยังไม่มีข้อความตั้งเวลา"
          description="ตั้งเวลาส่ง SMS ล่วงหน้าเพื่อเข้าถึงลูกค้าในเวลาที่เหมาะสม"
          ctaLabel="ตั้งเวลาส่ง SMS"
          ctaAction={() => router.push("/dashboard/send")}
        />

        {/* Legend */}
        <div className="flex items-center gap-4 pt-4 border-t border-[var(--border-default)]">
          <span className="text-xs text-[var(--text-muted)]">สถานะ:</span>
          <span className="badge badge-warning">รอส่ง</span>
          <span className="badge badge-success">ส่งแล้ว</span>
          <span className="badge badge-error">ยกเลิก</span>
        </div>
      </div>
    </div>
  );
}
