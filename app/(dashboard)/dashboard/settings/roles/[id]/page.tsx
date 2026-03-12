"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import CustomSelect from "@/components/ui/CustomSelect";

// Icons
import { ArrowLeft, Save, Loader2, Lock, Shield } from "lucide-react";

/* ─── RBAC Constants ─── */

const RBAC_RESOURCES = [
  "sms", "contact", "campaign", "template", "group", "tag",
  "billing", "invoice", "credit", "transaction",
  "api_key", "webhook", "user", "org", "role",
  "audit_log", "ticket", "analytics", "settings",
] as const;

const RBAC_ACTIONS = ["create", "read", "update", "delete", "manage"] as const;

type RbacResource = (typeof RBAC_RESOURCES)[number];
type RbacAction = (typeof RBAC_ACTIONS)[number];

const PERMISSION_CATEGORIES: {
  name: string;
  icon: string;
  resources: RbacResource[];
}[] = [
  { name: "SMS & Messaging", icon: "\uD83D\uDCF1", resources: ["sms", "campaign", "template", "contact"] },
  { name: "Contacts & Lists", icon: "\uD83D\uDCCB", resources: ["group", "tag"] },
  { name: "Billing & Finance", icon: "\uD83D\uDCB0", resources: ["billing", "invoice", "credit", "transaction"] },
  { name: "Developer", icon: "\uD83D\uDD27", resources: ["api_key", "webhook"] },
  { name: "Organization", icon: "\uD83C\uDFE2", resources: ["user", "org", "role", "settings", "audit_log"] },
  { name: "Analytics & Support", icon: "\uD83D\uDCCA", resources: ["analytics", "ticket"] },
];

const RESOURCE_LABELS: Record<RbacResource, string> = {
  sms: "SMS",
  contact: "Contacts",
  campaign: "Campaigns",
  template: "Templates",
  group: "Groups",
  tag: "Tags",
  billing: "Billing",
  invoice: "Invoices",
  credit: "Credits",
  transaction: "Transactions",
  api_key: "API Keys",
  webhook: "Webhooks",
  user: "Users",
  org: "Organization",
  role: "Roles",
  audit_log: "Audit Log",
  ticket: "Tickets",
  analytics: "Analytics",
  settings: "Settings",
};

const ACTION_LABELS: Record<RbacAction, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  manage: "Manage",
};

/* ─── Helper: permission key ─── */

function permKey(action: string, resource: string) {
  return `${action}:${resource}`;
}

/* ─── Types ─── */

interface RoleUser {
  id: string;
  name: string;
  email: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  parentRole: string;
  permissions: { action: string; resource: string }[];
  userRoles: { user: RoleUser }[];
}

/* ─── Quick Presets ─── */

function makePreset(preset: string): Set<string> {
  const s = new Set<string>();

  if (preset === "all") {
    for (const r of RBAC_RESOURCES) {
      for (const a of RBAC_ACTIONS) {
        s.add(permKey(a, r));
      }
    }
  } else if (preset === "none") {
    // empty set
  } else if (preset === "readonly") {
    for (const r of RBAC_RESOURCES) {
      s.add(permKey("read", r));
    }
  } else if (preset === "crud") {
    for (const r of RBAC_RESOURCES) {
      s.add(permKey("create", r));
      s.add(permKey("read", r));
      s.add(permKey("update", r));
      s.add(permKey("delete", r));
    }
  } else if (preset === "sms_team") {
    const smsResources: RbacResource[] = ["sms", "campaign", "template", "contact", "group", "tag"];
    for (const r of smsResources) {
      s.add(permKey("create", r));
      s.add(permKey("read", r));
      s.add(permKey("update", r));
      s.add(permKey("delete", r));
    }
    // Read-only for analytics
    s.add(permKey("read", "analytics"));
  }

  return s;
}

/* ─── Parent Role Options ─── */

