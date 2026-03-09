"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/actions/campaigns";

// ─── Types ────────────────────────────────────────────────────────────────
type CampaignStatus = "draft" | "scheduled" | "running" | "completed" | "cancelled";

type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  groupName: string;
  templateName: string;
  senderName: string;
  scheduledAt: string | null;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  creditReserved: number;
  creditUsed: number;
  createdAt: string;
};

type ContactGroup = { id: string; name: string; count: number };
type Template = { id: string; name: string; body: string };

// ─── Helpers ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; bg: string; text: string; dot: string; pulse?: boolean }
> = {
  draft: { label: "แบบร่าง", bg: "bg-slate-500/10", text: "text-slate-300", dot: "bg-slate-300" },
  scheduled: { label: "ตั้งเวลา", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  running: { label: "กำลังส่ง", bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400", pulse: true },
  completed: { label: "เสร็จสิ้น", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  cancelled: { label: "ยกเลิก", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProgressBar({ sent, total }: { sent: number; total: number }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[var(--text-muted)]">
          {sent.toLocaleString()} / {total.toLocaleString()}
        </span>
        <span className="text-[10px] font-semibold text-cyan-400">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Animations ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

// ─── Main Component ──────────────────────────────────────────────────────
export default function CampaignsClient({
  userId,
  initialCampaigns,
  groups,
  templates,
}: {
  userId: string;
  initialCampaigns: Campaign[];
  groups: ContactGroup[];
  templates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [campaigns] = useState<Campaign[]>(initialCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "all">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formGroup, setFormGroup] = useState("");
  const [formTemplate, setFormTemplate] = useState("");
  const [formSender, setFormSender] = useState("");
  const [formSchedule, setFormSchedule] = useState("");

  // Detail view
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const filtered =
    filterStatus === "all" ? campaigns : campaigns.filter((c) => c.status === filterStatus);

  // Stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "running" || c.status === "scheduled"
  ).length;
  const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;
  const totalSmsSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);

  const selectedGroup = groups.find((g) => g.id === formGroup);
  const creditEstimate = selectedGroup ? selectedGroup.count : 0;

  const handleCreate = () => {
    if (!formName.trim() || !formGroup || !formTemplate) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await createCampaign(userId, {
          name: formName.trim(),
          contactGroupId: formGroup,
          templateId: formTemplate,
          senderName: formSender.trim() || "EasySlip",
          scheduledAt: formSchedule ? new Date(formSchedule).toISOString() : undefined,
        });
        setFeedback({ type: "success", text: "สร้างแคมเปญสำเร็จ!" });
        setFormName("");
        setFormGroup("");
        setFormTemplate("");
        setFormSender("");
        setFormSchedule("");
        setShowForm(false);
        router.refresh();
      } catch (e) {
        setFeedback({ type: "error", text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" });
      }
    });
  };

  const handleAction = (_id: string, _action: "start" | "cancel") => {
    // TODO: implement campaign start/cancel via server action
    setFeedback({ type: "error", text: "ฟีเจอร์นี้กำลังพัฒนา" });
    if (selectedCampaign?.id === _id) setSelectedCampaign(null);
  };

  const statCards = [
    {
      label: "แคมเปญทั้งหมด",
      value: totalCampaigns,
      glass: "glass-violet",
      color: "text-violet-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      ),
    },
    {
      label: "กำลังดำเนินการ",
      value: activeCampaigns,
      glass: "glass-cyan",
      color: "text-cyan-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "เสร็จสิ้น",
      value: completedCampaigns,
      glass: "glass-emerald",
      color: "text-emerald-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: "SMS ส่งแล้ว",
      value: totalSmsSent.toLocaleString(),
      glass: "glass-rose",
      color: "text-amber-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  const filterTabs: { key: CampaignStatus | "all"; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "draft", label: "แบบร่าง" },
    { key: "scheduled", label: "ตั้งเวลา" },
    { key: "running", label: "กำลังส่ง" },
    { key: "completed", label: "เสร็จสิ้น" },
    { key: "cancelled", label: "ยกเลิก" },
  ];

  return (
    <motion.div className="p-6 md:p-8 max-w-6xl" initial="hidden" animate="show" variants={stagger}>
      {/* Beta Banner */}
      <motion.div
        variants={fadeUp}
        className="mb-6 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold text-amber-400">Beta</span>
          <span className="text-sm text-[var(--text-secondary)] ml-2">
            ระบบแคมเปญ SMS — สร้างและจัดการแคมเปญส่งข้อความแบบกลุ่ม
          </span>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold gradient-text-mixed mb-1">แคมเปญ SMS</h1>
          <p className="text-sm text-[var(--text-muted)]">สร้างและจัดการแคมเปญส่ง SMS จำนวนมาก</p>
        </div>
        <motion.button
          onClick={() => {
            setShowForm(!showForm);
            setSelectedCampaign(null);
          }}
          className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2 font-semibold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showForm ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              ยกเลิก
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              สร้างแคมเปญ
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" variants={stagger}>
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className={`${stat.glass} card-hover p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Create Campaign Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass p-6 mb-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/[0.12] to-cyan-500/[0.08] border border-violet-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <span className="gradient-text-mixed">สร้างแคมเปญใหม่</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  ชื่อแคมเปญ *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="เช่น โปรโมชั่นเดือนมีนาคม"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  ชื่อผู้ส่ง
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="SMSOK"
                  value={formSender}
                  onChange={(e) => setFormSender(e.target.value)}
                />
              </div>

              {/* Contact Group */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  กลุ่มผู้รับ *
                </label>
                <select
                  className="input-glass"
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                >
                  <option value="">-- เลือกกลุ่ม --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.count.toLocaleString()} รายชื่อ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Template */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  เทมเพลต *
                </label>
                <select
                  className="input-glass"
                  value={formTemplate}
                  onChange={(e) => setFormTemplate(e.target.value)}
                >
                  <option value="">-- เลือกเทมเพลต --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  ตั้งเวลาส่ง
                </label>
                <input
                  type="datetime-local"
                  className="input-glass"
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  เว้นว่างเพื่อบันทึกเป็นแบบร่าง
                </p>
              </div>

              {/* Credit Estimate */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  ประมาณการเครดิต
                </label>
                <div className="input-glass flex items-center justify-between pointer-events-none">
                  <span className="text-[var(--text-secondary)]">
                    {creditEstimate > 0
                      ? `${creditEstimate.toLocaleString()} เครดิต`
                      : "เลือกกลุ่มก่อน"}
                  </span>
                  {creditEstimate > 0 && (
                    <span className="text-[10px] text-amber-400 font-semibold">
                      ~{creditEstimate.toLocaleString()} SMS
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Template Preview */}
            <AnimatePresence>
              {formTemplate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]"
                >
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    ตัวอย่างข้อความ
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {templates.find((t) => t.id === formTemplate)?.body || ""}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 flex items-center gap-3">
              <motion.button
                onClick={handleCreate}
                disabled={!formName.trim() || !formGroup || !formTemplate}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                {formSchedule ? "ตั้งเวลาส่ง" : "บันทึกแบบร่าง"}
              </motion.button>
              <motion.button
                onClick={() => setShowForm(false)}
                className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ยกเลิก
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Detail Panel */}
      <AnimatePresence>
        {selectedCampaign && (
          <motion.div
            className="glass p-6 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-white">{selectedCampaign.name}</h3>
                <StatusBadge status={selectedCampaign.status} />
              </div>
              <motion.button
                onClick={() => setSelectedCampaign(null)}
                className="btn-glass px-3 py-1.5 text-xs rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ปิด
              </motion.button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="p-3 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  ผู้รับทั้งหมด
                </p>
                <p className="text-lg font-bold text-violet-400">
                  {selectedCampaign.totalRecipients.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  ส่งแล้ว
                </p>
                <p className="text-lg font-bold text-cyan-400">
                  {selectedCampaign.sentCount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  สำเร็จ
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  {selectedCampaign.deliveredCount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  ล้มเหลว
                </p>
                <p className="text-lg font-bold text-red-400">
                  {selectedCampaign.failedCount.toLocaleString()}
                </p>
              </div>
            </div>

            <ProgressBar sent={selectedCampaign.sentCount} total={selectedCampaign.totalRecipients} />

            <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  กลุ่มผู้รับ
                </p>
                <p className="text-[var(--text-secondary)]">{selectedCampaign.groupName}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  เทมเพลต
                </p>
                <p className="text-[var(--text-secondary)]">{selectedCampaign.templateName}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  ผู้ส่ง
                </p>
                <p className="text-[var(--text-secondary)] font-mono">{selectedCampaign.senderName}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  กำหนดส่ง
                </p>
                <p className="text-[var(--text-secondary)]">{formatDate(selectedCampaign.scheduledAt)}</p>
              </div>
            </div>

            {/* Status-based Actions */}
            {(selectedCampaign.status === "draft" || selectedCampaign.status === "scheduled") && (
              <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-3">
                <motion.button
                  onClick={() => handleAction(selectedCampaign.id, "start")}
                  className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  เริ่มส่ง
                </motion.button>
                <motion.button
                  onClick={() => handleAction(selectedCampaign.id, "cancel")}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors inline-flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  ยกเลิกแคมเปญ
                </motion.button>
              </div>
            )}
            {selectedCampaign.status === "running" && (
              <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
                <motion.button
                  onClick={() => handleAction(selectedCampaign.id, "cancel")}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors inline-flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  หยุดแคมเปญ
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === tab.key
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-white"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {campaigns.filter((c) => c.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Campaign List */}
      {filtered.length > 0 ? (
        <motion.div
          className="glass overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    แคมเปญ
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    สถานะ
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    กลุ่ม
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    เทมเพลต
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    กำหนดส่ง
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium w-40">
                    ความคืบหน้า
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    ผลลัพธ์
                  </th>
                  <th className="w-24 px-5 py-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium text-right">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <motion.tbody variants={stagger} initial="hidden" animate="show">
                {filtered.map((campaign) => (
                  <motion.tr
                    key={campaign.id}
                    variants={rowVariant}
                    className="table-row cursor-pointer"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowForm(false);
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-slate-200 font-medium text-sm">{campaign.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                        {campaign.senderName}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] text-xs">
                      {campaign.groupName}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] text-xs">
                      {campaign.templateName}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">
                      {formatDate(campaign.scheduledAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <ProgressBar sent={campaign.sentCount} total={campaign.totalRecipients} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-emerald-400">
                          {campaign.deliveredCount.toLocaleString()}
                        </span>
                        <span className="text-[var(--text-muted)]">/</span>
                        <span className="text-red-400">
                          {campaign.failedCount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div
                        className="flex items-center gap-1.5 justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(campaign.status === "draft" || campaign.status === "scheduled") && (
                          <motion.button
                            onClick={() => handleAction(campaign.id, "start")}
                            className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            เริ่ม
                          </motion.button>
                        )}
                        {(campaign.status === "draft" ||
                          campaign.status === "scheduled" ||
                          campaign.status === "running") && (
                          <motion.button
                            onClick={() => handleAction(campaign.id, "cancel")}
                            className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ยกเลิก
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[var(--border-subtle)]">
            {filtered.map((campaign) => (
              <motion.div
                key={campaign.id}
                variants={rowVariant}
                className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setShowForm(false);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-slate-200 font-medium text-sm">{campaign.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {campaign.groupName} &middot; {campaign.templateName}
                    </p>
                  </div>
                  <StatusBadge status={campaign.status} />
                </div>

                <ProgressBar sent={campaign.sentCount} total={campaign.totalRecipients} />

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-emerald-400">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {campaign.deliveredCount.toLocaleString()}
                    </span>
                    <span className="text-red-400">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-0.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      {campaign.failedCount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {formatDate(campaign.scheduledAt)}
                  </span>
                </div>

                {(campaign.status === "draft" ||
                  campaign.status === "scheduled" ||
                  campaign.status === "running") && (
                  <div
                    className="flex items-center gap-2 mt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(campaign.status === "draft" || campaign.status === "scheduled") && (
                      <motion.button
                        onClick={() => handleAction(campaign.id, "start")}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        whileTap={{ scale: 0.95 }}
                      >
                        เริ่มส่ง
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => handleAction(campaign.id, "cancel")}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/15"
                      whileTap={{ scale: 0.95 }}
                    >
                      ยกเลิก
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="glass p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">ไม่พบแคมเปญ</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {filterStatus === "all"
              ? "เริ่มต้นสร้างแคมเปญแรกของคุณ"
              : `ไม่มีแคมเปญในสถานะ "${STATUS_CONFIG[filterStatus as CampaignStatus]?.label}"`}
          </p>
          <motion.button
            onClick={() => {
              setShowForm(true);
              setFilterStatus("all");
            }}
            className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl inline-flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            สร้างแคมเปญ
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
