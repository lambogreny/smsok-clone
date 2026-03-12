"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Shield,
  MoreHorizontal,
  UserPlus,
  Send as SendIcon,
  Trash2,
  ChevronRight,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmptyStateShared from "@/components/EmptyState";
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  TableWrapper,
  EmptyState,
} from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type Role = "owner" | "admin" | "member" | "viewer" | "api-only";
type Status = "active" | "pending";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastSeen: string;
  online?: boolean;
};

/* ─── Config ─── */

const ROLE_CONFIG: Record<
  Role,
  { label: string; color: string; bg: string; description: string }
> = {
  owner: {
    label: "Owner",
    color: "var(--warning)",
    bg: "rgba(var(--warning-rgb),0.08)",
    description: "เจ้าของ",
  },
  admin: {
    label: "Admin",
    color: "var(--accent)",
    bg: "rgba(var(--accent-rgb),0.08)",
    description: "ดูแลระบบ",
  },
  member: {
    label: "Member",
    color: "var(--text-muted)",
    bg: "rgba(var(--text-muted-rgb),0.08)",
    description: "ใช้งาน",
  },
  viewer: {
    label: "Viewer",
    color: "var(--text-secondary)",
    bg: "rgba(var(--text-muted-rgb),0.08)",
    description: "ดูอย่างเดียว",
  },
  "api-only": {
    label: "API-only",
    color: "var(--info)",
    bg: "rgba(var(--info-rgb),0.08)",
    description: "เฉพาะ API",
  },
};

const INVITE_ROLES: { value: Role; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "ดูแลระบบ" },
  { value: "member", label: "Member", description: "ใช้งาน" },
  { value: "viewer", label: "Viewer", description: "ดูอย่างเดียว" },
  { value: "api-only", label: "API", description: "เฉพาะ API" },
];

/* ─── Mock Data ─── */

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "สมชาย ใจดี",
    email: "somchai@mail.com",
    role: "owner",
    status: "active",
    lastSeen: "5 นาที",
    online: true,
  },
  {
    id: "2",
    name: "สมศรี รักดี",
    email: "somsri@mail.com",
    role: "admin",
    status: "active",
    lastSeen: "1 ชม.",
    online: true,
  },
  {
    id: "3",
    name: "วิชัย สุขใจ",
    email: "wichai@mail.com",
    role: "member",
    status: "active",
    lastSeen: "2 วัน",
    online: false,
  },
  {
    id: "4",
    name: "",
    email: "newmember@mail.com",
    role: "member",
    status: "pending",
    lastSeen: "—",
    online: false,
  },
];

