"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import type { Locale } from "@/lib/i18n/config";

const LOCALE_LABELS: Record<Locale, string> = {
  th: "TH",
  en: "EN",
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const nextLocale: Locale = locale === "th" ? "en" : "th";

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer hover:bg-[rgba(var(--accent-rgb),0.08)]"
      style={{ color: "var(--text-secondary)" }}
      aria-label={`Switch language to ${LOCALE_LABELS[nextLocale]}`}
    >
      <Globe className="size-3.5" />
      <span>{LOCALE_LABELS[locale]}</span>
    </button>
  );
}
