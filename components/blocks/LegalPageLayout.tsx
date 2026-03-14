"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileDown,
  Printer,
  Shield,
  FileText,
  CheckCircle,
  ChevronDown,
  ReceiptText,
  Cookie,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  titleTh: string;
  titleEn: string;
  contentTh: React.ReactNode;
  contentEn: React.ReactNode;
};

const RELATED_DOCS = [
  {
    icon: Shield,
    title: "นโยบายความเป็นส่วนตัว",
    href: "/privacy",
  },
  {
    icon: FileText,
    title: "ข้อกำหนดการใช้งาน",
    href: "/terms",
  },
  {
    icon: CheckCircle,
    title: "การใช้งานที่ยอมรับได้",
    href: "/acceptable-use",
  },
  {
    icon: ReceiptText,
    title: "นโยบายการคืนเงิน",
    href: "/refund-policy",
  },
  {
    icon: Cookie,
    title: "นโยบายคุกกี้",
    href: "/cookie-policy",
  },
];

export default function LegalPageLayout({
  titleTh,
  titleEn,
  subtitleTh,
  subtitleEn,
  lastUpdated,
  sections,
  currentPath,
}: {
  titleTh: string;
  titleEn: string;
  subtitleTh?: string;
  subtitleEn?: string;
  lastUpdated: string;
  sections: Section[];
  currentPath?: string;
}) {
  const [lang, setLang] = useState<"th" | "en">("th");
  const [activeSection, setActiveSection] = useState("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMobileTocClick = (id: string) => {
    scrollTo(id);
    setMobileTocOpen(false);
  };

  return (
    <div className="legal-page min-h-screen bg-[var(--bg-base)]">
      {/* ── Header ── */}
      <header className="legal-header sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b border-[var(--border-default)] bg-[var(--bg-base)]">
        <Link
          href="/"
          className="text-[18px] font-bold text-[var(--text-primary)] tracking-tight"
        >
          SMSOK
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}>
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
            สมัครสมาชิก
          </Link>
        </div>
      </header>

      {/* ── Main Content Grid ── */}
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="legal-grid grid grid-cols-1 lg:grid-cols-[240px_1fr] py-12 gap-12">
          {/* ── Desktop TOC Sidebar ── */}
          <aside className="toc-sidebar hidden lg:block sticky top-24 max-h-[calc(100vh-128px)] overflow-y-auto">
            <p className="text-xs font-semibold uppercase mb-3 tracking-[0.05em] text-[var(--text-secondary)]">
              สารบัญ
            </p>
            <nav aria-label="สารบัญ">
              {sections.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    aria-label={`ไปยังหัวข้อ: ${lang === "th" ? s.titleTh : s.titleEn}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "block w-full text-left text-[13px] transition-colors cursor-pointer py-1.5 pl-3 border-l-2",
                      isActive
                        ? "border-[var(--accent)] text-[var(--text-primary)]"
                        : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-body)]",
                    )}
                  >
                    {lang === "th" ? s.titleTh : s.titleEn}
                  </button>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="my-4 border-t border-[var(--border-default)]" />

            {/* Actions */}
            <div className="toc-actions">
              <button
                type="button"
                onClick={() => window.print()}
                aria-label="ดาวน์โหลด PDF"
                className="flex items-center gap-1.5 text-[13px] cursor-pointer transition-opacity hover:opacity-70 mb-3 text-[var(--accent)]"
              >
                <FileDown size={14} />
                ดาวน์โหลด PDF
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                aria-label="พิมพ์เอกสาร"
                className="flex items-center gap-1.5 text-[13px] cursor-pointer transition-opacity hover:opacity-70 text-[var(--accent)]"
              >
                <Printer size={14} />
                พิมพ์
              </button>
            </div>
          </aside>

          {/* ── Content Area ── */}
          <div className="max-w-[720px]">
            {/* Page Title */}
            <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
              {lang === "th" ? titleTh : titleEn}
            </h1>

            {/* Meta */}
            <p className="text-[13px] mb-8 text-[var(--text-secondary)]">
              อัปเดตล่าสุด: {lastUpdated} &nbsp;·&nbsp; เวอร์ชัน: 1.0
            </p>

            {/* Mobile TOC */}
            <div className="toc-mobile lg:hidden mb-6">
              <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen((v) => !v)}
                  aria-expanded={mobileTocOpen}
                  aria-controls="mobile-toc-content"
                  className="flex items-center justify-between w-full px-4 py-3 text-[13px] font-medium cursor-pointer text-[var(--text-primary)]"
                >
                  <span>สารบัญ</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-[var(--text-secondary)] transition-transform duration-200",
                      mobileTocOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  id="mobile-toc-content"
                  role="region"
                  style={{
                    maxHeight: mobileTocOpen ? 400 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.25s ease",
                  }}
                >
                  <nav className="px-4 pb-3" aria-label="สารบัญ (มือถือ)">
                    {sections.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleMobileTocClick(s.id)}
                        aria-label={`ไปยังหัวข้อ: ${lang === "th" ? s.titleTh : s.titleEn}`}
                        className="block w-full text-left text-[13px] py-1.5 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-body)]"
                      >
                        {lang === "th" ? s.titleTh : s.titleEn}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="inline-flex rounded-lg overflow-hidden mb-6 bg-[var(--bg-surface)] border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setLang("th")}
                className={cn(
                  "px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                  lang === "th"
                    ? "bg-[var(--border-default)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]",
                )}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                  lang === "en"
                    ? "bg-[var(--border-default)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]",
                )}
              >
                EN
              </button>
            </div>

            {/* Sections */}
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-24"
              >
                <h2
                  className={cn(
                    "text-lg font-semibold mb-4 text-[var(--text-primary)]",
                    i > 0 && "mt-10 pt-4 border-t border-[var(--border-default)]",
                  )}
                >
                  {lang === "th" ? s.titleTh : s.titleEn}
                </h2>
                <div className="text-sm legal-content text-[var(--text-body)] leading-[1.8]">
                  {lang === "th" ? s.contentTh : s.contentEn}
                </div>
              </section>
            ))}

            {/* ── Related Documents ── */}
            <div className="legal-related-docs mt-16">
              <h3 className="text-base font-semibold mb-4 text-[var(--text-primary)]">
                เอกสารที่เกี่ยวข้อง
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {RELATED_DOCS.map((doc) => {
                  const isCurrent = currentPath === doc.href;
                  const IconComponent = doc.icon;
                  return (
                    <Link
                      key={doc.href}
                      href={isCurrent ? "#" : doc.href}
                      onClick={isCurrent ? (e) => e.preventDefault() : undefined}
                      className={cn(
                        "block rounded-lg p-5 text-center transition-all bg-[var(--bg-surface)] border",
                        isCurrent
                          ? "border-[var(--accent)] opacity-40 pointer-events-none cursor-default"
                          : "border-[var(--border-default)] hover:border-[rgba(var(--accent-rgb),0.3)] hover:-translate-y-px",
                      )}
                    >
                      <IconComponent
                        size={24}
                        className="mx-auto mb-2 text-[var(--accent)]"
                      />
                      <p className="text-sm font-semibold mb-2 text-[var(--text-primary)]">
                        {doc.title}
                      </p>
                      <span className="text-[13px] text-[var(--accent)]">
                        อ่าน →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="legal-footer flex items-center justify-between px-6 h-20 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-secondary)]">
          © 2026 SMSOK. All rights reserved.
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/privacy"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-body)] transition-colors"
          >
            นโยบายความเป็นส่วนตัว
          </Link>
          <span className="text-xs text-[var(--text-secondary)]">|</span>
          <Link
            href="/terms"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-body)] transition-colors"
          >
            ข้อกำหนด
          </Link>
          <span className="text-xs text-[var(--text-secondary)]">|</span>
          <Link
            href="/refund-policy"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-body)] transition-colors"
          >
            การคืนเงิน
          </Link>
          <span className="text-xs text-[var(--text-secondary)]">|</span>
          <Link
            href="/cookie-policy"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-body)] transition-colors"
          >
            คุกกี้
          </Link>
          <span className="text-xs text-[var(--text-secondary)]">|</span>
          <Link
            href="/dashboard/support"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-body)] transition-colors"
          >
            ติดต่อเรา
          </Link>
        </div>
      </footer>
    </div>
  );
}
