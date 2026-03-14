"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  User,
  Shield,
  Globe,
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  CreditCard,
  BarChart3,
  Lock,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import ProfileEditForm from "./ProfileEditForm";
import PasswordChangeForm from "./PasswordChangeForm";
import TwoFactorSection from "./TwoFactorSection";
import TaxProfileSection from "./TaxProfileSection";
import SendingHoursSection from "./SendingHoursSection";
import SessionsSection from "./SessionsSection";
import ForceChangeModal from "./ForceChangeModal";
import SettingsAccordion from "./components/SettingsAccordion";
import MobileQuickLinks from "./components/MobileQuickLinks";
import { formatThaiDateOnly } from "@/lib/format-thai-date";

/* ─── Types ─── */

type Tab = "profile" | "security" | "sessions" | "notifications";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
};

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "โปรไฟล์", icon: User },
  { id: "security", label: "ความปลอดภัย", icon: Shield },
  { id: "sessions", label: "เซสชัน", icon: Globe },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
];

/* ─── Notification Preferences ─── */

type NotifPref = {
  id: string;
  label: string;
  description: string;
  icon: typeof Mail;
  email: boolean;
  sms: boolean;
};

const DEFAULT_NOTIF_PREFS: NotifPref[] = [
  {
    id: "low_balance",
    label: "SMS ใกล้หมด",
    description: "แจ้งเตือนเมื่อจำนวนข้อความคงเหลือต่ำกว่าที่กำหนด",
    icon: CreditCard,
    email: true,
    sms: true,
  },
  {
    id: "campaign_complete",
    label: "แคมเปญส่งเสร็จ",
    description: "แจ้งเตือนเมื่อแคมเปญส่ง SMS เสร็จสิ้น",
    icon: MessageSquare,
    email: true,
    sms: false,
  },
  {
    id: "monthly_report",
    label: "รายงานประจำเดือน",
    description: "สรุปยอดส่ง SMS และค่าใช้จ่ายรายเดือน",
    icon: BarChart3,
    email: true,
    sms: false,
  },
  {
    id: "security_alert",
    label: "แจ้งเตือนความปลอดภัย",
    description: "เข้าสู่ระบบจากอุปกรณ์ใหม่ หรือเปลี่ยนรหัสผ่าน",
    icon: AlertTriangle,
    email: true,
    sms: true,
  },
  {
    id: "api_error",
    label: "API Error",
    description: "แจ้งเตือนเมื่อ API call ล้มเหลวติดต่อกัน",
    icon: AlertTriangle,
    email: true,
    sms: false,
  },
];

/* ─── Shared Sub-Components ─── */

function ProfileCard({
  user,
  smsRemaining,
  memberSince,
}: {
  user: SettingsUser;
  smsRemaining: number;
  memberSince: string;
}) {
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Avatar + Info */}
      <div className="flex items-center gap-3.5 sm:gap-5 pb-4 border-b border-[rgba(43,53,64,0.5)] mb-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent-secondary)]/20 border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center shrink-0">
          <span className="text-base sm:text-xl font-bold text-[var(--text-primary)]">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] sm:text-lg font-semibold text-[var(--text-primary)] truncate">
            {user.name}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">
            {user.email}
          </p>
          <div className="flex items-center gap-3 mt-1 sm:mt-2">
            <span className="inline-flex items-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.15)]">
              {user.role}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
              สมาชิกตั้งแต่ {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              อีเมล
            </label>
            <input
              readOnly
              value={user.email}
              aria-readonly="true"
              aria-label="อีเมล (ไม่สามารถแก้ไข)"
              className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg text-[var(--text-secondary)] cursor-not-allowed w-full px-3.5 h-11 text-base sm:text-sm opacity-60"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              อีเมลไม่สามารถเปลี่ยนแปลงได้
            </p>
          </div>
          <div>
            <label className="block text-xs sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              เบอร์โทรศัพท์
            </label>
            <input
              readOnly
              value={user.phone || "ไม่ได้ระบุ"}
              className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg text-[var(--text-secondary)] cursor-not-allowed font-mono select-none w-full px-3.5 h-11 text-base sm:text-sm opacity-60"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              เบอร์โทรไม่สามารถเปลี่ยนได้หลังสมัคร{" "}
              <span className="text-[var(--accent)]">ติดต่อ support หากจำเป็น</span>
            </p>
          </div>
        </div>

        {/* SMS Remaining (mobile) */}
        <div className="flex items-baseline gap-1.5 sm:hidden">
          <span className="text-lg font-bold text-[var(--accent)] tabular-nums font-mono">
            {smsRemaining.toLocaleString()}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">SMS คงเหลือ</span>
        </div>

        <ProfileEditForm userId={user.id} initialName={user.name} />
      </div>
    </>
  );
}

