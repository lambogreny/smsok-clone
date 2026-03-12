"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronRight,
  Lock,
  Shield,
  Loader2,
  GitBranch,
  Users,
} from "lucide-react";
import PageLayout, { PageHeader, EmptyState } from "@/components/blocks/PageLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CustomSelect from "@/components/ui/CustomSelect";

/* ─── Types ─── */

interface RoleParent {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  parentRole: RoleParent | null;
  _count: {
    userRoles: number;
    permissions: number;
  };
}

/* ─── Icon + Color Mapping ─── */

const ROLE_ICON_MAP: Record<string, string> = {
  Owner: "\u{1F451}",
  Admin: "\u{1F6E1}\uFE0F",
  Member: "\u{1F464}",
  Viewer: "\u{1F441}\uFE0F",
  "API-only": "\u{1F511}",
};

const ROLE_COLOR_MAP: Record<string, { bg: string; color: string }> = {
  Owner: { bg: "rgba(var(--warning-rgb),0.08)", color: "var(--warning)" },
  Admin: { bg: "rgba(var(--info-rgb),0.08)", color: "var(--info)" },
  Member: { bg: "rgba(var(--success-rgb),0.08)", color: "var(--success)" },
  Viewer: { bg: "rgba(107,112,117,0.08)", color: "var(--text-muted)" },
  "API-only": { bg: "rgba(var(--accent-purple-rgb),0.08)", color: "var(--accent-purple)" },
};

const DEFAULT_ICON = "\u{1F3A8}";
const DEFAULT_COLOR = { bg: "rgba(0,226,181,0.08)", color: "var(--accent)" };

function getRoleIcon(name: string) {
  return ROLE_ICON_MAP[name] ?? DEFAULT_ICON;
}

function getRoleColor(name: string) {
  return ROLE_COLOR_MAP[name] ?? DEFAULT_COLOR;
}

/* ─── Tabs ─── */

type TabKey = "roles" | "hierarchy";

const TABS: { key: TabKey; label: string; icon: typeof Shield }[] = [
  { key: "roles", label: "Roles", icon: Shield },
  { key: "hierarchy", label: "Hierarchy", icon: GitBranch },
];

/* ─── Main Component ─── */

