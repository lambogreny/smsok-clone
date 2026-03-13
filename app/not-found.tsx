import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-base)]">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <p className="text-[120px] font-extrabold leading-none tracking-tight select-none text-transparent [-webkit-text-stroke:2px_var(--border-default)]">
          404
        </p>

        {/* Message */}
        <h1 className="text-2xl font-bold mt-4 text-[var(--text-primary)]">
          ไม่พบหน้าที่ค้นหา
        </h1>
        <p className="text-sm mt-2 leading-relaxed text-[var(--text-muted)]">
          หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-6 h-11 text-sm font-medium transition-colors bg-[var(--accent)] text-[var(--text-on-accent)]"
          >
            กลับหน้าหลัก
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg px-6 h-11 text-sm font-medium transition-colors bg-transparent text-[var(--text-secondary)] border border-[var(--border-default)]"
          >
            ไปที่ Dashboard
          </Link>
        </div>

        {/* Decorative line */}
        <div className="mt-12 mx-auto h-px w-24 bg-[var(--border-default)]" />
        <p className="text-xs mt-4 text-[var(--text-muted)]">
          SMSOK
        </p>
      </div>
    </div>
  );
}
