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
  Camera,
  Building2,
  Key,
  Webhook,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import CustomSelect from "@/components/ui/CustomSelect";
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

type Tab = "profile" | "security" | "billing" | "api-keys" | "webhooks" | "notifications";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  companyName?: string | null;
  timezone?: string | null;
  avatarUrl?: string | null;
};

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "โปรไฟล์", icon: User },
  { id: "security", label: "ความปลอดภัย", icon: Shield },
  { id: "billing", label: "การเงิน", icon: CreditCard },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Bangkok", label: "Asia/Bangkok (GMT+7)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (GMT+8)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4)" },
  { value: "Europe/London", label: "Europe/London (GMT+0)" },
  { value: "America/New_York", label: "America/New York (GMT-5)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (GMT-8)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (GMT+11)" },
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
  companyName,
  onCompanyNameChange,
  timezone,
  onTimezoneChange,
  avatarPreview,
  onAvatarChange,
  onSaveCompany,
  savingCompany,
}: {
  user: SettingsUser;
  smsRemaining: number;
  memberSince: string;
  companyName: string;
  onCompanyNameChange: (v: string) => void;
  timezone: string;
  onTimezoneChange: (v: string) => void;
  avatarPreview: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveCompany: () => void;
  savingCompany: boolean;
}) {
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Avatar + Info */}
      <div className="flex items-center gap-3.5 sm:gap-5 pb-4 border-b border-[rgba(43,53,64,0.5)] mb-4">
        {/* Avatar with upload overlay */}
        <div className="relative group shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent-secondary)]/20 border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
                {initials}
              </span>
            )}
          </div>
          <label className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onAvatarChange}
            />
          </label>
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

        {/* Company Info Section */}
        <div className="pt-4 border-t border-[rgba(43,53,64,0.5)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--accent)]" />
            ข้อมูลบริษัท
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
                ชื่อบริษัท / องค์กร
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                placeholder="บริษัท ตัวอย่าง จำกัด"
                className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full px-3.5 h-11 text-base sm:text-sm focus:border-[rgba(var(--accent-rgb),0.6)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
                เขตเวลา
              </label>
              <CustomSelect
                value={timezone}
                onChange={onTimezoneChange}
                options={TIMEZONE_OPTIONS}
                placeholder="เลือกเขตเวลา..."
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={onSaveCompany}
              disabled={savingCompany}
              className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {savingCompany ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกข้อมูลบริษัท"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Placeholder Tab for upcoming sections ─── */
function ComingSoonTab({
  icon: Icon,
  title,
  description,
  linkHref,
  linkLabel,
}: {
  icon: typeof Key;
  title: string;
  description: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-8 text-center">
      <div className="w-14 h-14 rounded-xl bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.12)] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-[var(--accent)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] mb-5 max-w-md mx-auto">{description}</p>
      <Link
        href={linkHref}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent)] text-[var(--bg-base)] hover:opacity-90 transition-opacity"
      >
        {linkLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
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
          href="/dashboard/billing/packages"
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

function NotifSkeleton() {
  return (
    <div className="space-y-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg px-4 py-3.5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-4 h-4 rounded bg-[var(--border-default)] animate-pulse shrink-0" />
            <div className="min-w-0 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[var(--border-default)] animate-pulse" />
              <div className="h-2.5 w-44 rounded bg-[var(--border-default)] animate-pulse" />
            </div>
          </div>
          <div className="w-16 flex justify-center">
            <div className="h-5 w-9 rounded-full bg-[var(--border-default)] animate-pulse" />
          </div>
          <div className="w-16 flex justify-center">
            <div className="h-5 w-9 rounded-full bg-[var(--border-default)] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsContent({
  notifPrefs,
  toggleNotif,
  savingId,
  loading,
  apiUnavailable,
}: {
  notifPrefs: NotifPref[];
  toggleNotif: (id: string, channel: "email" | "sms") => void;
  savingId: string | null;
  loading: boolean;
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
          <p className="text-xs text-[var(--warning-amber)]">
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

      {loading ? <NotifSkeleton /> : (
        <div className="space-y-1">
          {notifPrefs.map((pref) => {
            const Icon = pref.icon;
            const savingEmail = savingId === `${pref.id}:email`;
            const savingSms   = savingId === `${pref.id}:sms`;
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
                    disabled={pref.id === "security_alert" || savingEmail}
                    aria-label={`${pref.label} — อีเมล${pref.id === "security_alert" ? " (ปิดไม่ได้)" : ""}`}
                    className={`transition-opacity ${savingEmail ? "opacity-40 cursor-wait" : ""}`}
                  />
                </div>
                <div className="w-16 flex justify-center">
                  <Switch
                    checked={pref.sms}
                    onCheckedChange={() => toggleNotif(pref.id, "sms")}
                    disabled={savingSms}
                    aria-label={`${pref.label} — SMS`}
                    className={`transition-opacity ${savingSms ? "opacity-40 cursor-wait" : ""}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] mt-5 ml-4">
        การแจ้งเตือนด้านความปลอดภัยทางอีเมลไม่สามารถปิดได้
      </p>
    </div>
  );
}

// ── Push Notification Opt-In ──

function PushNotificationOptIn() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  async function handleEnable() {
    if (!("Notification" in window)) {
      toast.error("เบราว์เซอร์นี้ไม่รองรับ Push Notification");
      return;
    }
    setSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("เปิดการแจ้งเตือนเรียบร้อย");
      } else if (result === "denied") {
        toast.error("การแจ้งเตือนถูกปิด กรุณาเปิดในการตั้งค่าเบราว์เซอร์");
      }
    } catch {
      toast.error("ไม่สามารถขออนุญาตได้");
    } finally {
      setSubscribing(false);
    }
  }

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";
  const isUnsupported = permission === "unsupported";

  return (
    <div
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8"
    >
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
          <Globe size={16} className="text-[var(--accent)]" />
        </div>
        Push Notification
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-5 ml-[42px]">
        รับการแจ้งเตือนผ่านเบราว์เซอร์แม้ไม่ได้เปิดเว็บไซต์
      </p>

      <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: isGranted ? "rgba(var(--success-rgb),0.1)" : "rgba(var(--text-muted-rgb),0.08)",
            }}
          >
            <Bell
              size={18}
              style={{
                color: isGranted ? "var(--success)" : "var(--text-muted)",
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {isGranted ? "เปิดอยู่" : isDenied ? "ถูกบล็อก" : isUnsupported ? "ไม่รองรับ" : "ปิดอยู่"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {isGranted
                ? "คุณจะได้รับแจ้งเตือนผ่านเบราว์เซอร์"
                : isDenied
                ? "กรุณาเปิดใหม่ในการตั้งค่าเบราว์เซอร์"
                : isUnsupported
                ? "เบราว์เซอร์นี้ไม่รองรับ Push Notification"
                : "เปิดเพื่อรับแจ้งเตือนแม้ไม่ได้เปิดเว็บ"}
            </p>
          </div>
        </div>

        {!isGranted && !isDenied && !isUnsupported && (
          <button
            type="button"
            onClick={handleEnable}
            disabled={subscribing}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0"
            style={{
              background: "var(--accent)",
              color: "var(--bg-base)",
            }}
          >
            {subscribing ? "กำลังขออนุญาต..." : "เปิดการแจ้งเตือน"}
          </button>
        )}

        {isGranted && (
          <span className="text-xs font-medium text-[var(--success)] flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
            Active
          </span>
        )}
      </div>
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
  const [notifLoading, setNotifLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Profile: company info, avatar, timezone
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [timezone, setTimezone] = useState(user.timezone ?? "Asia/Bangkok");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null);
  const [savingCompany, setSavingCompany] = useState(false);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Compress via canvas to max 256x256, JPEG 80%
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX = 256;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.8);
        setAvatarPreview(compressed);
        // Upload to server
        try {
          const res = await fetch("/api/v1/settings/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarUrl: compressed }),
          });
          if (!res.ok) throw new Error("upload failed");
          toast.success("อัปเดตรูปโปรไฟล์แล้ว");
        } catch {
          toast.error("ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่");
          setAvatarPreview(null);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSaveCompany = useCallback(async () => {
    setSavingCompany(true);
    try {
      const res = await fetch("/api/v1/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), timezone }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("บันทึกข้อมูลบริษัทสำเร็จ");
    } catch {
      toast.error("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง");
    } finally {
      setSavingCompany(false);
    }
  }, [companyName, timezone]);

  // Fetch notification preferences from API on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchNotifPrefs() {
      try {
        const res = await fetch("/api/v1/settings/notifications");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          if (Array.isArray(data)) {
            setNotifPrefs((prev) =>
              prev.map((pref) => {
                const remote = data.find((d: { id: string }) => d.id === pref.id);
                if (remote) {
                  return {
                    ...pref,
                    ...(remote.email !== undefined && { email: remote.email }),
                    ...(remote.sms   !== undefined && { sms:   remote.sms }),
                  };
                }
                return pref;
              })
            );
          }
          setNotifLoading(false);
        }
      } catch {
        if (!cancelled) {
          setApiUnavailable(true);
          setNotifLoading(false);
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

  const memberSince = formatThaiDateOnly(user.createdAt);

  async function toggleNotif(id: string, channel: "email" | "sms") {
    // Security email alerts cannot be disabled
    if (id === "security_alert" && channel === "email") return;

    const savingKey = `${id}:${channel}`;

    // Prevent double-click while saving
    if (savingId === savingKey) return;

    const prev = notifPrefs;
    const current = prev.find((p) => p.id === id);
    if (!current) return;

    const newValue = !current[channel];

    // Optimistic update
    setNotifPrefs((prefs) =>
      prefs.map((p) => (p.id === id ? { ...p, [channel]: newValue } : p))
    );

    if (apiUnavailable) return;

    setSavingId(savingKey);
    try {
      const res = await fetch("/api/v1/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [channel]: newValue }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("บันทึกการตั้งค่าแล้ว");
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
          <ProfileCard
            user={user}
            smsRemaining={smsRemaining}
            memberSince={memberSince}
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            timezone={timezone}
            onTimezoneChange={setTimezone}
            avatarPreview={avatarPreview}
            onAvatarChange={handleAvatarChange}
            onSaveCompany={handleSaveCompany}
            savingCompany={savingCompany}
          />
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
                  loading={notifLoading}
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
                  <ProfileCard
                    user={user}
                    smsRemaining={smsRemaining}
                    memberSince={memberSince}
                    companyName={companyName}
                    onCompanyNameChange={setCompanyName}
                    timezone={timezone}
                    onTimezoneChange={setTimezone}
                    avatarPreview={avatarPreview}
                    onAvatarChange={handleAvatarChange}
                    onSaveCompany={handleSaveCompany}
                    savingCompany={savingCompany}
                  />
                </div>
                <AccountSummary user={user} smsRemaining={smsRemaining} />
                <SendingHoursSection />
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
                      <Lock size={16} className="text-[var(--accent)]" />
                    </div>
                    เปลี่ยนรหัสผ่าน
                  </h2>
                  <PasswordChangeForm />
                </div>
                <TwoFactorSection />
                <SessionsSection />
                <DangerZone />
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div role="tabpanel" id="settings-panel-billing" aria-labelledby="settings-tab-billing">
              <div className="space-y-6">
                <TaxProfileSection />
                <ComingSoonTab
                  icon={CreditCard}
                  title="ข้อมูลการเงินและแพ็กเกจ"
                  description="ดูแพ็กเกจปัจจุบัน ประวัติการชำระเงิน ใบกำกับภาษี และตั้งค่าการเติมเงินอัตโนมัติ"
                  linkHref="/dashboard/billing"
                  linkLabel="ไปหน้าการเงิน"
                />
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "api-keys" && (
            <div role="tabpanel" id="settings-panel-api-keys" aria-labelledby="settings-tab-api-keys">
              <ComingSoonTab
                icon={Key}
                title="จัดการ API Keys"
                description="สร้าง จัดการ และดูสถิติการใช้งาน API Keys ของคุณ"
                linkHref="/dashboard/api-keys"
                linkLabel="ไปหน้า API Keys"
              />
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === "webhooks" && (
            <div role="tabpanel" id="settings-panel-webhooks" aria-labelledby="settings-tab-webhooks">
              <ComingSoonTab
                icon={Webhook}
                title="จัดการ Webhooks"
                description="ตั้งค่า webhook endpoints สำหรับรับการแจ้งเตือน events ต่างๆ จากระบบ"
                linkHref="/dashboard/webhooks"
                linkLabel="ไปหน้า Webhooks"
              />
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div role="tabpanel" id="settings-panel-notifications" aria-labelledby="settings-tab-notifications" className="space-y-6">
              <NotificationsContent
                notifPrefs={notifPrefs}
                toggleNotif={toggleNotif}
                savingId={savingId}
                loading={notifLoading}
                apiUnavailable={apiUnavailable}
              />
              <PushNotificationOptIn />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
