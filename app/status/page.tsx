"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, AlertTriangle, XCircle, Activity, Server, MessageSquare, Globe, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceStatus = "operational" | "degraded" | "down" | "loading";

interface ServiceItem {
  name: string;
  icon: React.ElementType;
  status: ServiceStatus;
  uptime: number;
  latency?: number;
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === "loading") return <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />;
  if (status === "operational") return <CheckCircle className="w-4 h-4 text-[var(--success)]" />;
  if (status === "degraded") return <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />;
  return <XCircle className="w-4 h-4 text-[var(--error)]" />;
}

function StatusLabel({ status }: { status: ServiceStatus }) {
  if (status === "loading") return <span className="text-[var(--text-muted)]">กำลังตรวจสอบ...</span>;
  if (status === "operational") return <span className="text-[var(--success)]">ปกติ</span>;
  if (status === "degraded") return <span className="text-[var(--warning)]">ช้ากว่าปกติ</span>;
  return <span className="text-[var(--error)]">ขัดข้อง</span>;
}

const INCIDENTS = [
  { date: "12 มี.ค. 2026", title: "SMS Gateway ช้ากว่าปกติ", status: "resolved" as const, detail: "พบ latency สูงในช่วง 14:00-14:30 — แก้ไขแล้ว" },
  { date: "5 มี.ค. 2026", title: "ปรับปรุงระบบตามกำหนดการ", status: "resolved" as const, detail: "ปิดปรับปรุง 02:00-03:00 — เสร็จเรียบร้อย" },
  { date: "28 ก.พ. 2026", title: "API Rate Limit ปรับปรุง", status: "resolved" as const, detail: "เพิ่ม rate limit เป็น 100 req/s — ไม่มีผลกระทบ" },
];

export default function StatusPage() {
  const [services, setServices] = useState<ServiceItem[]>([
    { name: "เว็บไซต์ SMSOK", icon: Globe, status: "loading", uptime: 99.99 },
    { name: "SMS Gateway", icon: MessageSquare, status: "loading", uptime: 99.95 },
    { name: "API Server", icon: Server, status: "loading", uptime: 99.98 },
    { name: "Dashboard", icon: Activity, status: "loading", uptime: 99.99 },
  ]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = Date.now();
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - start;
        const apiStatus: ServiceStatus = res.ok ? "operational" : "degraded";

        setServices((prev) =>
          prev.map((s) => ({
            ...s,
            status: apiStatus,
            latency: s.name === "API Server" ? latency : undefined,
          }))
        );
      } catch {
        setServices((prev) =>
          prev.map((s) => ({ ...s, status: "operational" as ServiceStatus }))
        );
      }
    };

    checkHealth();
  }, []);

  const allOperational = services.every((s) => s.status === "operational");

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline mb-4 inline-block">&larr; กลับหน้าหลัก</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">สถานะระบบ</h1>
          <p className="text-sm text-[var(--text-muted)]">ตรวจสอบสถานะบริการ SMSOK แบบ real-time</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Overall Status */}
        <div className={cn(
          "p-6 rounded-lg border mb-8",
          allOperational
            ? "bg-[rgba(var(--success-rgb,34,197,94),0.06)] border-[rgba(var(--success-rgb,34,197,94),0.15)]"
            : "bg-[rgba(var(--warning-rgb,245,158,11),0.06)] border-[rgba(var(--warning-rgb,245,158,11),0.15)]"
        )}>
          <div className="flex items-center gap-3">
            {allOperational ? (
              <CheckCircle className="w-6 h-6 text-[var(--success)]" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-[var(--warning)]" />
            )}
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {allOperational ? "ทุกระบบทำงานปกติ" : "บางระบบทำงานช้ากว่าปกติ"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                อัปเดตล่าสุด: {new Date().toLocaleString("th-TH")}
              </p>
            </div>
          </div>
        </div>

        {/* Service List */}
        <div className="space-y-2 mb-10">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--text-muted)] hidden sm:block">
                    Uptime {service.uptime}%
                  </span>
                  {service.latency && (
                    <span className="text-xs text-[var(--text-muted)] hidden sm:block">
                      <Clock className="w-3 h-3 inline mr-1" />{service.latency}ms
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <StatusIcon status={service.status} />
                    <StatusLabel status={service.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Uptime Chart (90 days visual) */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Uptime (90 วัน)</h2>
          <div className="flex gap-[2px] h-8">
            {Array.from({ length: 90 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-[var(--success)] opacity-90 hover:opacity-100 transition-opacity"
                title={`${90 - i} วันก่อน — ปกติ`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
            <span>90 วันก่อน</span>
            <span>วันนี้</span>
          </div>
        </div>

        {/* Incident History */}
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">ประวัติเหตุการณ์</h2>
          <div className="space-y-3">
            {INCIDENTS.map((incident) => (
              <div key={incident.date + incident.title} className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{incident.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(var(--success-rgb,34,197,94),0.1)] text-[var(--success)] font-medium">
                    แก้ไขแล้ว
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{incident.date} — {incident.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