export default function RolesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Create dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createTemplate, setCreateTemplate] = useState("");
  const [createParent, setCreateParent] = useState("");
  const [creating, setCreating] = useState(false);

  /* ─── Fetch Roles ─── */

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/organizations/default/roles");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoles(data.roles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  /* ─── Create Role ─── */

  async function handleCreate() {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const body: Record<string, string> = { name: createName.trim() };
      if (createDesc.trim()) body.description = createDesc.trim();
      if (createTemplate) body.templateRoleId = createTemplate;
      if (createParent) body.parentRoleId = createParent;

      const res = await fetch("/api/v1/organizations/default/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDialogOpen(false);
      resetCreateForm();
      fetchRoles();
    } catch (err) {
      console.error("Create role failed:", err);
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setCreateName("");
    setCreateDesc("");
    setCreateTemplate("");
    setCreateParent("");
  }

  /* ─── Derived Data ─── */

  const systemRoles = roles.filter((r) => r.isSystemRole);
  const customRoles = roles.filter((r) => !r.isSystemRole);

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: `${getRoleIcon(r.name)} ${r.name}`,
  }));

  /* ─── Hierarchy Helpers ─── */

  function buildTree() {
    const childrenMap = new Map<string | null, Role[]>();
    const standalone: Role[] = [];

    for (const role of roles) {
      if (role.parentRole) {
        const parentId = role.parentRole.id;
        if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
        childrenMap.get(parentId)!.push(role);
      }
    }

    // Find root roles (roles that are parents but have no parent themselves)
    const rootIds = new Set<string>();
    for (const role of roles) {
      if (role.parentRole === null) {
        const hasChildren = childrenMap.has(role.id);
        if (hasChildren) {
          rootIds.add(role.id);
        } else {
          standalone.push(role);
        }
      }
    }

    const roots = roles.filter((r) => rootIds.has(r.id));
    return { roots, childrenMap, standalone };
  }

  function renderTreeNode(
    role: Role,
    childrenMap: Map<string | null, Role[]>,
    prefix: string,
    isLast: boolean,
  ) {
    const children = childrenMap.get(role.id) ?? [];
    const connector = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500";
    const color = getRoleColor(role.name);

    return (
      <div key={role.id}>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/settings/roles/${role.id}`)}
          className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
        >
          <span className="font-mono text-[var(--text-muted)] text-sm whitespace-pre">
            {prefix}{connector}
          </span>
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: color.bg }}
          >
            {getRoleIcon(role.name)}
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {role.name}
          </span>
          {role.isSystemRole && (
            <Lock className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
          )}
          <span className="text-xs text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {role._count.userRoles} users
          </span>
        </button>
        {children.map((child, idx) =>
          renderTreeNode(
            child,
            childrenMap,
            prefix + (isLast ? "    " : "\u2502   "),
            idx === children.length - 1,
          ),
        )}
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <PageLayout>
      <PageHeader
        title="บทบาทและสิทธิ์"
        count={roles.length}
        description="จัดการบทบาทและลำดับชั้นของสิทธิ์"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetCreateForm(); }}>
            <DialogTrigger>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                สร้าง Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>สร้าง Role ใหม่</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-2">
                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                    ชื่อ Role <span className="text-[var(--error)]">*</span>
                  </label>
                  <Input
                    placeholder="เช่น Marketing, Support"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                    คำอธิบาย
                  </label>
                  <Textarea
                    placeholder="อธิบายหน้าที่ของ Role นี้..."
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Template */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                    Template (คัดลอกสิทธิ์จาก)
                  </label>
                  <CustomSelect
                    value={createTemplate}
                    onChange={setCreateTemplate}
                    options={[{ value: "", label: "ไม่ใช้ Template" }, ...roleOptions]}
                    placeholder="เลือก Role ต้นแบบ..."
                  />
                </div>

                {/* Parent Role */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                    Parent Role (ลำดับชั้น)
                  </label>
                  <CustomSelect
                    value={createParent}
                    onChange={setCreateParent}
                    options={[{ value: "", label: "ไม่มี Parent" }, ...roleOptions]}
                    placeholder="เลือก Parent Role..."
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleCreate}
                  disabled={!createName.trim() || creating}
                  className="w-full mt-1"
                >
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  สร้าง Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* ─── Tab Buttons ─── */}
      <div className="flex items-center gap-1 mb-5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-[rgba(0,226,181,0.08)] text-[var(--accent)] border border-[rgba(0,226,181,0.2)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
        </div>
      )}

      {/* ─── Error ─── */}
      {!loading && error && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 text-center">
          <p className="text-sm text-[var(--error)] mb-3">เกิดข้อผิดพลาด: {error}</p>
          <Button variant="outline" size="sm" onClick={fetchRoles}>
            ลองใหม่
          </Button>
        </div>
      )}

      {/* ─── Roles Tab ─── */}
      {!loading && !error && activeTab === "roles" && (
        <>
          {roles.length === 0 ? (
            <EmptyState
              icon={<Shield className="w-10 h-10" />}
              title="ยังไม่มี Role"
              subtitle="สร้าง Role ใหม่เพื่อจัดการสิทธิ์ของทีม"
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  สร้าง Role
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {/* System Roles Section */}
              {systemRoles.length > 0 && (
                <div>
                  <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
                    System Roles
                  </h2>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden divide-y divide-[var(--table-border)]">
                    {systemRoles.map((role) => (
                      <RoleRow
                        key={role.id}
                        role={role}
                        onClick={() => router.push(`/dashboard/settings/roles/${role.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Roles Section */}
              <div>
                <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
                  Custom Roles
                </h2>
                {customRoles.length === 0 ? (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-8 text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      ยังไม่มี Custom Role — กดปุ่ม &quot;สร้าง Role&quot; เพื่อเริ่มต้น
                    </p>
                  </div>
                ) : (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden divide-y divide-[var(--table-border)]">
                    {customRoles.map((role) => (
                      <RoleRow
                        key={role.id}
                        role={role}
                        onClick={() => router.push(`/dashboard/settings/roles/${role.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Hierarchy Tab ─── */}
      {!loading && !error && activeTab === "hierarchy" && (
        <>
          {roles.length === 0 ? (
            <EmptyState
              icon={<GitBranch className="w-10 h-10" />}
              title="ยังไม่มีข้อมูล"
              subtitle="สร้าง Role พร้อมกำหนด Parent เพื่อดู Hierarchy"
            />
          ) : (
            <HierarchyView
              roles={roles}
              buildTree={buildTree}
              renderTreeNode={renderTreeNode}
              router={router}
            />
          )}
        </>
      )}
    </PageLayout>
  );
}

/* ─── Role Row Component ─── */

function RoleRow({ role, onClick }: { role: Role; onClick: () => void }) {
  const color = getRoleColor(role.name);
  const icon = getRoleIcon(role.name);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group text-left"
    >
      {/* Icon */}
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: color.bg }}
      >
        {icon}
      </span>

      {/* Name + Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {role.name}
          </span>

          {/* System Role badge */}
          {role.isSystemRole && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(245,158,11,0.08)] text-[var(--warning)]">
              <Lock className="w-3 h-3" />
              System Role
            </span>
          )}

          {/* Custom badge */}
          {!role.isSystemRole && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(0,226,181,0.08)] text-[var(--accent)]">
              Custom
            </span>
          )}
        </div>
        {role.description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
            {role.description}
          </p>
        )}
      </div>

      {/* User count */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] flex-shrink-0">
        <Users className="w-3.5 h-3.5" />
        <span>{role._count.userRoles}</span>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}

/* ─── Hierarchy View Component ─── */

function HierarchyView({
  roles,
  buildTree,
  renderTreeNode,
  router,
}: {
  roles: Role[];
  buildTree: () => {
    roots: Role[];
    childrenMap: Map<string | null, Role[]>;
    standalone: Role[];
  };
  renderTreeNode: (
    role: Role,
    childrenMap: Map<string | null, Role[]>,
    prefix: string,
    isLast: boolean,
  ) => React.ReactNode;
  router: ReturnType<typeof useRouter>;
}) {
  const { roots, childrenMap, standalone } = buildTree();

  return (
    <div className="flex flex-col gap-6">
      {/* Tree View */}
      {roots.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
            Role Hierarchy
          </h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-3">
            {roots.map((root, idx) =>
              renderTreeNode(root, childrenMap, "", idx === roots.length - 1),
            )}
          </div>
        </div>
      )}

      {/* Standalone Roles */}
      {standalone.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
            Standalone Roles (ไม่มี Hierarchy)
          </h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-3">
            {standalone.map((role) => {
              const color = getRoleColor(role.name);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/settings/roles/${role.id}`)}
                  className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: color.bg }}
                  >
                    {getRoleIcon(role.name)}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {role.name}
                  </span>
                  {role.isSystemRole && (
                    <Lock className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                  )}
                  <span className="text-xs text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {role._count.userRoles} users
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty hierarchy state */}
      {roots.length === 0 && standalone.length === 0 && (
        <EmptyState
          icon={<GitBranch className="w-10 h-10" />}
          title="ยังไม่มี Hierarchy"
          subtitle="กำหนด Parent Role เมื่อสร้าง Role เพื่อสร้างลำดับชั้น"
        />
      )}
    </div>
  );
}
