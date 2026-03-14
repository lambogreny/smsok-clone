"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle,
  FileText,
  Loader,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Copy,
  Pause,
  Trash2,
  Eye,
  Search,
  Plus,
  X,
} from "lucide-react";
import { z } from "zod";
import { createCampaign, executeCampaign, getCampaignProgress } from "@/lib/actions/campaigns";
import { fieldCls } from "@/lib/form-utils";
import CustomSelect from "@/components/ui/CustomSelect";
import SenderDropdown from "@/components/ui/SenderDropdown";
import { safeErrorMessage } from "@/lib/error-messages";
import { useToast } from "@/app/components/ui/Toast";
import SendingHoursWarning from "@/components/blocks/SendingHoursWarning";
import EmptyStateShared from "@/components/EmptyState";
import { formatThaiDateShort } from "@/lib/format-thai-date";
import CampaignWizard from "@/components/campaigns/CampaignWizard";

// ─── Campaign form validation schema ────────────────────────────────────────
const campaignFormSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อแคมเปญ").max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  contactGroupId: z.string().min(1, "กรุณาเลือกกลุ่มผู้รับ"),
  templateId: z.string().min(1, "กรุณาเลือกเทมเพลต"),
  senderName: z.string().min(1, "กรุณาระบุชื่อผู้ส่ง"),
  scheduledAt: z
    .string()
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      "วันเวลาที่ตั้งไว้ต้องเป็นอนาคต",
    ),
});

// PageLayout
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────
import type { CampaignPageCampaign } from "@/lib/campaigns/page-data";

type CampaignStatus = CampaignPageCampaign["status"];
type Campaign = CampaignPageCampaign;

type ContactGroup = { id: string; name: string; count: number };
type Template = { id: string; name: string; body: string };

