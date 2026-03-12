"use client";

import { useState } from "react";
import {
  Globe,
  Send,
  AlertTriangle,
  MoreHorizontal,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  Pencil,
  FlaskConical,
  PauseCircle,
  PlayCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  TableWrapper,
} from "@/components/blocks/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ─── Types ─── */

type WebhookStatus = "active" | "paused" | "error";

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  successRate: number;
  lastTriggered: string;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  timestamp: string;
  event: string;
  status: "success" | "failed";
  responseCode: number;
  requestBody: object;
  responseBody: string;
}

/* ─── Mock Data ─── */

const EVENT_GROUPS = [
  {
    group: "SMS",
    events: ["sms.sent", "sms.delivered", "sms.failed"],
  },
  {
    group: "Campaign",
    events: ["campaign.started", "campaign.completed"],
  },
  {
    group: "Contact",
    events: ["contact.created", "contact.opted_out"],
  },
  {
    group: "Billing",
    events: ["credits.low", "credits.depleted"],
  },
];

const MOCK_WEBHOOKS: WebhookRow[] = [
  {
    id: "wh_01",
    url: "https://api.example.com/webhooks/sms",
    events: ["sms.sent", "sms.delivered", "sms.failed"],
    status: "active",
    successRate: 99.2,
    lastTriggered: "2 นาทีที่แล้ว",
  },
  {
    id: "wh_02",
    url: "https://hooks.slack.com/services/T0XXXXX/B0YYYYY/zZZzzZzzZZZzzZZ",
    events: ["campaign.completed"],
    status: "active",
    successRate: 100,
    lastTriggered: "1 ชั่วโมงที่แล้ว",
  },
  {
    id: "wh_03",
    url: "https://crm.company.co.th/webhook/inbound",
    events: ["contact.opted_out", "contact.created"],
    status: "error",
    successRate: 78.5,
    lastTriggered: "15 นาทีที่แล้ว",
  },
  {
    id: "wh_04",
    url: "https://billing.internal/events/smsok",
    events: ["credits.low", "credits.depleted"],
    status: "paused",
    successRate: 95.0,
    lastTriggered: "3 วันที่แล้ว",
  },
];

const MOCK_DELIVERIES: DeliveryLog[] = [
  {
    id: "dl_001",
    webhookId: "wh_01",
    timestamp: "2026-03-11 14:32:07",
    event: "sms.delivered",
    status: "success",
    responseCode: 200,
    requestBody: { event: "sms.delivered", messageId: "msg_abc123", to: "0812345678", status: "delivered", timestamp: 1741675927 },
    responseBody: '{"ok":true}',
  },
  {
    id: "dl_002",
    webhookId: "wh_01",
    timestamp: "2026-03-11 14:31:52",
    event: "sms.sent",
    status: "success",
    responseCode: 200,
    requestBody: { event: "sms.sent", messageId: "msg_abc123", to: "0812345678", timestamp: 1741675912 },
    responseBody: '{"ok":true}',
  },
  {
    id: "dl_003",
    webhookId: "wh_01",
    timestamp: "2026-03-11 14:28:11",
    event: "sms.failed",
    status: "failed",
    responseCode: 503,
    requestBody: { event: "sms.failed", messageId: "msg_xyz789", to: "0899999999", reason: "invalid_number", timestamp: 1741675691 },
    responseBody: '{"error":"Service Unavailable"}',
  },
  {
    id: "dl_004",
    webhookId: "wh_01",
    timestamp: "2026-03-11 13:55:40",
    event: "sms.delivered",
    status: "success",
    responseCode: 200,
    requestBody: { event: "sms.delivered", messageId: "msg_def456", to: "0876543210", status: "delivered", timestamp: 1741673740 },
    responseBody: '{"ok":true}',
  },
  {
    id: "dl_005",
    webhookId: "wh_01",
    timestamp: "2026-03-11 12:10:22",
    event: "sms.sent",
    status: "success",
    responseCode: 201,
    requestBody: { event: "sms.sent", messageId: "msg_ghi321", to: "0855000111", timestamp: 1741666222 },
    responseBody: '{"received":true,"queued":1}',
  },
];

