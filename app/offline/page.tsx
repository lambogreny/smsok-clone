"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1118] px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-lg bg-[#10161c] border border-[#20252c] flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8a95a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#F2F4F5] mb-2">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</h1>
        <p className="text-sm text-[#8a95a0] mb-6">กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#00E2B5] text-[#0b1118] hover:opacity-90 transition-opacity cursor-pointer"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}
