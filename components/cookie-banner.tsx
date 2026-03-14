"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Cookie, Megaphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const STORAGE_KEY = "cookie-consent";

function getStoredPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

async function syncConsentLogging(prefs: CookiePreferences) {
  try {
    // Skip API call for anonymous users — consent is stored locally only
    const authToken = document.cookie.includes("auth-token");
    if (!authToken) return;

    const response = await fetch("/api/v1/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        consents: [
          {
            consentType: "COOKIE",
            action: prefs.analytics ? "OPT_IN" : "OPT_OUT",
          },
          {
            consentType: "MARKETING",
            action: prefs.marketing ? "OPT_IN" : "OPT_OUT",
          },
        ],
      }),
    });

    if (!response.ok && response.status !== 401 && response.status !== 403) {
      throw new Error(`Consent sync failed with ${response.status}`);
    }
  } catch {
    // Consent preferences still persist locally for anonymous visitors.
  }
}

function buildPreferences(analytics: boolean, marketing: boolean): CookiePreferences {
  return {
    necessary: true,
    analytics,
    marketing,
    timestamp: new Date().toISOString(),
  };
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored) {
      const frame = window.requestAnimationFrame(() => {
        setAnalytics(stored.analytics);
        setMarketing(stored.marketing);
        setHydrated(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
      setHydrated(true);
    }, 240);

    return () => window.clearTimeout(timer);
  }, []);

  async function applyPreferences(nextAnalytics: boolean, nextMarketing: boolean) {
    const prefs = buildPreferences(nextAnalytics, nextMarketing);
    savePreferences(prefs);
    setAnalytics(nextAnalytics);
    setMarketing(nextMarketing);
    setOpen(false);
    await syncConsentLogging(prefs);
  }

  if (!hydrated) return null;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="ตั้งค่าความยินยอมคุกกี้"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-5xl rounded-t-[28px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_-24px_80px_rgba(0,0,0,0.45)]"
    >
      <div className="border-b border-[var(--border-default)] px-6 py-5 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              ตั้งค่าความยินยอมคุกกี้
            </h2>
            <p className="max-w-3xl text-[13px] leading-6 text-[var(--text-secondary)]">
              เราใช้คุกกี้ที่จำเป็นต่อการทำงานของระบบเสมอ และขอความยินยอมแยกสำหรับคุกกี้วิเคราะห์การใช้งานกับการตลาด
              คุณสามารถอ่านรายละเอียดเพิ่มเติมได้ที่{" "}
              <Link href="/cookie-policy" className="font-medium text-[var(--accent-blue)] hover:text-[var(--accent)]">
                นโยบาย Cookie
              </Link>
              {" "}และ{" "}
              <Link href="/privacy" className="font-medium text-[var(--accent-blue)] hover:text-[var(--accent)]">
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-6 py-5 sm:grid-cols-3 sm:px-8">
        <section className="rounded-lg border border-[rgba(var(--accent-rgb),0.14)] bg-[rgba(var(--accent-rgb),0.05)] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Necessary</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                คุกกี้จำเป็นสำหรับการเข้าสู่ระบบ ความปลอดภัย และการทำงานหลักของระบบ
              </p>
            </div>
            <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">เปิดตลอดเวลา</span>
            <Switch checked disabled aria-label="Necessary cookies are always enabled" />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Analytics</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                ช่วยวัดการใช้งานและปรับปรุงประสบการณ์หน้าเว็บโดยไม่แตะข้อมูลที่ไม่จำเป็น
              </p>
            </div>
            <BarChart3 className="mt-0.5 h-4 w-4 text-[var(--accent-blue)]" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">อนุญาต Analytics</span>
            <Switch
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label="Allow analytics cookies"
            />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Marketing</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                ใช้สำหรับข้อเสนอ โปรโมชัน และข้อความแนะนำผลิตภัณฑ์ที่เกี่ยวข้องกับการใช้งานของคุณ
              </p>
            </div>
            <Megaphone className="mt-0.5 h-4 w-4 text-[var(--warning)]" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">อนุญาต Marketing</span>
            <Switch
              checked={marketing}
              onCheckedChange={setMarketing}
              aria-label="Allow marketing cookies"
            />
          </div>
        </section>
      </div>

      <div className="border-t border-[var(--border-default)] bg-[rgba(255,255,255,0.02)] px-6 py-4 sm:flex sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-2xl text-xs leading-5 text-[var(--text-muted)] mb-3 sm:mb-0">
          การเลือกของคุณจะถูกบันทึกในอุปกรณ์นี้ และถ้าคุณล็อกอินอยู่ ระบบจะบันทึก consent log ผ่าน API ด้วยแบบ append-only
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]"
            onClick={() => void applyPreferences(false, false)}
          >
            ปฏิเสธทั้งหมด
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.14)]"
            onClick={() => void applyPreferences(analytics, marketing)}
          >
            บันทึกการตั้งค่า
          </Button>
          <Button
            type="button"
            className="bg-[var(--accent)] text-[var(--bg-base)] hover:brightness-110"
            onClick={() => void applyPreferences(true, true)}
          >
            ยอมรับทั้งหมด
          </Button>
        </div>
      </div>
    </div>
  );
}