function AccountSummary({
  user,
  smsRemaining,
}: {
  user: SettingsUser;
  smsRemaining: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-[var(--bg-surface)] border border-[rgba(var(--accent-rgb),0.12)] rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-muted)]">SMS คงเหลือ</span>
          <CreditCard className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <p className="text-2xl font-bold text-[var(--accent)]">
          {smsRemaining.toLocaleString()}
        </p>
        <Link
          href="/dashboard/packages"
          className="text-[10px] text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors mt-1 inline-block"
        >
          ซื้อแพ็กเกจ →
        </Link>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[rgba(var(--accent-rgb),0.12)] rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-muted)]">บทบาท</span>
          <Shield className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <p className="text-2xl font-bold text-[var(--accent)] capitalize">
          {user.role}
        </p>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-muted)]">API Keys</span>
          <Shield className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <Link
          href="/dashboard/api-keys"
          className="text-2xl font-bold text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
        >
          จัดการ →
        </Link>
      </div>
    </div>
  );
}

function NotificationsContent({
  notifPrefs,
  toggleNotif,
  savingId,
  apiUnavailable,
}: {
  notifPrefs: NotifPref[];
  toggleNotif: (id: string, channel: "email" | "sms") => void;
  savingId: string | null;
  apiUnavailable: boolean;
}) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
          <Bell size={16} className="text-[var(--accent)]" />
        </div>
        การแจ้งเตือน
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-6 ml-[42px]">
        เลือกช่องทางรับการแจ้งเตือน
      </p>

      {apiUnavailable && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-[rgba(var(--warning-rgb,245,158,11),0.08)] border border-[rgba(var(--warning-rgb,245,158,11),0.15)]">
          <p className="text-xs text-[var(--warning,#f59e0b)]">
            การตั้งค่าจะไม่ถูกบันทึก — ระบบยังไม่พร้อม
          </p>
        </div>
      )}

      {/* Column Headers */}
      <div className="flex items-center gap-4 mb-3 px-4">
        <div className="flex-1" />
        <div className="w-16 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            อีเมล
          </span>
        </div>
        <div className="w-16 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            SMS
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {notifPrefs.map((pref) => {
          const Icon = pref.icon;
          return (
            <div
              key={pref.id}
              className="flex items-center gap-4 rounded-lg px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {pref.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {pref.description}
                  </p>
                </div>
              </div>
              <div className="w-16 flex justify-center">
                <Switch
                  checked={pref.email}
                  onCheckedChange={() => toggleNotif(pref.id, "email")}
                  disabled={pref.id === "security_alert" || savingId === `${pref.id}:email`}
                  aria-label={`${pref.label} — อีเมล${pref.id === "security_alert" ? " (ปิดไม่ได้)" : ""}`}
                  className={savingId === `${pref.id}:email` ? "opacity-50" : ""}
                />
              </div>
              <div className="w-16 flex justify-center">
                <Switch
                  checked={pref.sms}
                  onCheckedChange={() => toggleNotif(pref.id, "sms")}
                  disabled={savingId === `${pref.id}:sms`}
                  aria-label={`${pref.label} — SMS`}
                  className={savingId === `${pref.id}:sms` ? "opacity-50" : ""}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-5 ml-4">
        การแจ้งเตือนด้านความปลอดภัยทางอีเมลไม่สามารถปิดได้
      </p>
    </div>
  );
}

function DangerZone() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8 border-[rgba(var(--error-rgb,239,68,68),0.1)]">
      <h2 className="text-base font-semibold text-[var(--error)] mb-2 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(var(--error-rgb,239,68,68),0.08)] border border-[rgba(var(--error-rgb,239,68,68),0.1)] flex items-center justify-center">
          <AlertTriangle size={16} className="text-[var(--error)]" />
        </div>
        Danger Zone
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        การลบบัญชีจะลบข้อมูลทั้งหมดอย่างถาวร
      </p>
      <button
        type="button"
        disabled
        className="px-4 py-2 rounded-lg text-xs font-medium bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)] opacity-70 border border-[rgba(var(--error-rgb,239,68,68),0.1)] cursor-not-allowed"
      >
        ลบบัญชี (ติดต่อแอดมิน)
      </button>
    </div>
  );
}

/* ─── Main Component ─── */

