"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_KEY = "smsok_tour_completed";
const SHOW_TOUR_KEY = "smsok_show_tour";

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[href="/dashboard/send"]',
    title: "ส่ง SMS",
    description: "ส่ง SMS ไปยังลูกค้าของคุณได้ที่นี่ รองรับทั้งส่งทีละเบอร์และส่งแบบกลุ่ม",
    position: "right",
  },
  {
    selector: '[href="/dashboard/messages"]',
    title: "ประวัติการส่ง",
    description: "ตรวจสอบสถานะการส่ง SMS ทั้งหมด — ส่งสำเร็จ, ล้มเหลว, รอดำเนินการ",
    position: "right",
  },
  {
    selector: '[href="/dashboard/campaigns"]',
    title: "แคมเปญ",
    description: "สร้างแคมเปญ SMS เพื่อส่งข้อความไปยังกลุ่มเป้าหมายพร้อมกัน",
    position: "right",
  },
  {
    selector: '[href="/dashboard/contacts"]',
    title: "รายชื่อผู้ติดต่อ",
    description: "จัดการรายชื่อผู้รับ SMS ของคุณ นำเข้าจาก CSV หรือเพิ่มทีละรายชื่อ",
    position: "right",
  },
  {
    selector: '[href="/dashboard/billing/packages"]',
    title: "ซื้อแพ็กเกจ",
    description: "เลือกแพ็กเกจ SMS ที่เหมาะกับธุรกิจของคุณ พร้อมราคาพิเศษสำหรับแพ็กเกจใหญ่",
    position: "right",
  },
];

export default function DashboardTour() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Check if tour should show
  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_KEY);
    const showTour = localStorage.getItem(SHOW_TOUR_KEY);

    if (showTour === "true" && tourCompleted !== "true") {
      // Small delay so dashboard renders first
      const timer = setTimeout(() => {
        setActive(true);
        localStorage.removeItem(SHOW_TOUR_KEY);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const positionTooltip = useCallback(() => {
    if (!active) return;

    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.selector);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setHighlightRect(rect);

    const tooltipWidth = 300;
    const tooltipHeight = 160;
    const gap = 12;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
    }

    // Keep within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

    setTooltipPos({ top, left });
  }, [active, currentStep]);

  useEffect(() => {
    positionTooltip();

    const handleResize = () => positionTooltip();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [positionTooltip]);

  // Scroll element into view
  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [active, currentStep]);

  function handleNext() {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleDismiss() {
    setActive(false);
    localStorage.setItem(TOUR_KEY, "true");
  }

  if (!active) return null;

  const step = TOUR_STEPS[currentStep];

  return createPortal(
    <>
      {/* Overlay with spotlight cutout */}
      <div
        className="fixed inset-0 z-[100] transition-opacity duration-300"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={handleDismiss}
      />

      {/* Highlight ring */}
      {highlightRect && (
        <div
          className="fixed z-[101] pointer-events-none rounded-lg transition-all duration-300"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            border: "2px solid var(--accent)",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(var(--accent-rgb), 0.3)",
            backgroundColor: "transparent",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[102] w-[300px] rounded-lg p-5 shadow-xl transition-all duration-300"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded transition-colors hover:opacity-70 cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          aria-label="ปิดทัวร์"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <h3 className="text-sm font-bold mb-1.5 pr-6" style={{ color: "var(--accent)" }}>
          {step.title}
        </h3>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          {step.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack} className="h-8 px-3 text-xs">
                <ChevronLeft className="w-3 h-3 mr-1" />
                ก่อนหน้า
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="h-8 px-3 text-xs"
              style={{ backgroundColor: "var(--accent)", color: "var(--text-on-accent)" }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? "เริ่มใช้งาน" : "ถัดไป"}
              {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
