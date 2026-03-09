import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessages } from "@/lib/actions/sms";
import DashboardShell from "../DashboardShell";
import Link from "next/link";

const statusConfig: Record<string, { badge: string; label: string }> = {
  delivered: { badge: "badge badge-success", label: "Delivered" },
  sent: { badge: "badge badge-info", label: "Sent" },
  pending: { badge: "badge badge-warning", label: "Pending" },
  failed: { badge: "badge badge-error", label: "Failed" },
};

export default async function MessagesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { messages, pagination } = await getMessages(user.id, {
    page: 1,
    limit: 50,
  });

  return (
    <DashboardShell user={user} title="Messages">
      <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Message History</h2>
            <p className="text-sm text-white/40 mt-1">
              ประวัติการส่ง SMS ทั้งหมด ({pagination.total} รายการ)
            </p>
          </div>
          <Link
            href="/dashboard/send"
            className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
          >
            Send SMS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {messages.length > 0 ? (
          <div className="glass overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Recipient</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Sender</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Credits</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => {
                    const status = statusConfig[msg.status] || statusConfig.pending;
                    return (
                      <tr key={msg.id} className="table-row">
                        <td className="px-5 py-3.5 text-white/70 font-mono text-xs">{msg.recipient}</td>
                        <td className="px-5 py-3.5 text-white/50">{msg.senderName}</td>
                        <td className="px-5 py-3.5">
                          <span className={status.badge}>{status.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-white/50 font-mono">{msg.creditCost}</td>
                        <td className="px-5 py-3.5 text-white/30 text-xs">
                          {new Date(msg.createdAt).toLocaleString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination info */}
            {pagination.totalPages > 1 && (
              <div className="border-t border-white/5 px-5 py-3 flex items-center justify-between text-xs text-white/30">
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <span>{pagination.total} total messages</span>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="glass p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-sm text-white/25 mb-1">No messages yet</p>
            <p className="text-xs text-white/15 mb-5">ส่ง SMS แรกของคุณเลย</p>
            <Link
              href="/dashboard/send"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Send SMS
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