/* ─── Main Component ─── */

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteSending, setInviteSending] = useState(false);

  async function handleSendInvite() {
    if (!inviteEmail.trim()) {
      toast.error("กรุณากรอกอีเมล");
      return;
    }
    setInviteSending(true);
    try {
      const res = await fetch("/api/v1/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "ไม่สามารถส่งคำเชิญได้");
      }
      toast.success(`ส่งคำเชิญไปยัง ${inviteEmail} แล้ว`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      setInviteMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setInviteSending(false);
    }
  }

  const activeCount = MOCK_MEMBERS.filter((m) => m.status === "active").length;
  const pendingCount = MOCK_MEMBERS.filter(
    (m) => m.status === "pending"
  ).length;

  return (
    <PageLayout>
      <PageHeader
        title="สมาชิกทีม"
        count={MOCK_MEMBERS.length}
        actions={
          <Button
            onClick={() => setInviteOpen(true)}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold gap-2"
          >
            <UserPlus className="w-4 h-4" /> เชิญสมาชิก
          </Button>
        }
      />

      <StatsRow columns={3}>
        <StatCard
          icon={<Users className="w-4 h-4" style={{ color: "var(--accent)" }} />}
          iconColor="var(--accent-rgb)"
          value={activeCount}
          label="สมาชิก"
        />
        <StatCard
          icon={<Mail className="w-4 h-4" style={{ color: "var(--warning)" }} />}
          iconColor="var(--warning-rgb)"
          value={pendingCount}
          label="รอตอบรับ"
        />
        <StatCard
          icon={<Shield className="w-4 h-4" style={{ color: "var(--info)" }} />}
          iconColor="var(--info-rgb)"
          value="3 แบบ"
          label="บทบาท"
        />
      </StatsRow>

      {MOCK_MEMBERS.length <= 1 ? (
        <EmptyStateShared
          icon={UserPlus}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb),0.06)"
          iconBorder="rgba(var(--accent-rgb),0.1)"
          title="คุณเป็นสมาชิกเพียงคนเดียว"
          description={"เชิญทีมงานมาช่วยจัดการ SMS campaigns\nแบ่งหน้าที่ด้วยระบบ role-based access"}
          ctaLabel="+ เชิญสมาชิก"
          ctaAction={() => setInviteOpen(true)}
        />
      ) : (
      <TableWrapper>
        {/* Header */}
        <div className="grid grid-cols-[1fr_200px_100px_100px_100px_60px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>สมาชิก</span>
          <span className="hidden md:block">อีเมล</span>
          <span>บทบาท</span>
          <span>สถานะ</span>
          <span className="hidden md:block">เข้าล่าสุด</span>
          <span />
        </div>

        {/* Body */}
        {MOCK_MEMBERS.map((member, i) => {
          const roleConfig = ROLE_CONFIG[member.role];
          const isPending = member.status === "pending";
          return (
            <div
              key={member.id}
              className={`grid grid-cols-[1fr_200px_100px_100px_100px_60px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isPending
                        ? "bg-[rgba(107,112,117,0.15)] text-[var(--text-muted)]"
                        : "bg-[var(--accent)] text-[var(--text-on-accent)]"
                    }`}
                  >
                    {isPending ? (
                      <Mail className="w-3.5 h-3.5" />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  {member.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--bg-surface)]" />
                  )}
                </div>
                <span className="text-sm text-[var(--text-primary)] font-medium">
                  {isPending ? "—" : member.name}
                </span>
              </div>

              {/* Email */}
              <span className="text-xs text-[var(--text-secondary)] hidden md:block">
                {member.email}
              </span>

              {/* Role Badge */}
              <span
                className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                style={{
                  background: roleConfig.bg,
                  color: roleConfig.color,
                }}
              >
                {roleConfig.label}
              </span>

              {/* Status */}
              <span
                className={`text-xs ${
                  isPending
                    ? "text-[var(--warning)] italic"
                    : "text-[var(--success)]"
                }`}
              >
                {isPending ? "Pending" : "Active"}
              </span>

              {/* Last seen */}
              <span className="text-xs text-[var(--text-secondary)] hidden md:block">
                {member.lastSeen}
              </span>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <ChevronRight className="w-3.5 h-3.5" />
                    เปลี่ยนบทบาท
                  </DropdownMenuItem>
                  {isPending && (
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <SendIcon className="w-3.5 h-3.5" />
                      ส่งคำเชิญอีกครั้ง
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-[var(--error)] cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบออกจากทีม
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </TableWrapper>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[520px] bg-[var(--bg-surface)] border-[var(--border-default)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">เชิญสมาชิกใหม่</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Email */}
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                อีเมล <span className="text-[var(--error)]">*</span>
              </label>
              <Input
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-[var(--bg-surface)] border-[var(--border-default)]"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                คั่นด้วย comma เพื่อเชิญหลายคน
              </p>
            </div>

            {/* Role Radio Cards */}
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                บทบาท <span className="text-[var(--error)]">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {INVITE_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setInviteRole(role.value)}
                    className={`rounded-xl p-3 text-center transition-all cursor-pointer ${
                      inviteRole === role.value
                        ? "border-2 border-[var(--accent)] bg-[rgba(0,226,181,0.04)]"
                        : "border border-[var(--border-default)] hover:border-[rgba(0,226,181,0.2)]"
                    }`}
                  >
                    <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {role.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {role.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                ข้อความ (ตัวเลือก)
              </label>
              <textarea
                placeholder="สวัสดี ขอเชิญเข้าร่วมทีม..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              className="border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={inviteSending || !inviteEmail.trim()}
              className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold gap-2"
            >
              {inviteSending ? "กำลังส่ง..." : <>ส่งคำเชิญ <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
