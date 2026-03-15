"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { StateDisplay } from "@/components/ui/state-display";

export default function OfflinePage() {
  return (
    <div className="bg-[var(--bg-base)]">
      <StateDisplay
        icon={WifiOff}
        iconColor="var(--text-muted)"
        iconBg="rgba(var(--text-muted-rgb),0.08)"
        title="ไม่มีการเชื่อมต่ออินเทอร์เน็ต"
        description="กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง"
        primaryAction={{
          label: "ลองใหม่",
          icon: RefreshCw,
          onClick: () => window.location.reload(),
        }}
        size="lg"
      />
    </div>
  );
}
