"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="antialiased bg-[var(--bg-base)] text-white">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              ระบบพบปัญหาบางอย่าง กรุณาลองใหม่อีกครั้ง
            </p>
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
