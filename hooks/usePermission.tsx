"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/providers/auth-store-provider";

type PermissionCheck = `${string}:${string}`; // "action:resource" format

/**
 * Hook to check user permissions.
 * Fetches permissions from API and caches in state.
 *
 * Usage:
 *   const { can, loading } = usePermission();
 *   if (can("create:sms")) { ... }
 *
 *   // Or check specific permission:
 *   const { allowed, loading } = usePermission("sms:create");
 */
export function usePermission(check?: PermissionCheck) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    let cancelled = false;
    async function fetchPermissions() {
      try {
        const orgSlug = organizationId || "default";
        const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgSlug)}/me/permissions`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setPermissions(new Set(data.permissions ?? []));
            if (data.organizationId && !organizationId) {
              updateUser({ organizationId: data.organizationId });
            }
          }
        } else {
          if (!cancelled) setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPermissions();
    return () => { cancelled = true; };
  }, [organizationId, updateUser]);

  const can = useCallback((permission: PermissionCheck) => {
    return permissions.has(permission);
  }, [permissions]);

  // If a specific check was provided, return { allowed, loading, error }
  if (check) {
    return { allowed: can(check), loading, can, permissions, error };
  }

  return { can, loading, permissions, allowed: false, error };
}

/**
 * Component wrapper for permission-based rendering.
 *
 * Usage:
 *   <PermissionGate permission="create:sms">
 *     <Button>Send SMS</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  showDisabled = false,
}: {
  permission: PermissionCheck;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}) {
  const { allowed, loading, error } = usePermission(permission);

  if (loading) return null;

  // Fail-closed: if permission fetch failed, deny access (security)
  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(var(--error-rgb,242,54,69),0.06)] border border-[rgba(var(--error-rgb,242,54,69),0.15)] text-sm text-[var(--error,#F23645)]">
        <span>ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาลองใหม่</span>
      </div>
    );
  }

  if (!allowed) {
    if (showDisabled) {
      return (
        <div className="opacity-40 cursor-not-allowed pointer-events-none" title={`ต้องการสิทธิ์ ${permission}`}>
          {children}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