export default function SettingsContent({
  user,
  smsRemaining,
  forceChange,
}: {
  user: SettingsUser;
  smsRemaining: number;
  forceChange?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF_PREFS);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch notification preferences from API on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchNotifPrefs() {
      try {
        const res = await fetch("/api/v1/settings/notifications");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setNotifPrefs((prev) =>
            prev.map((pref) => {
              const remote = data.find((d: { id: string }) => d.id === pref.id);
              if (remote) {
                return { ...pref, email: remote.email, sms: remote.sms };
              }
              return pref;
            })
          );
        }
      } catch {
        if (!cancelled) {
          setApiUnavailable(true);
        }
      }
    }
    fetchNotifPrefs();
    return () => { cancelled = true; };
  }, []);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = TABS.length - 1;
      }

      if (nextIndex !== null) {
        setActiveTab(TABS[nextIndex].id);
        tabRefs.current[nextIndex]?.focus();
      }
    },
    [activeTab],
  );

  const memberSince = formatThaiDateOnly(user.createdAt.toISOString());

  async function toggleNotif(id: string, channel: "email" | "sms") {
    // Security email alerts cannot be disabled
    if (id === "security_alert" && channel === "email") return;

    const savingKey = `${id}:${channel}`;
    const prev = notifPrefs;

    // Optimistic update
    setNotifPrefs((prefs) =>
      prefs.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p))
    );

    if (apiUnavailable) return;

    setSavingId(savingKey);
    try {
      const updated = prev.find((p) => p.id === id);
      if (!updated) return;
      const newValue = !updated[channel];

      const res = await fetch("/api/v1/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [channel]: newValue }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // Revert on failure
      setNotifPrefs(prev);
      toast.error("บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageLayout>
      {forceChange && <ForceChangeModal userId={user.id} />}

      <PageHeader
        title="ตั้งค่า"
        description="จัดการบัญชีและข้อมูลส่วนตัว"
      />

      {/* ═══════════════════════════════════════════
          MOBILE LAYOUT (< md) — Accordion pattern
          ═══════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Profile — always open */}
        <div className="bg-[var(--bg-surface)] border-y border-[var(--border-default)] -mx-4 px-4 py-5 mb-[2px]">
          <ProfileCard user={user} smsRemaining={smsRemaining} memberSince={memberSince} />
        </div>

        {/* Accordion sections */}
        <SettingsAccordion
          items={[
            {
              id: "password",
              icon: <Lock className="w-[18px] h-[18px] text-[var(--accent)]" />,
              label: "เปลี่ยนรหัสผ่าน",
              content: <PasswordChangeForm />,
            },
            {
              id: "2fa",
              icon: <Shield className="w-[18px] h-[18px] text-[var(--accent)]" />,
              label: "2FA",
              content: <TwoFactorSection />,
            },
            {
              id: "tax",
              icon: <FileText className="w-[18px] h-[18px] text-[var(--accent)]" />,
              label: "ข้อมูลภาษี",
              content: <TaxProfileSection />,
            },
            {
              id: "sending-hours",
              icon: <Clock className="w-[18px] h-[18px] text-[var(--accent)]" />,
              label: "เวลาส่ง SMS",
              content: <SendingHoursSection />,
            },
            {
              id: "sessions",
              icon: <Globe className="w-[18px] h-[18px] text-[var(--accent)]" />,
              label: "เซสชัน",
              content: <SessionsSection />,
            },
            {
              id: "notifications",
              icon: <Bell className="w-[18px] h-[18px] text-[var(--accent)]" />,
              label: "การแจ้งเตือน",
              content: (
                <NotificationsContent
                  notifPrefs={notifPrefs}
                  toggleNotif={toggleNotif}
                  savingId={savingId}
                  apiUnavailable={apiUnavailable}
                />
              ),
            },
          ]}
        />

        {/* Quick Links */}
        <MobileQuickLinks />

        {/* Danger Zone */}
        <DangerZone />
      </div>

      {/* ═══════════════════════════════════════════
          DESKTOP LAYOUT (≥ md) — Tab pattern
          ═══════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="การตั้งค่า"
          className="flex items-center gap-1 border-b border-[var(--border-default)] mb-6"
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[index] = el; }}
                type="button"
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`settings-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={handleTabKeyDown}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px ${
                  isActive
                    ? "text-[var(--accent)] border-[var(--accent)]"
                    : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div role="tabpanel" id="settings-panel-profile" aria-labelledby="settings-tab-profile">
              <div className="space-y-6">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8">
                  <ProfileCard user={user} smsRemaining={smsRemaining} memberSince={memberSince} />
                </div>
                <AccountSummary user={user} smsRemaining={smsRemaining} />
                <TaxProfileSection />
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div role="tabpanel" id="settings-panel-security" aria-labelledby="settings-tab-security">
              <div className="space-y-6">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8">
                  <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
                      <Shield size={16} className="text-[var(--accent)]" />
                    </div>
                    เปลี่ยนรหัสผ่าน
                  </h2>
                  <PasswordChangeForm />
                </div>
                <TwoFactorSection />
                <SendingHoursSection />
                <DangerZone />
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div role="tabpanel" id="settings-panel-sessions" aria-labelledby="settings-tab-sessions">
              <SessionsSection />
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div role="tabpanel" id="settings-panel-notifications" aria-labelledby="settings-tab-notifications">
              <NotificationsContent
                notifPrefs={notifPrefs}
                toggleNotif={toggleNotif}
                savingId={savingId}
                apiUnavailable={apiUnavailable}
              />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
