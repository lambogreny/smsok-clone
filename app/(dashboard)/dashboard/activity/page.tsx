"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LogIn,
  Send,
  CreditCard,
  Settings,
  Shield,
  Key,
  Megaphone,
  Users,
  FileText,
  Loader2,
  Filter,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "login" | "sms_sent" | "package_purchased" | "settings_changed" | "api_key_created" | "campaign_sent" | "contact_imported" | "sender_requested" | "password_changed" | "2fa_enabled";
type FilterType = "all" | "auth" | "sms" | "billing" | "settings";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  createdAt: string;
  ip?: string;
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "auth", label: "เข้าสู่ระบบ" },
  { value: "sms", label: "SMS" },
  { value: "billing", label: "การเงิน" },
  { value: "settings", label: "ตั้งค่า" },
];

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "login": return LogIn;
    case "sms_sent": return Send;
    case "package_purchased": return CreditCard;
    case "settings_changed": return Settings;
    case "api_key_created": return Key;
    case "campaign_sent": return Megaphone;
    case "contact_imported": return Users;
    case "sender_requested": return FileText;
    case "password_changed": return Shield;
    case "2fa_enabled": return Shield;
    default: return Settings;
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case "login":
    case "password_changed":
    case "2fa_enabled":
      return "bg-[rgba(var(--accent-secondary-rgb,50,152,218),0.1)] text-[var(--accent-secondary)]";
    case "sms_sent":
    case "campaign_sent":
      return "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]";
    case "package_purchased":
      return "bg-[rgba(var(--success-rgb,34,197,94),0.1)] text-[var(--success)]";
    default:
      return "bg-[rgba(var(--text-muted-rgb,138,149,160),0.1)] text-[var(--text-muted)]";
  }
}

function getActivityFilter(type: ActivityType): FilterType {
  if (type === "login" || type === "password_changed" || type === "2fa_enabled") return "auth";
  if (type === "sms_sent" || type === "campaign_sent") return "sms";
  if (type === "package_purchased") return "billing";
  return "settings";
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return "วันนี้";
  if (d.getTime() === yesterday.getTime()) return "เมื่อวาน";
  if (d.getTime() > weekAgo.getTime()) return "สัปดาห์นี้";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings/activity");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const items: ActivityItem[] = (data.activities ?? data ?? []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        type: (a.type as ActivityType) ?? "settings_changed",
        title: a.title as string ?? a.action as string ?? "Activity",
        detail: a.detail as string ?? a.description as string ?? "",
        createdAt: a.createdAt as string ?? a.created_at as string,
        ip: a.ip as string,
      }));
      setActivities(items);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filtered = activities.filter((a) => filter === "all" || getActivityFilter(a.type) === filter);

  // Group by date
  const groups: { label: string; items: ActivityItem[] }[] = [];
  for (const item of filtered) {
    const label = formatDateGroup(item.createdAt);
    const existing = groups.find((g) => g.label === label);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">บันทึกกิจกรรม</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">ประวัติการใช้งานทั้งหมดของคุณ</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              filter === f.value
                ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center mx-auto mb-4">
            {filter === "all" ? (
              <Calendar className="w-7 h-7 text-[var(--text-muted)]" />
            ) : (
              <Filter className="w-7 h-7 text-[var(--text-muted)]" />
            )}
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            {filter === "all" ? "ยังไม่มีกิจกรรม" : "ไม่พบกิจกรรมในหมวดนี้"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            กิจกรรมต่างๆ เช่น การเข้าสู่ระบบ ส่ง SMS ซื้อแพ็กเกจ จะแสดงที่นี่
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{group.label}</h3>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[17px] top-0 bottom-0 w-px bg-[var(--border-default)]" />

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = getActivityIcon(item.type);
                    return (
                      <div key={item.id} className="relative flex items-start gap-4 pl-0">
                        {/* Icon dot */}
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 z-10", getActivityColor(item.type))}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatTime(item.createdAt)}</span>
                          </div>
                          {item.detail && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{item.detail}</p>
                          )}
                          {item.ip && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">IP: {item.ip}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
