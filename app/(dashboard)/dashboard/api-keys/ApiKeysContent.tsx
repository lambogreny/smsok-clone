"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  PowerOff,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Edit2,
  Activity,
  Zap,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { TrialNotice } from "@/components/blocks/TrialBanner";
import { createApiKey, toggleApiKey, deleteApiKey, updateApiKeyName } from "@/lib/actions/api-keys";
import { safeErrorMessage } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format-thai-date";
import PageLayout, { PageHeader, StatsRow, StatCard, TableWrapper } from "@/components/blocks/PageLayout";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: number;
  ipWhitelist: string[];
  isActive: boolean;
  lastUsed: string | null;
  revokedAt: string | null;
  createdAt: string;
};

const PERMISSIONS = [
  { id: "sms:send", label: "ส่ง SMS", description: "POST /api/v1/sms/send" },
  { id: "sms:read", label: "ดูประวัติ SMS", description: "GET /api/v1/sms" },
  { id: "contacts:read", label: "อ่านรายชื่อ", description: "GET /api/v1/contacts" },
  { id: "contacts:write", label: "จัดการรายชื่อ", description: "POST/PUT/DELETE contacts" },
  { id: "campaigns:read", label: "ดูแคมเปญ", description: "GET /api/v1/campaigns" },
  { id: "campaigns:write", label: "จัดการแคมเปญ", description: "POST/PUT/DELETE campaigns" },
  { id: "templates:read", label: "ดู template", description: "GET /api/v1/templates" },
  { id: "templates:write", label: "จัดการ template", description: "POST/PUT/DELETE templates" },
  { id: "groups:read", label: "ดูกลุ่ม", description: "GET /api/v1/groups" },
  { id: "groups:write", label: "จัดการกลุ่ม", description: "POST/PUT/DELETE groups" },
  { id: "webhooks:read", label: "ดู webhooks", description: "GET /api/v1/webhooks" },
  { id: "webhooks:write", label: "จัดการ webhooks", description: "POST/PUT/DELETE webhooks" },
  { id: "billing:read", label: "ดูข้อมูลบิล", description: "GET /api/v1/billing" },
];

const PERM_LABEL: Record<string, string> = Object.fromEntries(
  PERMISSIONS.map((p) => [p.id, p.label])
);

function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

function parseIpWhitelist(input: string): string[] {
  return [...new Set(input.split(",").map((entry) => entry.trim()).filter(Boolean))];
}


