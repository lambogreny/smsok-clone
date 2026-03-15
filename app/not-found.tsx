"use client";

import { Search, ArrowLeft } from "lucide-react";
import { StateDisplay } from "@/components/ui/state-display";

export default function NotFound() {
  return (
    <div className="bg-[var(--bg-base)]">
      <StateDisplay
        icon={Search}
        iconColor="var(--accent-blue)"
        iconBg="rgba(var(--accent-blue-rgb),0.08)"
        errorCode="404"
        title="ไม่พบหน้าที่คุณต้องการ"
        description="หน้านี้อาจถูกย้ายหรือลบไปแล้ว"
        primaryAction={{
          label: "กลับหน้าหลัก",
          icon: ArrowLeft,
          href: "/dashboard",
        }}
        secondaryAction={{
          label: "ค้นหาหน้าอื่น",
          href: "/",
        }}
        size="lg"
      />
      <div className="fixed bottom-8 left-0 right-0 flex items-center justify-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">SMSOK</span>
      </div>
    </div>
  );
}