const PARENT_ROLE_OPTIONS = [
  { value: "", label: "ไม่มี (root)" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

/* ─── Main Component ─── */

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  // Role info state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [parentRole, setParentRole] = useState("");
  const [users, setUsers] = useState<RoleUser[]>([]);

  // Permission matrix state
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [initialPermissions, setInitialPermissions] = useState<Set<string>>(new Set());

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialName, setInitialName] = useState("");
  const [initialDescription, setInitialDescription] = useState("");
  const [initialParentRole, setInitialParentRole] = useState("");

  // ─── Fetch role data ───

  useEffect(() => {
    async function fetchRole() {
      try {
        const res = await fetch(`/api/v1/organizations/default/roles/${roleId}`);
        if (!res.ok) throw new Error("Failed to fetch role");
        const data: RoleData = await res.json();

        setName(data.name);
        setDescription(data.description || "");
        setIsSystemRole(data.isSystemRole);
        setParentRole(data.parentRole || "");
        setUsers(data.userRoles?.map((ur) => ur.user) || []);

        const permSet = new Set<string>();
        for (const p of data.permissions || []) {
          permSet.add(permKey(p.action, p.resource));
        }
        setPermissions(permSet);
        setInitialPermissions(new Set(permSet));

        setInitialName(data.name);
        setInitialDescription(data.description || "");
        setInitialParentRole(data.parentRole || "");
      } catch {
        // If fetch fails, stay on page with empty state
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [roleId]);

  // ─── Dirty tracking ───

  const hasChanges = useMemo(() => {
    if (name !== initialName) return true;
    if (description !== initialDescription) return true;
    if (parentRole !== initialParentRole) return true;
    if (permissions.size !== initialPermissions.size) return true;
    for (const p of permissions) {
      if (!initialPermissions.has(p)) return true;
    }
    return false;
  }, [name, description, parentRole, permissions, initialName, initialDescription, initialParentRole, initialPermissions]);

  // ─── Permission helpers ───

  const togglePermission = useCallback((action: string, resource: string) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      const key = permKey(action, resource);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleCategoryAll = useCallback((resources: RbacResource[]) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      // Check if all in category are selected
      const allKeys: string[] = [];
      for (const r of resources) {
        for (const a of RBAC_ACTIONS) {
          allKeys.push(permKey(a, r));
        }
      }
      const allSelected = allKeys.every((k) => next.has(k));

      if (allSelected) {
        for (const k of allKeys) next.delete(k);
      } else {
        for (const k of allKeys) next.add(k);
      }
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: string) => {
    setPermissions(makePreset(preset));
  }, []);

  // ─── Stats ───

  const totalPossible = RBAC_RESOURCES.length * RBAC_ACTIONS.length;
  const selectedCount = permissions.size;

  // ─── Save ───

  async function handleSave() {
    setSaving(true);
    try {
      // Update role info
      await fetch(`/api/v1/organizations/default/roles/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, parentRole }),
      });

      // Update permissions
      const permArray = Array.from(permissions).map((key) => {
        const [action, resource] = key.split(":");
        return { action, resource };
      });

      await fetch(`/api/v1/organizations/default/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permArray }),
      });

      // Update initial state so dirty tracking resets
      setInitialName(name);
      setInitialDescription(description);
      setInitialParentRole(parentRole);
      setInitialPermissions(new Set(permissions));
    } catch {
      // handle error silently for now
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      </div>
    );
  }

  // ─── Render ───

  return (
    <div className="p-4 md:p-8 max-w-5xl pb-20 md:pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings/roles"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Roles
          </Link>
          <div className="h-4 w-px bg-[var(--border-default)]" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center text-[var(--accent)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {name || "Role"}
                </h2>
                {isSystemRole && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" />
                    System
                  </span>
                )}
                {!isSystemRole && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)] font-semibold uppercase tracking-wider">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {users.length} users assigned
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold transition-all ${
            hasChanges
              ? "shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
              : ""
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1.5" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* ── Role Info Card ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 md:p-6 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Role Info</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={isSystemRole}
              className={`h-10 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)] ${
                isSystemRole ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/* Parent Role */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Parent Role
            </label>
            <CustomSelect
              value={parentRole}
              onChange={setParentRole}
              options={PARENT_ROLE_OPTIONS}
              placeholder="เลือก parent role..."
              disabled={isSystemRole}
            />
          </div>

          {/* Description — full width */}
          <div className="md:col-span-2">
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Role description..."
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg resize-none focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
            />
          </div>
        </div>

        {/* Member count */}
        {users.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              {users.length} member{users.length !== 1 ? "s" : ""} with this role
            </span>
            <Link
              href={`/dashboard/settings/team?role=${roleId}`}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
            >
              ดู users &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* ── Permission Matrix Card ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Permission Matrix</h3>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset("all")}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.15)] hover:bg-[rgba(var(--accent-rgb),0.15)] transition-colors font-medium"
            >
              เลือกทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => applyPreset("none")}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.08)] transition-colors font-medium"
            >
              ยกเลิกทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => applyPreset("readonly")}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.08)] transition-colors font-medium"
            >
              Read-only
            </button>
            <button
              type="button"
              onClick={() => applyPreset("crud")}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.08)] transition-colors font-medium"
            >
              Full CRUD
            </button>
            <button
              type="button"
              onClick={() => applyPreset("sms_team")}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.08)] transition-colors font-medium"
            >
              SMS Team
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {PERMISSION_CATEGORIES.map((category) => {
            // Check if all permissions in this category are selected
            const allCatKeys: string[] = [];
            for (const r of category.resources) {
              for (const a of RBAC_ACTIONS) {
                allCatKeys.push(permKey(a, r));
              }
            }
            const allCatSelected = allCatKeys.every((k) => permissions.has(k));
            const someCatSelected = allCatKeys.some((k) => permissions.has(k));

            return (
              <div key={category.name}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{category.icon}</span>
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    {category.name}
                  </h4>
                  <span className="text-[10px] text-[var(--text-muted)] ml-1">
                    {category.resources.length} resources
                  </span>
                </div>

                {/* Permission Table */}
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-[140px]">
                          Resource
                        </th>
                        {RBAC_ACTIONS.map((action) => (
                          <th
                            key={action}
                            className="text-center px-2 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                          >
                            {ACTION_LABELS[action]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {category.resources.map((resource, i) => (
                        <tr
                          key={resource}
                          className={`border-t border-[var(--border-default)] ${
                            i % 2 === 1 ? "bg-[rgba(255,255,255,0.015)]" : ""
                          }`}
                        >
                          <td className="px-3 py-2.5 text-sm text-[var(--text-primary)] font-medium">
                            {RESOURCE_LABELS[resource]}
                          </td>
                          {RBAC_ACTIONS.map((action) => {
                            const key = permKey(action, resource);
                            const checked = permissions.has(key);
                            return (
                              <td key={action} className="text-center px-2 py-2.5">
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => togglePermission(action, resource)}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Toggle all in category */}
                <div className="mt-2 ml-1">
                  <button
                    type="button"
                    onClick={() => toggleCategoryAll(category.resources)}
                    className="inline-flex items-center gap-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Checkbox
                      checked={allCatSelected}
                      onCheckedChange={() => toggleCategoryAll(category.resources)}
                    />
                    <span>
                      {allCatSelected
                        ? "ยกเลิกทั้ง group"
                        : someCatSelected
                          ? "เลือกทั้ง group"
                          : "เลือกทั้ง group"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary bar */}
        <div className="mt-6 pt-4 border-t border-[var(--border-default)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">
            {RBAC_RESOURCES.length} resources &middot;{" "}
            <span className={selectedCount > 0 ? "text-[var(--accent)]" : ""}>
              {selectedCount}/{totalPossible}
            </span>{" "}
            permissions selected
          </span>
          <div className="w-32 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${(selectedCount / totalPossible) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/settings/roles")}
          className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.3)]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold transition-all ${
            hasChanges
              ? "shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
              : ""
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1.5" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
