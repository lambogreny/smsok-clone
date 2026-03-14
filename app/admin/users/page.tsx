import { Users } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center"
          style={{
            background: "rgba(var(--accent-rgb), 0.08)",
          }}
        >
          <Users
            className="w-8 h-8"
            style={{ color: "var(--accent)" }}
          />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Users
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          ระบบจัดการผู้ใช้งานอยู่ระหว่างการพัฒนา จะเปิดให้ใช้งานเร็ว ๆ นี้
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