/* ─── Sub-components ─── */

function StatusDot({ status }: { status: WebhookStatus }) {
  const map: Record<WebhookStatus, string> = {
    active: "var(--success)",
    paused: "var(--warning)",
    error: "var(--error)",
  };
  const label: Record<WebhookStatus, string> = {
    active: "ใช้งาน",
    paused: "หยุดชั่วคราว",
    error: "ผิดพลาด",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: map[status] }}>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: map[status], boxShadow: `0 0 6px ${map[status]}80` }}
      />
      {label[status]}
    </span>
  );
}

function SuccessRateBadge({ rate }: { rate: number }) {
  const color = rate >= 95 ? "var(--success)" : rate >= 80 ? "var(--warning)" : "var(--error)";
  return (
    <span
      className="text-[12px] font-mono font-semibold tabular-nums"
      style={{ color }}
    >
      {rate.toFixed(1)}%
    </span>
  );
}

function EventBadge({ event }: { event: string }) {
  const colorMap: Record<string, string> = {
    sms: "rgba(var(--info-rgb),0.12)",
    campaign: "rgba(168,85,247,0.12)",
    contact: "rgba(var(--success-rgb),0.12)",
    credits: "rgba(var(--warning-rgb),0.12)",
  };
  const textMap: Record<string, string> = {
    sms: "var(--info)",
    campaign: "var(--accent-purple)",
    contact: "var(--success)",
    credits: "var(--warning)",
  };
  const prefix = event.split(".")[0];
  return (
    <span
      className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-md mr-1 mb-0.5"
      style={{ background: colorMap[prefix] ?? "rgba(255,255,255,0.05)", color: textMap[prefix] ?? "var(--text-secondary)" }}
    >
      {event}
    </span>
  );
}

function DeliveryStatusBadge({ status, code }: { status: "success" | "failed"; code: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: status === "success" ? "rgba(var(--success-rgb),0.1)" : "rgba(var(--error-rgb),0.1)",
        color: status === "success" ? "var(--success)" : "var(--error)",
      }}
    >
      {status === "success" ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {code}
    </span>
  );
}

/* ─── Delivery Log Section ─── */

