"use client";

import { WifiOff, AlertTriangle, Clock, FileQuestion, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorType = "NETWORK_ERROR" | "SERVER_ERROR" | "TIMEOUT" | "NOT_FOUND" | "PERMISSION";

const ERROR_CONFIG: Record<ErrorType, {
  icon: typeof WifiOff;
  bg: string;
  color: string;
  title: string;
  description: string;
}> = {
  NETWORK_ERROR: {
    icon: WifiOff,
    bg: "rgba(var(--warning-rgb,245,158,11),0.08)",
    color: "var(--warning)",
    title: "ไม่สามารถเชื่อมต่อได้",
    description: "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่",
  },
  SERVER_ERROR: {
    icon: AlertTriangle,
    bg: "rgba(var(--error-rgb,239,68,68),0.08)",
    color: "var(--error)",
    title: "เกิดข้อผิดพลาด",
    description: "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง",
  },
  TIMEOUT: {
    icon: Clock,
    bg: "rgba(var(--warning-rgb,245,158,11),0.08)",
    color: "var(--warning)",
    title: "หมดเวลาการเชื่อมต่อ",
    description: "การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่",
  },
  NOT_FOUND: {
    icon: FileQuestion,
    bg: "rgba(var(--text-muted-rgb,107,112,117),0.08)",
    color: "var(--text-muted)",
    title: "ไม่พบข้อมูล",
    description: "ไม่พบหน้าหรือข้อมูลที่ต้องการ",
  },
  PERMISSION: {
    icon: ShieldAlert,
    bg: "rgba(var(--error-rgb,239,68,68),0.08)",
    color: "var(--error)",
    title: "ไม่มีสิทธิ์เข้าถึง",
    description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ",
  },
};

export function getErrorType(error: Error): ErrorType {
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("fetch") || msg.includes("network")) return "NETWORK_ERROR";
  if (msg.includes("timeout")) return "TIMEOUT";
  if (msg.includes("404") || msg.includes("not found")) return "NOT_FOUND";
  if (msg.includes("403") || msg.includes("permission") || msg.includes("unauthorized")) return "PERMISSION";
  return "SERVER_ERROR";
}

export function ErrorState({
  type = "SERVER_ERROR",
  onRetry,
}: {
  type?: ErrorType;
  onRetry?: () => void;
}) {
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[300px] px-10 py-10">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-lg mb-5"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={24} style={{ color: config.color }} />
      </div>
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">
        {config.title}
      </h2>
      <p className="text-[13px] text-[var(--text-muted)] max-w-[320px] mb-5">
        {config.description}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw size={14} />
          ลองใหม่
        </Button>
      )}
    </div>
  );
}

export function SectionErrorFallback({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-6 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
      <AlertTriangle size={20} className="text-[var(--error)] shrink-0" />
      <p className="text-[13px] text-[var(--text-body)]">
        {message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่"}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-auto gap-1.5">
          <RefreshCw size={14} />
          ลองใหม่
        </Button>
      )}
    </div>
  );
}