// ─── Status Config (V2 colors) ─────────────────────────────────────────
const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; bg: string; dot?: boolean; pulse?: boolean }
> = {
  draft:     { label: "ฉบับร่าง",   color: "var(--text-muted)", bg: "rgba(148,159,168,0.08)" },
  scheduled: { label: "ตั้งเวลา",   color: "var(--info)", bg: "rgba(var(--info-rgb),0.08)" },
  sending:   { label: "กำลังส่ง",   color: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)", dot: true, pulse: true },
  running:   { label: "กำลังส่ง",   color: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)", dot: true, pulse: true },
  completed: { label: "สำเร็จ",    color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  failed:    { label: "ล้มเหลว",   color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  cancelled: { label: "ยกเลิก",    color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  paused:    { label: "หยุดชั่วคราว", color: "var(--warning)", bg: "rgba(var(--warning-rgb,245,158,11),0.08)" },
};

// ─── Filter pill config ─────────────────────────────────────────────────
const FILTER_PILLS: { key: CampaignStatus | "all"; label: string; color: string; rgb: string }[] = [
  { key: "all",       label: "ทั้งหมด",   color: "var(--text-muted)", rgb: "var(--text-muted-rgb)" },
  { key: "sending",   label: "กำลังส่ง",  color: "var(--accent)", rgb: "var(--accent-rgb)" },
  { key: "completed", label: "สำเร็จ",   color: "var(--success)", rgb: "var(--success-rgb)" },
  { key: "draft",     label: "ฉบับร่าง",  color: "var(--text-muted)", rgb: "var(--text-muted-rgb)" },
  { key: "scheduled", label: "ตั้งเวลา",  color: "var(--info)", rgb: "var(--info-rgb)" },
  { key: "failed",    label: "ล้มเหลว",  color: "var(--error)", rgb: "var(--error-rgb)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-medium"
      style={{
        padding: "3px 10px",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? "animate-pulse" : ""}`}
          style={{ background: cfg.color }}
        />
      )}
      {cfg.label}
    </span>
  );
}

function NansenProgressBar({
  sent,
  total,
  status,
}: {
  sent: number;
  total: number;
  status: CampaignStatus;
}) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  const barColor =
    status === "failed" || status === "cancelled"
      ? "var(--error)"
      : "var(--accent)";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-[3px] bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-[3px] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs tabular-nums text-[var(--text-secondary)] w-9 text-right">{pct}%</span>
    </div>
  );
}

// ─── Per-page constant ───────────────────────────────────────────────────
const PER_PAGE = 20;

// ─── Main Component ──────────────────────────────────────────────────────
export default function CampaignsClient({
  userId,
  initialCampaigns,
  groups,
  templates,
  senderNames = ["EasySlip"],
  loadError = false,
}: {
  userId: string;
  initialCampaigns: Campaign[];
  groups: ContactGroup[];
  templates: Template[];
  senderNames?: string[];
  loadError?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Form state
  const [formName, setFormName] = useState("");
  const [formGroup, setFormGroup] = useState("");
  const [formTemplate, setFormTemplate] = useState("");
  const [formSender, setFormSender] = useState("EasySlip");
  const [formSchedule, setFormSchedule] = useState("");

  // Detail view
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Track poll intervals for cleanup on unmount
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    return () => {
      for (const interval of pollIntervalsRef.current.values()) {
        clearInterval(interval);
      }
      pollIntervalsRef.current.clear();
    };
  }, []);

  // ─── Derived data ─────────────────────────────────────────────────
  const filtered = campaigns
    .filter((c) => filterStatus === "all" || c.status === filterStatus)
    .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCampaigns = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Stats
  const totalCount = campaigns.length;
  const completedCount = campaigns.filter((c) => c.status === "completed").length;
  const activeCount = campaigns.filter((c) => c.status === "sending" || c.status === "running" || c.status === "paused").length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;
  const activeRemaining = campaigns
    .filter((c) => c.status === "sending" || c.status === "running" || c.status === "paused")
    .reduce((sum, c) => sum + (c.totalRecipients - c.sentCount), 0);
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const selectedGroup = groups.find((g) => g.id === formGroup);
  const creditEstimate = selectedGroup ? selectedGroup.count : 0;

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleCreate = () => {
    setFeedback(null);

    // Zod validation
    const parsed = campaignFormSchema.safeParse({
      name: formName.trim(),
      contactGroupId: formGroup,
      templateId: formTemplate,
      senderName: formSender.trim() || "EasySlip",
      scheduledAt: formSchedule || undefined,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      setFeedback({ type: "error", text: firstError.message });
      return;
    }

    startTransition(async () => {
      try {
        await createCampaign({
          name: parsed.data.name,
          contactGroupId: parsed.data.contactGroupId,
          templateId: parsed.data.templateId,
          senderName: parsed.data.senderName,
          scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt).toISOString() : undefined,
        });
        setFeedback({ type: "success", text: "สร้างแคมเปญสำเร็จ!" });
        toast("success", "สร้างแคมเปญสำเร็จ");
        setFormName("");
        setFormGroup("");
        setFormTemplate("");
        setFormSender("EasySlip");
        setFormSchedule("");
        setShowForm(false);
        router.refresh();
      } catch (e) {
        setFeedback({ type: "error", text: safeErrorMessage(e) });
        toast("error", safeErrorMessage(e));
      }
    });
  };

  const handleSend = (campaignId: string) => {
    setFeedback(null);
    setSendingIds((prev) => new Set(prev).add(campaignId));

    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: "sending" as CampaignStatus } : c))
    );

    startTransition(async () => {
      try {
        await executeCampaign(campaignId);

        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: "running" as CampaignStatus } : c))
        );

        const existingInterval = pollIntervalsRef.current.get(campaignId);
        if (existingInterval) clearInterval(existingInterval);

        const pollInterval = setInterval(async () => {
          try {
            const progress = await getCampaignProgress(campaignId);
            setCampaigns((prev) =>
              prev.map((c) =>
                c.id === campaignId
                  ? {
                      ...c,
                      status: progress.status as CampaignStatus,
                      sentCount: progress.sentCount,
                      deliveredCount: progress.deliveredCount,
                      failedCount: progress.failedCount,
                      creditUsed: progress.creditUsed,
                    }
                  : c
              )
            );

            setSelectedCampaign((prev) =>
              prev?.id === campaignId
                ? {
                    ...prev,
                    status: progress.status as CampaignStatus,
                    sentCount: progress.sentCount,
                    deliveredCount: progress.deliveredCount,
                    failedCount: progress.failedCount,
                    creditUsed: progress.creditUsed,
                  }
                : prev
            );

            if (progress.status === "completed" || progress.status === "failed" || progress.status === "cancelled") {
              clearInterval(pollInterval);
              pollIntervalsRef.current.delete(campaignId);
              setSendingIds((prev) => {
                const next = new Set(prev);
                next.delete(campaignId);
                return next;
              });
              setFeedback({
                type: progress.status === "completed" ? "success" : "error",
                text:
                  progress.status === "completed"
                    ? `ส่งสำเร็จ ${progress.sentCount} ข้อความ (ล้มเหลว ${progress.failedCount})`
                    : `แคมเปญ${progress.status === "failed" ? "ล้มเหลว" : "ถูกยกเลิก"}`,
              });
              if (progress.status === "completed") {
                toast("success", `ส่งแคมเปญสำเร็จ ${progress.sentCount} ข้อความ`);
              } else {
                toast("error", `แคมเปญ${progress.status === "failed" ? "ล้มเหลว" : "ถูกยกเลิก"}`);
              }
            }
          } catch {
            clearInterval(pollInterval);
            pollIntervalsRef.current.delete(campaignId);
          }
        }, 2000);

        pollIntervalsRef.current.set(campaignId, pollInterval);
      } catch (e) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: "draft" as CampaignStatus } : c))
        );
        setSendingIds((prev) => {
          const next = new Set(prev);
          next.delete(campaignId);
          return next;
        });
        setFeedback({ type: "error", text: safeErrorMessage(e) });
        toast("error", safeErrorMessage(e));
      }
    });
  };

  const handleCancel = (_id: string) => {
    setFeedback({ type: "error", text: "ฟีเจอร์ยกเลิกแคมเปญกำลังพัฒนา" });
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <PageLayout>
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
            feedback.type === "success"
              ? "bg-[rgba(16,185,129,0.08)] text-[var(--success)] border border-[rgba(16,185,129,0.2)]"
              : "bg-[rgba(239,68,68,0.08)] text-[var(--error)] border border-[rgba(239,68,68,0.2)]"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Load error banner */}
      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-[rgba(239,68,68,0.08)] text-[var(--error)] border border-[rgba(239,68,68,0.2)] flex items-center justify-between">
          <span>ไม่สามารถโหลดข้อมูลแคมเปญได้ กรุณาลองใหม่</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            ลองใหม่
          </Button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="แคมเปญ"
        count={totalCount}
        description="สร้างและจัดการแคมเปญส่ง SMS จำนวนมาก"
        actions={
          <Button
            onClick={() => {
              setShowWizard(true);
              setSelectedCampaign(null);
            }}
            className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            สร้างแคมเปญ
          </Button>
        }
      />

      {/* Stats Row — 4 cards per spec 4.1 */}
      <StatsRow columns={4}>
        <StatCard
          icon={<BarChart3 className="w-[18px] h-[18px] text-[var(--accent)]" />}
          iconColor="var(--accent-rgb)"
          value={totalCount}
          label="แคมเปญทั้งหมด"
        />
        <StatCard
          icon={<CheckCircle className="w-[18px] h-[18px] text-emerald-500" />}
          iconColor="16,185,129"
          value={completedCount}
          label="สำเร็จ"
          subtitle={`${completionRate}% completion rate`}
        />
        <StatCard
          icon={<Loader className="w-[18px] h-[18px] animate-spin text-amber-500" />}
          iconColor="245,158,11"
          value={activeCount}
          label="กำลังส่ง"
          subtitle={activeRemaining > 0 ? `${activeRemaining.toLocaleString()} SMS remaining` : undefined}
        />
        <StatCard
          icon={<FileText className="w-[18px] h-[18px] text-[var(--text-muted)]" />}
          iconColor="148,159,168"
          value={draftCount}
          label="ฉบับร่าง"
        />
      </StatsRow>

      {/* Status filter pills — spec 4.2 */}
      <FilterBar>
        {FILTER_PILLS.map((pill) => {
          const isActive = filterStatus === pill.key;
          const count = pill.key === "all" ? null : campaigns.filter((c) => c.status === pill.key).length;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => { setFilterStatus(pill.key); setPage(1); }}
              className="rounded-full text-[13px] font-medium border transition-colors cursor-pointer"
              style={{
                padding: "6px 14px",
                background: isActive ? `rgba(${pill.rgb},0.08)` : "transparent",
                borderColor: isActive ? `rgba(${pill.rgb},0.3)` : "var(--border-default)",
                color: isActive ? pill.color : "var(--text-muted)",
              }}
            >
              {pill.key === "sending" && isActive && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
                  style={{ background: pill.color }}
                />
              )}
              {pill.label}
              {count !== null && count > 0 && (
                <span className="ml-1.5 opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </FilterBar>

      {/* Search — spec 4.3 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          placeholder="ค้นหาชื่อแคมเปญ..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-10 bg-[var(--bg-surface)] border-[var(--table-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-10"
        />
      </div>

      {/* Create Campaign Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-[var(--accent)]" />
              </div>
              สร้างแคมเปญใหม่
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">ชื่อแคมเปญ *</label>
                <input
                  type="text"
                  className={fieldCls(undefined, formName)}
                  placeholder="เช่น โปรโมชั่นเดือนมีนาคม"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">ชื่อผู้ส่ง</label>
                <SenderDropdown value={formSender} onChange={setFormSender} senderNames={senderNames} />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">กลุ่มผู้รับ *</label>
                <CustomSelect
                  value={formGroup}
                  onChange={setFormGroup}
                  placeholder="-- เลือกกลุ่ม --"
                  options={groups.map((g) => ({
                    value: g.id,
                    label: `${g.name} (${g.count.toLocaleString()} รายชื่อ)`,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">เทมเพลต *</label>
                <CustomSelect
                  value={formTemplate}
                  onChange={setFormTemplate}
                  placeholder="-- เลือกเทมเพลต --"
                  options={templates.map((t) => ({ value: t.id, label: t.name }))}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">ตั้งเวลาส่ง</label>
                <Input
                  type="datetime-local"
                  className="w-full"
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">เว้นว่างเพื่อบันทึกเป็นแบบร่าง</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">ประมาณการ SMS</label>
                <div className="bg-[var(--bg-surface)] border border-[var(--table-border)] rounded-lg px-3 py-2 w-full flex items-center justify-between pointer-events-none">
                  <span className="text-[var(--text-secondary)]">
                    {creditEstimate > 0 ? `${creditEstimate.toLocaleString()} SMS` : "เลือกกลุ่มก่อน"}
                  </span>
                  {creditEstimate > 0 && (
                    <span className="text-[10px] text-amber-400 font-semibold">~{creditEstimate.toLocaleString()} SMS</span>
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
                  className="mt-4 p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--table-border)]"
                >
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">ตัวอย่างข้อความ</p>
                  <p className="text-sm text-[var(--text-secondary)]">{templates.find((t) => t.id === formTemplate)?.body || ""}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <SendingHoursWarning scheduledAt={formSchedule || null} className="mt-4" />

            <div className="mt-5 flex items-center gap-3">
              <Button
                onClick={handleCreate}
                disabled={isPending}
                className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
              >
                <Megaphone className="w-4 h-4 mr-1.5" />
                {formSchedule ? "ตั้งเวลาส่ง" : "บันทึกแบบร่าง"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-[var(--table-border)] text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
              >
                ยกเลิก
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Detail Panel */}
      <AnimatePresence>
        {selectedCampaign && (
          <motion.div
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{selectedCampaign.name}</h3>
                <StatusBadge status={selectedCampaign.status} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCampaign(null)}
                className="border-[var(--table-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ปิด
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: "ผู้รับทั้งหมด", value: selectedCampaign.totalRecipients, color: "var(--text-primary)" },
                { label: "ส่งแล้ว", value: selectedCampaign.sentCount, color: "var(--accent-secondary)" },
                { label: "สำเร็จ", value: selectedCampaign.deliveredCount, color: "var(--accent)" },
                { label: "ล้มเหลว", value: selectedCampaign.failedCount, color: "var(--error)" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-[var(--table-alt-row)] border border-[var(--table-border)]">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>
                    {s.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Full-width progress bar for detail */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[var(--text-muted)]">
                  {selectedCampaign.sentCount.toLocaleString()} / {selectedCampaign.totalRecipients.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-[var(--accent)]">
                  {selectedCampaign.totalRecipients > 0
                    ? Math.round((selectedCampaign.sentCount / selectedCampaign.totalRecipients) * 100)
                    : 0}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
                  style={{
                    width: `${selectedCampaign.totalRecipients > 0 ? Math.round((selectedCampaign.sentCount / selectedCampaign.totalRecipients) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--table-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                { label: "กลุ่มผู้รับ", value: selectedCampaign.groupName },
                { label: "เทมเพลต", value: selectedCampaign.templateName },
                { label: "ผู้ส่ง", value: selectedCampaign.senderName, mono: true },
                { label: "กำหนดส่ง", value: selectedCampaign.scheduledAt ? formatThaiDateShort(selectedCampaign.scheduledAt) : formatThaiDateShort(selectedCampaign.createdAt) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{item.label}</p>
                  <p className={`text-[var(--text-secondary)] ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Status-based Actions */}
            {(selectedCampaign.status === "draft" || selectedCampaign.status === "scheduled") && (
              <div className="mt-5 pt-4 border-t border-[var(--table-border)] flex items-center gap-3">
                <Button
                  onClick={() => handleSend(selectedCampaign.id)}
                  disabled={sendingIds.has(selectedCampaign.id)}
                  className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
                >
                  {sendingIds.has(selectedCampaign.id) ? (
                    <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                  {sendingIds.has(selectedCampaign.id) ? "กำลังส่ง..." : "ส่งทันที"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCancel(selectedCampaign.id)}
                  className="border-[rgba(239,68,68,0.2)] text-[var(--error)] hover:bg-[rgba(239,68,68,0.08)] cursor-pointer"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  ยกเลิกแคมเปญ
                </Button>
              </div>
            )}
            {(selectedCampaign.status === "sending" || selectedCampaign.status === "running") && (
              <div className="mt-5 pt-4 border-t border-[var(--table-border)]">
                <Button
                  variant="outline"
                  onClick={() => handleCancel(selectedCampaign.id)}
                  className="border-[rgba(239,68,68,0.2)] text-[var(--error)] hover:bg-[rgba(239,68,68,0.08)] cursor-pointer"
                >
                  <Pause className="w-4 h-4 mr-1.5" />
                  หยุดแคมเปญ
                </Button>
              </div>
            )}
            {selectedCampaign.status === "paused" && (
              <div className="mt-5 pt-4 border-t border-[var(--table-border)] flex items-center gap-3">
                <Button
                  onClick={() => handleSend(selectedCampaign.id)}
                  disabled={sendingIds.has(selectedCampaign.id)}
                  className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  ส่งต่อ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCancel(selectedCampaign.id)}
                  className="border-[rgba(239,68,68,0.2)] text-[var(--error)] hover:bg-[rgba(239,68,68,0.08)] cursor-pointer"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  ยกเลิกแคมเปญ
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Table — Nansen style per spec 4.4 */}
      {filtered.length > 0 ? (
        <TableWrapper>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header)] border-b border-[var(--table-border)]">
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">ชื่อแคมเปญ</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">สถานะ</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 hidden lg:table-cell">ความคืบหน้า</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 hidden lg:table-cell">ผู้ส่ง</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 hidden lg:table-cell">วันที่</th>
                  <th className="text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 w-20">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.map((campaign, idx) => (
                  <tr
                    key={campaign.id}
                    className={`border-b border-[var(--table-border)] hover:bg-[var(--bg-elevated)] transition-colors duration-150 cursor-pointer ${
                      idx % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                    }`}
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowForm(false);
                    }}
                  >
                    {/* Campaign name cell */}
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{campaign.name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {campaign.totalRecipients.toLocaleString()} SMS · ฿{campaign.creditReserved.toLocaleString()}
                      </p>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <StatusBadge status={campaign.status} />
                    </td>
                    {/* Progress */}
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <NansenProgressBar
                        sent={campaign.sentCount}
                        total={campaign.totalRecipients}
                        status={campaign.status}
                      />
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                        {campaign.sentCount.toLocaleString()}/{campaign.totalRecipients.toLocaleString()}
                      </p>
                    </td>
                    {/* Sender */}
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className="text-sm text-[var(--text-secondary)] font-mono">{campaign.senderName}</span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className="text-sm text-[var(--text-muted)]">{formatThaiDateShort(campaign.createdAt)}</span>
                    </td>
                    {/* Actions dropdown */}
                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[var(--table-header)] border-[var(--table-border)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                        >
                          <DropdownMenuItem
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:text-[var(--text-primary)] focus:bg-[rgba(255,255,255,0.04)] cursor-pointer"
                            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            ดูรายละเอียด
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:text-[var(--text-primary)] focus:bg-[rgba(255,255,255,0.04)] cursor-pointer">
                            <Pencil className="w-4 h-4 mr-2" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:text-[var(--text-primary)] focus:bg-[rgba(255,255,255,0.04)] cursor-pointer">
                            <Copy className="w-4 h-4 mr-2" />
                            ทำซ้ำ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[var(--table-border)]" />
                          {(campaign.status === "sending" || campaign.status === "running") && (
                            <DropdownMenuItem
                              className="text-[var(--warning)] hover:text-[var(--warning)] focus:text-[var(--warning)] focus:bg-[rgba(245,158,11,0.08)] cursor-pointer"
                              onClick={() => handleCancel(campaign.id)}
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              หยุดชั่วคราว
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "paused" && (
                            <DropdownMenuItem
                              className="text-[var(--accent)] hover:text-[var(--accent)] focus:text-[var(--accent)] focus:bg-[rgba(var(--accent-rgb),0.08)] cursor-pointer"
                              onClick={() => handleSend(campaign.id)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              ส่งต่อ
                            </DropdownMenuItem>
                          )}
                          {(campaign.status === "draft" || campaign.status === "scheduled") && (
                            <DropdownMenuItem
                              className="text-[var(--success)] hover:text-[var(--success)] focus:text-[var(--success)] focus:bg-[rgba(16,185,129,0.08)] cursor-pointer"
                              onClick={() => handleSend(campaign.id)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              ส่งทันที
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-[var(--error)] hover:text-[var(--error)] focus:text-[var(--error)] focus:bg-[rgba(239,68,68,0.08)] cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[var(--table-border)]">
            {paginatedCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setShowForm(false);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{campaign.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {campaign.groupName} · {campaign.totalRecipients.toLocaleString()} SMS
                    </p>
                  </div>
                  <StatusBadge status={campaign.status} />
                </div>
                <NansenProgressBar sent={campaign.sentCount} total={campaign.totalRecipients} status={campaign.status} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[var(--text-muted)] tabular-nums">
                    {campaign.sentCount.toLocaleString()}/{campaign.totalRecipients.toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{formatThaiDateShort(campaign.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationBar
              from={(currentPage - 1) * PER_PAGE + 1}
              to={Math.min(currentPage * PER_PAGE, filtered.length)}
              total={filtered.length}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </TableWrapper>
      ) : (
        filterStatus === "all" && !searchQuery ? (
          <EmptyStateShared
            icon={Megaphone}
            iconColor="var(--accent-purple)"
            iconBg="rgba(var(--accent-purple-rgb),0.06)"
            iconBorder="rgba(var(--accent-purple-rgb),0.1)"
            title="ยังไม่มี Campaign"
            description="สร้าง campaign เพื่อส่ง SMS ถึงผู้ติดต่อหลายคนพร้อมกัน"
            ctaLabel="+ สร้าง Campaign"
            ctaAction={() => setShowForm(true)}
          />
        ) : (
          <TableWrapper>
            <EmptyState
              icon={<Megaphone className="w-12 h-12" />}
              title="ไม่พบแคมเปญที่ตรงกับตัวกรอง"
              subtitle="ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น"
              action={
                <Button
                  variant="outline"
                  onClick={() => { setFilterStatus("all"); setSearchQuery(""); }}
                  className="border-[var(--table-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  ล้างตัวกรอง
                </Button>
              }
            />
          </TableWrapper>
        )
      )}
      {/* Campaign Wizard Modal */}
      {showWizard && (
        <CampaignWizard
          groups={groups}
          templates={templates}
          senderNames={senderNames}
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            setShowWizard(false);
            router.refresh();
          }}
        />
      )}
    </PageLayout>
  );
}