function DeliveryLogSection({ webhookId }: { webhookId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const logs = MOCK_DELIVERIES.filter((d) => d.webhookId === webhookId);

  return (
    <div className="mt-2 space-y-1.5">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-mono text-[var(--text-muted)] w-[140px] flex-shrink-0 text-left">
              {log.timestamp}
            </span>
            <EventBadge event={log.event} />
            <div className="ml-auto flex items-center gap-2">
              <DeliveryStatusBadge status={log.status} code={log.responseCode} />
              {expandedId === log.id ? (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
            </div>
          </button>

          {expandedId === log.id && (
            <div className="border-t border-[var(--border-default)] px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Request Body
                </p>
                <pre className="text-[11px] font-mono text-[var(--text-secondary)] bg-black/30 rounded-lg p-3 overflow-x-auto leading-relaxed">
                  {JSON.stringify(log.requestBody, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Response Body
                </p>
                <pre className="text-[11px] font-mono text-[var(--text-secondary)] bg-black/30 rounded-lg p-3 overflow-x-auto leading-relaxed">
                  {log.responseBody}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Webhook Row Expansion ─── */

function WebhookTableRow({
  hook,
  onEdit,
  onDelete,
}: {
  hook: WebhookRow;
  onEdit: (hook: WebhookRow) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasLogs = MOCK_DELIVERIES.some((d) => d.webhookId === hook.id);

  return (
    <>
      <tr
        className="border-b border-[var(--table-border)] hover:bg-white/[0.02] transition-colors"
      >
        {/* URL */}
        <td className="px-5 py-3.5 max-w-[220px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
              title="ดู Delivery Logs"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
            </button>
            <span
              className="text-[12px] font-mono text-[var(--text-secondary)] truncate block"
              title={hook.url}
              style={{ maxWidth: "180px" }}
            >
              {hook.url}
            </span>
          </div>
        </td>

        {/* Events */}
        <td className="px-4 py-3.5">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(var(--accent-rgb),0.08)",
              color: "var(--accent)",
              border: "1px solid rgba(var(--accent-rgb),0.15)",
            }}
          >
            {hook.events.length} events
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5">
          <StatusDot status={hook.status} />
        </td>

        {/* Success Rate */}
        <td className="px-4 py-3.5">
          <SuccessRateBadge rate={hook.successRate} />
        </td>

        {/* Last Triggered */}
        <td className="px-4 py-3.5">
          <span className="text-[13px] text-[var(--text-muted)]">{hook.lastTriggered}</span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setExpanded(true)}
                className="cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 mr-2" />
                ดูรายละเอียด
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(hook)}
                className="cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 mr-2" />
                แก้ไข
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <FlaskConical className="w-3.5 h-3.5 mr-2" />
                ทดสอบ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {hook.status === "paused" ? (
                <DropdownMenuItem className="cursor-pointer">
                  <PlayCircle className="w-3.5 h-3.5 mr-2 text-[var(--success)]" />
                  <span className="text-[var(--success)]">เปิดใช้งาน</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="cursor-pointer">
                  <PauseCircle className="w-3.5 h-3.5 mr-2 text-[var(--warning)]" />
                  <span className="text-[var(--warning)]">หยุดชั่วคราว</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(hook.id)}
                className="cursor-pointer text-[var(--error)] focus:text-[var(--error)]"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                ลบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Expanded: events detail + delivery log */}
      {expanded && (
        <tr className="border-b border-[var(--table-border)]">
          <td colSpan={6} className="px-5 py-4 bg-black/10">
            {/* Events list */}
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Events ที่สมัครรับ
            </p>
            <div className="flex flex-wrap gap-1 mb-4">
              {hook.events.map((ev) => (
                <EventBadge key={ev} event={ev} />
              ))}
            </div>

            {/* Delivery logs */}
            {hasLogs && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Delivery Log (ล่าสุด)
                  </p>
                  <RefreshCw className="w-3 h-3 text-[var(--text-muted)]" />
                </div>
                <DeliveryLogSection webhookId={hook.id} />
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Add/Edit Dialog ─── */

function WebhookDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: WebhookRow;
}) {
  const isEdit = !!initial;
  const [url, setUrl] = useState(initial?.url ?? "");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(
    new Set(initial?.events ?? [])
  );
  const [copied, setCopied] = useState(false);

  const mockSecret = "whsec_a4f8c2d1e9b3047f56a2c8d1e0f7b3a9";

  function toggleEvent(event: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
  }

  function toggleGroup(events: string[]) {
    const allSelected = events.every((e) => selectedEvents.has(e));
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const e of events) next.delete(e);
      } else {
        for (const e of events) next.add(e);
      }
      return next;
    });
  }

  function copySecret() {
    navigator.clipboard.writeText(mockSecret).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? "แก้ไข Webhook" : "เพิ่ม Webhook"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* URL */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Endpoint URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-domain.com/webhook"
              className="font-mono text-sm"
            />
          </div>

          {/* Signing Secret */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Signing Secret
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-[var(--border-default)] rounded-lg px-3 py-2 font-mono text-[12px] text-[var(--text-muted)] overflow-hidden text-ellipsis whitespace-nowrap">
                {mockSecret}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copySecret}
                className="flex-shrink-0 w-9 h-9 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              ใช้ secret นี้เพื่อยืนยัน signature ของ webhook payload
            </p>
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Events
            </label>
            <div className="space-y-3">
              {EVENT_GROUPS.map(({ group, events }) => {
                const allSelected = events.every((e) => selectedEvents.has(e));
                const someSelected = events.some((e) => selectedEvents.has(e));
                return (
                  <div
                    key={group}
                    className="bg-black/20 border border-[var(--border-default)] rounded-xl p-3"
                  >
                    {/* Group header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
                        {group}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(events)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        style={{
                          background: allSelected
                            ? "rgba(var(--accent-rgb),0.12)"
                            : someSelected
                              ? "rgba(var(--accent-rgb),0.06)"
                              : "rgba(255,255,255,0.04)",
                          color: allSelected || someSelected ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                      </button>
                    </div>

                    {/* Event checkboxes */}
                    <div className="flex flex-wrap gap-1.5">
                      {events.map((ev) => {
                        const checked = selectedEvents.has(ev);
                        return (
                          <button
                            key={ev}
                            type="button"
                            onClick={() => toggleEvent(ev)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer"
                            style={{
                              background: checked
                                ? "rgba(var(--accent-rgb),0.1)"
                                : "rgba(255,255,255,0.03)",
                              borderColor: checked
                                ? "rgba(var(--accent-rgb),0.3)"
                                : "rgba(255,255,255,0.08)",
                              color: checked ? "var(--accent)" : "var(--text-muted)",
                            }}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border"
                              style={{
                                background: checked
                                  ? "var(--accent)"
                                  : "transparent",
                                borderColor: checked
                                  ? "var(--accent)"
                                  : "rgba(255,255,255,0.2)",
                              }}
                            >
                              {checked && (
                                <Check
                                  className="w-2.5 h-2.5"
                                  style={{ color: "var(--text-on-accent)" }}
                                />
                              )}
                            </span>
                            {ev}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="cursor-pointer"
              style={{
                background: "var(--accent)",
                color: "var(--text-on-accent)",
              }}
            >
              บันทึก
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */

export default function WebhooksPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editHook, setEditHook] = useState<WebhookRow | undefined>(undefined);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>(MOCK_WEBHOOKS);

  const activeCount = webhooks.filter((w) => w.status === "active").length;
  const failedCount = 12; // mock 24h

  function handleEdit(hook: WebhookRow) {
    setEditHook(hook);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditHook(undefined);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <PageLayout>
      <PageHeader
        title="Webhooks"
        description="จัดการ webhook endpoints"
        actions={
          <Button
            type="button"
            onClick={handleAdd}
            className="gap-1.5 cursor-pointer"
            style={{
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
          >
            <Plus className="w-4 h-4" />
            เพิ่ม Webhook
          </Button>
        }
      />

      {/* Stats */}
      <StatsRow columns={3}>
        <StatCard
          icon={<Globe className="w-4 h-4" style={{ color: "var(--success)" }} />}
          iconColor="16,185,129"
          value={activeCount}
          label="Active Webhooks"
        />
        <StatCard
          icon={<Send className="w-4 h-4" style={{ color: "var(--info)" }} />}
          iconColor="59,130,246"
          value="1,247"
          label="Total Deliveries (24h)"
        />
        <StatCard
          icon={
            <AlertTriangle
              className="w-4 h-4"
              style={{ color: failedCount > 0 ? "var(--error)" : "var(--success)" }}
            />
          }
          iconColor={failedCount > 0 ? "239,68,68" : "16,185,129"}
          value={failedCount}
          label="Failed (24h)"
        />
      </StatsRow>

      {/* Table */}
      <TableWrapper>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-[var(--table-header)]">
                {["URL", "Events", "Status", "Success Rate", "Last Triggered", ""].map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider first:px-5"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhooks.map((hook) => (
                <WebhookTableRow
                  key={hook.id}
                  hook={hook}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </TableWrapper>

      {/* Add/Edit Dialog */}
      <WebhookDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editHook}
      />
    </PageLayout>
  );
}
