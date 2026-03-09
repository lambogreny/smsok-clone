import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSenderNames } from "@/lib/actions/sender-names";
import SenderNameForm from "./SenderNameForm";

export default async function SendersPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const senderNames = await getSenderNames(user.id);

  const statusConfig: Record<string, { badge: string; label: string }> = {
    pending: { badge: "badge-warning", label: "PENDING" },
    approved: { badge: "badge-success", label: "APPROVED" },
    rejected: { badge: "badge-error", label: "REJECTED" },
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Sender Names</h1>
      <p className="text-sm text-white/40 mb-8">จัดการชื่อผู้ส่ง SMS ของคุณ</p>

      {/* Info Note */}
      <div className="glass p-4 mb-6">
        <p className="text-xs text-white/40 leading-relaxed">
          <span className="text-sky-400 font-semibold">Note:</span> Sender name ใช้เวลาอนุมัติ 1-2 วันทำการ ระหว่างรออนุมัติสามารถใช้ชื่อ SMSOK (Default) ส่ง SMS ได้เลย
        </p>
      </div>

      {/* Request New Sender Name */}
      <div className="glass p-6 md:p-8 mb-8">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          ขอชื่อผู้ส่งใหม่
        </h2>
        <SenderNameForm userId={user.id} />
      </div>

      {/* Sender Names List */}
      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                <path d="M20 7h-9M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
              </svg>
            </div>
            ชื่อผู้ส่งทั้งหมด
            <span className="text-xs text-white/30 font-normal ml-2">({senderNames.length})</span>
          </h2>
        </div>

        {senderNames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">ชื่อผู้ส่ง</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">สถานะ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">วันที่ขอ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">วันที่อนุมัติ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {senderNames.map((sender) => {
                  const s = statusConfig[sender.status] ?? { badge: "badge-info", label: sender.status.toUpperCase() };
                  return (
                    <tr key={sender.id} className="table-row">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs">
                            {sender.name.charAt(0)}
                          </div>
                          <span className="text-white/70 font-mono font-semibold">{sender.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className={`badge ${s.badge}`}>{s.label}</span></td>
                      <td className="px-5 py-3.5 text-white/30 text-xs">{new Date(sender.createdAt).toLocaleDateString("th-TH")}</td>
                      <td className="px-5 py-3.5 text-white/30 text-xs">{sender.approvedAt ? new Date(sender.approvedAt).toLocaleDateString("th-TH") : "-"}</td>
                      <td className="px-5 py-3.5 text-white/30 text-xs">{sender.rejectNote || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-14">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
                <path d="M20 7h-9M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
              </svg>
            </div>
            <p className="text-sm text-white/25 mb-1">ยังไม่มีชื่อผู้ส่ง</p>
            <p className="text-xs text-white/15">ขอชื่อผู้ส่งใหม่ด้านบนเพื่อเริ่มต้นใช้งาน</p>
          </div>
        )}
      </div>
    </div>
  );
}
