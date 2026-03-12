"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "cookie-consent";

function getStoredPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored) {
      // Small delay so the slide-up animation is visible
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  }, []);

  const handleSaveSettings = useCallback(() => {
    savePreferences({
      necessary: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  }, [analytics, marketing]);

  // Don't render anything server-side or when dismissed
  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 inset-x-0 z-[9999]",
        "transition-transform duration-500 ease-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div
        className="mx-auto max-w-3xl px-4 pb-4 sm:px-6"
      >
        <div
          className={cn(
            "rounded-xl border p-5 shadow-2xl backdrop-blur-sm",
            "animate-in slide-in-from-bottom-4 duration-500"
          )}
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          {/* Header text */}
          <p
            className="text-sm leading-relaxed sm:text-base"
            style={{ color: "var(--text-primary)" }}
          >
            🍪 เว็บไซต์นี้ใช้ Cookie เพื่อปรับปรุงประสบการณ์การใช้งาน
            {" "}อ่านเพิ่มเติมที่{" "}
            <Link
              href="/cookie-policy"
              className="underline underline-offset-2 transition-colors hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              นโยบาย Cookie
            </Link>
          </p>

          {/* Granular settings (expandable) */}
          {showSettings && (
            <div
              className={cn(
                "mt-4 space-y-3 rounded-lg border p-4",
                "animate-in fade-in slide-in-from-top-2 duration-300"
              )}
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              {/* Necessary — always on */}
              <label className="flex items-center justify-between gap-3">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  จำเป็น (Necessary)
                </span>
                <ToggleSwitch checked disabled />
              </label>

              {/* Analytics */}
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  วิเคราะห์ (Analytics)
                </span>
                <ToggleSwitch
                  checked={analytics}
                  onChange={() => setAnalytics((v) => !v)}
                />
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  การตลาด (Marketing)
                </span>
                <ToggleSwitch
                  checked={marketing}
                  onChange={() => setMarketing((v) => !v)}
                />
              </label>

              <button
                type="button"
                onClick={handleSaveSettings}
                className={cn(
                  "mt-2 w-full rounded-lg px-4 py-2 text-sm font-semibold",
                  "transition-all duration-200",
                  "hover:brightness-110 active:scale-[0.98]"
                )}
                style={{
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                }}
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Accept all — primary */}
            <button
              type="button"
              onClick={handleAcceptAll}
              className={cn(
                "rounded-lg px-5 py-2.5 text-sm font-semibold",
                "transition-all duration-200",
                "hover:brightness-110 active:scale-[0.98]",
                "shadow-lg"
              )}
              style={{
                background: "var(--accent)",
                color: "var(--text-on-accent)",
                boxShadow: "0 0 20px rgba(var(--accent-rgb), 0.25)",
              }}
            >
              ยอมรับทั้งหมด
            </button>

            {/* Reject — outline */}
            <button
              type="button"
              onClick={handleReject}
              className={cn(
                "rounded-lg border px-5 py-2.5 text-sm font-semibold",
                "transition-all duration-200",
                "hover:brightness-125 active:scale-[0.98]"
              )}
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
            >
              ปฏิเสธ
            </button>

            {/* Settings — ghost/link */}
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-medium",
                "transition-all duration-200",
                "hover:underline"
              )}
              style={{
                color: "var(--text-muted)",
                background: "transparent",
              }}
            >
              {showSettings ? "ซ่อนการตั้งค่า" : "ตั้งค่า"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Toggle Switch (internal) ── */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-60"
      )}
      style={{
        background: checked ? "var(--accent)" : "var(--bg-muted)",
      }}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full shadow-md",
          "transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
        style={{
          background: checked ? "var(--text-on-accent)" : "var(--text-secondary)",
          marginTop: "2px",
        }}
      />
    </button>
  );
}
