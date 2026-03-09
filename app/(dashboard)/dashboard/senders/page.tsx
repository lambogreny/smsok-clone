import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSenderNames } from "@/lib/actions/sender-names";
import SenderNameForm from "./SenderNameForm";

export default async function SendersPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const senderNames = await getSenderNames(user.id);

  const statusConfig: Record<string, { badge: string; label: string; icon: string }> = {
    pending: { badge: "badge-warning", label: "รออนุมัติ", icon: "⏳" },
    approved: { badge: "badge-success", label: "อนุมัติแล้ว", icon: "✓" },
    rejected: { badge: "badge-error", label: "ถูกปฏิเสธ", icon: "✕" },
  };

  const approvedCount = senderNames.filter((s: typeof senderNames[number]) => s.status === "approved").length;
  const pendingCount = senderNames.filter((s: typeof senderNames[number]) => s.status === "pending").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-1 tracking-tight gradient-text-mixed">ชื่อผู้ส่ง</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">ยื่นคำขอชื่อผู้ส่งเพื่อใช้ส่ง SMS ในชื่อแบรนด์ของคุณ</p>

      {/* Request Process Info */}
      <div className="glass p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-medium mb-2">ขั้นตอนการขอชื่อผู้ส่ง</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-[10px] font-bold">1</span>
                <span>ยื่นคำขอชื่อผู้ส่ง</span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">→</div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-[10px] font-bold">2</span>
                <span>ทีมงานตรวจสอบ (1-2 วันทำการ)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">→</div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">3</span>
                <span>อนุมัติแล้ว → ใช้ส่ง SMS ได้</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-3">
              ระหว่างรอสามารถใช้ <span className="text-cyan-300/60 font-medium">EasySlip</span> (Default) ส่ง SMS ได้เลย
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold text-white">{senderNames.length}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">คำขอทั้งหมด</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{approvedCount}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">อนุมัติแล้ว</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">รออนุมัติ</p>
        </div>
      </div>

      {/* Request New Sender Name */}
      <div className="glass p-6 md:p-8 mb-8">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M12 18v-6M9 15h6" />
            </svg>
          </div>
          ยื่นคำขอชื่อผู้ส่งใหม่
        </h2>
        <SenderNameForm userId={user.id} />
      </div>

      {/* Sender Names List */}
      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" />
              </svg>
            </div>
            ประวัติคำขอทั้งหมด
            <span className="text-xs text-[var(--text-muted)] font-normal ml-2">({senderNames.length})</span>
          </h2>
        </div>

        {senderNames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">ชื่อผู้ส่ง</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">สถานะคำขอ</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">วันที่ยื่นคำขอ</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">วันที่อนุมัติ</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {senderNames.map((sender: typeof senderNames[number]) => {
                  const s = statusConfig[sender.status] ?? { badge: "badge-info", label: sender.status.toUpperCase(), icon: "?" };
                  return (
                    <tr key={sender.id} className="table-row">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs">
                            {sender.name.charAt(0)}
                          </div>
                          <span className="text-white/70 font-mono font-semibold">{sender.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className={`badge ${s.badge}`}>{s.icon} {s.label}</span></td>
                      <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{new Date(sender.createdAt).toLocaleDateString("th-TH")}</td>
                      <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{sender.approvedAt ? new Date(sender.approvedAt).toLocaleDateString("th-TH") : "-"}</td>
                      <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{sender.rejectNote || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-14">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M12 18v-6M9 15h6" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีคำขอชื่อผู้ส่ง</p>
            <p className="text-xs text-[var(--text-muted)]">ยื่นคำขอด้านบนเพื่อใช้ชื่อแบรนด์ของคุณส่ง SMS</p>
          </div>
        )}
      </div>
    </div>
  );
}