export default function ApiKeysContent({
  apiKeys: initialKeys,
  isTrial = false,
}: {
  apiKeys: ApiKey[];
  isTrial?: boolean;
}) {
  const [apiKeys, setApiKeys] = useState(initialKeys);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([
    "sms:send",
    "contacts:read",
  ]);
  const [rateLimit, setRateLimit] = useState("60");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [creating, setCreating] = useState(false);

  // Secret display
  const [newSecret, setNewSecret] = useState<{ key: string; id: string } | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [secretConfirmed, setSecretConfirmed] = useState(false);

  // Edit name
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null);

  // Copy any text
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Cleanup timers on unmount to prevent state updates after navigation
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  /* ── Create ── */
  async function handleCreate() {
    if (!keyName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey({
        name: keyName,
        permissions: selectedPerms,
        rateLimit: Number(rateLimit) || 60,
        ipWhitelist: parseIpWhitelist(ipWhitelist),
      });
      setApiKeys((prev) => [
        {
          id: result.id,
          name: result.name ?? keyName,
          key: maskKey(result.key),
          permissions: selectedPerms,
          rateLimit: result.rateLimit ?? (Number(rateLimit) || 60),
          ipWhitelist: result.ipWhitelist ?? parseIpWhitelist(ipWhitelist),
          isActive: true,
          lastUsed: null,
          revokedAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewSecret({ key: result.key, id: result.id });
      setSecretConfirmed(false);
      setSecretCopied(false);
      setIdCopied(false);
      setShowCreate(false);
      setKeyName("");
      setRateLimit("60");
      setIpWhitelist("");
      setSelectedPerms(["sms:send", "contacts:read"]);
      toast.success("สร้าง API Key สำเร็จ");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  /* ── Toggle ── */
  async function handleToggle(keyId: string) {
    try {
      const updated = await toggleApiKey(keyId);
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, isActive: updated.isActive } : k
        )
      );
      toast.success(
        updated.isActive ? "เปิดใช้งาน API Key แล้ว" : "ปิดใช้งาน API Key แล้ว"
      );
    } catch (e) {
      toast.error(safeErrorMessage(e));
    }
  }

  /* ── Delete ── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteApiKey(deleteTarget.id);
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === deleteTarget.id
            ? { ...k, isActive: false, revokedAt: new Date().toISOString() }
            : k
        )
      );
      toast.success("เพิกถอน API Key แล้ว");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setDeleteTarget(null);
    }
  }

  /* ── Rename ── */
  async function handleRename() {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      await updateApiKeyName(editingId, { name: editName });
      setApiKeys((prev) =>
        prev.map((k) => (k.id === editingId ? { ...k, name: editName } : k))
      );
      setEditingId(null);
      toast.success("เปลี่ยนชื่อ API Key แล้ว");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  /* ── Copy ── */
  function copyText(text: string, type: "secret" | "id" | "prefix") {
    navigator.clipboard.writeText(text);
    const schedule = (fn: () => void) => {
      const t = setTimeout(fn, 2000);
      timersRef.current.push(t);
    };
    if (type === "secret") {
      setSecretCopied(true);
      schedule(() => setSecretCopied(false));
    } else if (type === "id") {
      setIdCopied(true);
      schedule(() => setIdCopied(false));
    } else {
      setCopiedKeyId(text);
      schedule(() => setCopiedKeyId(null));
    }
  }

  function togglePerm(id: string) {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const activeCount = apiKeys.filter((k) => k.isActive && !k.revokedAt).length;
  const managedCount = apiKeys.filter((k) => !k.revokedAt).length;

  return (
    <PageLayout>
      {isTrial && (
        <div className="mb-4">
          <TrialNotice variant="api-limit" />
        </div>
      )}

      <PageHeader
        title="API Keys"
        description="จัดการ API keys สำหรับเชื่อมต่อระบบภายนอก"
        actions={
          <Button
            onClick={() => setShowCreate(true)}
            className="gap-1.5 font-semibold bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)]"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">สร้างคีย์ใหม่</span>
          </Button>
        }
      />

      {/* ── Rate Limit Overview ── */}
      <StatsRow columns={3}>
        <StatCard
          icon={<Key className="w-5 h-5 text-[var(--accent)]" />}
          iconColor="var(--accent-rgb)"
          value={`${activeCount}/${apiKeys.length}`}
          label="Keys ที่ใช้งาน"
          subtitle={`สร้างได้สูงสุด 5 keys (${managedCount}/5)`}
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-[var(--info)]" />}
          iconColor="var(--info-rgb)"
          value="60"
          label="Rate Limit (req/min)"
          subtitle="แพลนปัจจุบัน: Free"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-[var(--warning)]" />}
          iconColor="var(--warning-rgb)"
          value="0"
          label="API Calls เดือนนี้"
          subtitle="ไม่มีข้อมูล"
        />
      </StatsRow>

      {/* ── One-time Secret Display ── */}
      {newSecret && (
        <div className="rounded-lg p-6 mb-5 space-y-4 bg-[var(--bg-surface)] border border-[rgba(var(--success-rgb),0.2)]">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-[var(--success)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--success)]">
                API Key สร้างเรียบร้อยแล้ว
              </p>
              <p className="text-xs mt-1 text-[var(--text-muted)]">
                คัดลอก Secret Key ตอนนี้เลย — จะไม่แสดงอีกหลังจากปิด
              </p>
            </div>
          </div>

          {/* Key ID */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-medium block mb-1.5 text-[var(--text-muted)]">
              Key ID
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg px-4 py-2.5 text-xs font-mono break-all bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                {newSecret.id}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText(newSecret.id, "id")}
                className="gap-1 text-xs shrink-0"
              >
                {idCopied ? (
                  <><Check className="w-3 h-3" /> คัดลอกแล้ว</>
                ) : (
                  <><Copy className="w-3 h-3" /> คัดลอก</>
                )}
              </Button>
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-medium block mb-1.5 text-[var(--text-muted)]">
              Secret Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg px-4 py-2.5 text-sm font-mono break-all bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--accent)]">
                {newSecret.key}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText(newSecret.key, "secret")}
                className="gap-1 text-xs shrink-0"
              >
                {secretCopied ? (
                  <><Check className="w-3 h-3" /> คัดลอกแล้ว</>
                ) : (
                  <><Copy className="w-3 h-3" /> คัดลอก</>
                )}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg p-3 flex items-start gap-2.5 bg-[rgba(var(--warning-rgb),0.08)] border border-[rgba(var(--warning-rgb),0.15)]">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[var(--warning)]" />
            <span className="text-xs text-[var(--warning)]">
              Secret Key จะไม่แสดงอีกหลังจากปิด — คัดลอกเก็บไว้ที่ปลอดภัย
            </span>
          </div>

          {/* Confirm + Close */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <Checkbox
                checked={secretConfirmed}
                onCheckedChange={(v) => setSecretConfirmed(!!v)}
              />
              <span className="text-xs text-[var(--text-primary)]">
                ฉันคัดลอก Secret Key แล้ว
              </span>
            </label>
            <Button
              variant="outline"
              size="sm"
              disabled={!secretConfirmed}
              onClick={() => setNewSecret(null)}
              className="text-xs"
            >
              ปิด
            </Button>
          </div>
        </div>
      )}

      {/* ── API Keys Table ── */}
      <TableWrapper>
        {apiKeys.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-b-[var(--border-default)]">
                <TableHead className="text-[var(--text-muted)]">ชื่อ</TableHead>
                <TableHead className="text-[var(--text-muted)]">Key</TableHead>
                <TableHead className="text-[var(--text-muted)] hidden lg:table-cell">
                  สิทธิ์
                </TableHead>
                <TableHead className="text-[var(--text-muted)]">สถานะ</TableHead>
                <TableHead className="text-[var(--text-muted)] hidden md:table-cell">
                  ใช้ล่าสุด
                </TableHead>
                <TableHead className="text-[var(--text-muted)] text-right">
                  จัดการ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((k) => (
                <TableRow
                  key={k.id}
                  className="border-b-[var(--border-default)]"
                >
                  {/* Name (editable) */}
                  <TableCell>
                    {editingId === k.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-xs w-32"
                          maxLength={50}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={handleRename}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors cursor-pointer group disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => {
                          setEditingId(k.id);
                          setEditName(k.name);
                        }}
                        disabled={Boolean(k.revokedAt)}
                      >
                        {k.name}
                        <Edit2
                          size={10}
                          className="opacity-0 group-hover:opacity-50 transition-opacity"
                        />
                      </button>
                    )}
                  </TableCell>

                  {/* Key prefix */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono px-2 py-1 rounded bg-[var(--bg-base)] text-[var(--accent)]">
                        {maskKey(k.key)}
                      </code>
                      <button
                        type="button"
                        className="p-1 rounded cursor-pointer hover:bg-white/[0.05] transition-colors text-[var(--text-muted)]"
                        onClick={() => copyText(k.key, "prefix")}
                        aria-label="คัดลอก key prefix"
                      >
                        {copiedKeyId === k.key ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </TableCell>

                  {/* Permissions */}
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(k.permissions ?? []).slice(0, 3).map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 border-[var(--border-default)] text-[var(--text-muted)]"
                        >
                          {PERM_LABEL[p] ?? p}
                        </Badge>
                      ))}
                      {(k.permissions ?? []).length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 border-[var(--border-default)] text-[var(--text-muted)]"
                        >
                          +{k.permissions.length - 3}
                        </Badge>
                      )}
                      {(!k.permissions || k.permissions.length === 0) && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          ไม่จำกัด
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={k.isActive ? "default" : "destructive"}
                      className={
                        k.revokedAt
                          ? "bg-[rgba(var(--error-rgb),0.1)] text-[var(--error)] border border-[rgba(var(--error-rgb),0.15)]"
                          : k.isActive
                          ? "bg-[rgba(var(--success-rgb),0.1)] text-[var(--success)] border border-[rgba(var(--success-rgb),0.15)] hover:bg-[rgba(var(--success-rgb),0.15)]"
                          : "bg-[rgba(var(--error-rgb),0.1)] text-[var(--error)] border border-[rgba(var(--error-rgb),0.15)]"
                      }
                    >
                      {k.revokedAt ? "เพิกถอน" : k.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>

                  {/* Last used */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-[var(--text-muted)]">
                      {k.lastUsed ? timeAgo(k.lastUsed) : "ยังไม่เคยใช้"}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className={`p-1.5 rounded-md cursor-pointer hover:bg-white/[0.05] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          k.isActive ? "text-[var(--text-muted)]" : "text-[var(--accent)]"
                        }`}
                        onClick={() => handleToggle(k.id)}
                        aria-label={k.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        disabled={Boolean(k.revokedAt)}
                      >
                        {k.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-md cursor-pointer hover:bg-[rgba(var(--error-rgb),0.06)] transition-colors text-[var(--error)] disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() => setDeleteTarget(k)}
                        aria-label={`เพิกถอน API Key ${k.name}`}
                        disabled={Boolean(k.revokedAt)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={Key}
              iconColor="var(--accent-blue)"
              iconBg="rgba(var(--accent-blue-rgb),0.08)"
              title="ยังไม่มี API Key"
              description="สร้าง API Key เพื่อเชื่อมต่อระบบของคุณกับ SMSOK API"
              ctaLabel="สร้าง API Key"
              ctaAction={() => setShowCreate(true)}
              helpLabel="อ่าน API Documentation"
              helpAction={() => window.open("/docs/api", "_blank")}
            />
          </div>
        )}
      </TableWrapper>

      {/* ── API Docs + Usage Example ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <div className="rounded-lg p-5 flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)]">
            <BookOpen className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              API Documentation
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              เรียนรู้การใช้งาน API สำหรับนักพัฒนา
            </p>
          </div>
          <a href="/dashboard/api-docs">
            <Button variant="outline" size="sm" className="text-xs shrink-0">
              ดูเอกสาร
            </Button>
          </a>
        </div>

        <div className="rounded-lg p-5 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <p className="text-xs font-medium mb-3 text-[var(--text-muted)]">
            ตัวอย่างการใช้งาน
          </p>
          <div className="rounded-lg p-3 overflow-x-auto bg-[var(--bg-base)] border border-[var(--border-default)]">
            <code className="text-[11px] text-[var(--accent)] font-mono whitespace-pre block">
              {`curl -X POST /api/v1/sms/send \\
  -H "X-API-Key: sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"to":"0812345678","message":"Hello!"}'`}
            </code>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Create Key Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[480px] bg-[var(--bg-elevated,#0f1724)] border-[var(--border-default)] text-[var(--text-primary)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <Key className="w-4 h-4 text-[var(--accent)]" /> สร้าง API Key ใหม่
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[var(--text-muted)]">
              กำหนดชื่อ สิทธิ์ และการตั้งค่าสำหรับ API Key
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Name */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium block mb-1.5 text-[var(--text-muted)]">
                ชื่อ Key
              </label>
              <Input
                placeholder="เช่น Production, Staging, My App"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                maxLength={50}
                className="h-11 bg-[var(--bg-inset,#061019)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                autoFocus
              />
            </div>

            {/* Permissions */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium block mb-2 text-[var(--text-muted)]">
                สิทธิ์การใช้งาน
              </label>
              <div className="space-y-1 max-h-[240px] overflow-y-auto">
                {PERMISSIONS.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.03]"
                  >
                    <Checkbox
                      checked={selectedPerms.includes(perm.id)}
                      onCheckedChange={() => togglePerm(perm.id)}
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {perm.label}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Rate Limit */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium block mb-1.5 text-[var(--text-muted)]">
                Rate Limit (requests/minute)
              </label>
              <Input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                min={1}
                max={1000}
                className="h-11 bg-[var(--bg-inset,#061019)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                ค่าเริ่มต้น 60 req/min (แพลน Free)
              </p>
            </div>

            {/* IP Whitelist */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium block mb-1.5 text-[var(--text-muted)]">
                IP Whitelist (ไม่บังคับ)
              </label>
              <Input
                placeholder="เช่น 203.0.113.1, 198.51.100.0"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                className="h-11 bg-[var(--bg-inset,#061019)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                ใส่ IP คั่นด้วยคอมมา — ว่างไว้ = อนุญาตทุก IP
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreate(false)}
              className="text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!keyName.trim() || creating}
              className="gap-1.5 text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)]"
            >
              {creating ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> กำลังสร้าง...
                </>
              ) : (
                "สร้าง Key"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Delete Confirmation
          ═══════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-[var(--bg-elevated,#0f1724)] border-[var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              เพิกถอน API Key &quot;{deleteTarget?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              ระบบที่ใช้คีย์นี้จะไม่สามารถเชื่อมต่อได้อีก
              แต่ประวัติการใช้งานจะยังถูกเก็บไว้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="text-xs bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
            >
              ยืนยันเพิกถอน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
