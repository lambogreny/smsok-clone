"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Server,
  Package,
  Gauge,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Shield,
  Clock,
  Zap,
} from "lucide-react";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { toast } from "sonner";

/* ────────── types ────────── */

interface GatewayStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  latency: number;
  throughput: number;
  lastCheck: string;
}

interface PackageTier {
  id: string;
  name: string;
  smsCount: number;
  price: number;
  pricePerSms: number;
  active: boolean;
}

interface RateLimitStatus {
  endpoint: string;
  limit: number;
  current: number;
  window: string;
}

interface SystemSettings {
  gateways: GatewayStatus[];
  packages: PackageTier[];
  rateLimits: RateLimitStatus[];
  systemVersion: string;
  lastDeployedAt: string;
}

/* ────────── helpers ────────── */

function GatewayStatusIcon({ status }: { status: GatewayStatus["status"] }) {
  if (status === "online") return <Wifi className="w-4 h-4 text-[var(--success)]" />;
  if (status === "degraded") return <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />;
  return <WifiOff className="w-4 h-4 text-[var(--error)]" />;
}

function GatewayStatusLabel({ status }: { status: GatewayStatus["status"] }) {
  const map = {
    online: { label: "Online", cls: "text-[var(--success)]" },
    degraded: { label: "Degraded", cls: "text-[var(--warning)]" },
    offline: { label: "Offline", cls: "text-[var(--error)]" },
  };
  const m = map[status];
  return <span className={`text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}

function UsageBar({ current, limit }: { current: number; limit: number }) {
  const pct = Math.min((current / limit) * 100, 100);
  const color = pct > 80 ? "var(--error)" : pct > 50 ? "var(--warning)" : "var(--success)";
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2 rounded-full bg-[var(--bg-base)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-[var(--text-muted)] font-mono whitespace-nowrap">{current}/{limit}</span>
    </div>
  );
}

/* ────────── page ────────── */

export default function AdminSettingsPage() {
  const [data, setData] = useState<SystemSettings>({
    gateways: [],
    packages: [],
    rateLimits: [],
    systemVersion: "-",
    lastDeployedAt: "-",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      /* API not ready */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSettings();
    toast.success("รีเฟรชข้อมูลแล้ว");
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      </PageLayout>
    );
  }

  const onlineGateways = data.gateways.filter((g) => g.status === "online").length;

  return (
    <PageLayout>
      <PageHeader
        title="System Settings"
        description="ตั้งค่าระบบ, SMS Gateway, แพ็กเกจ, Rate Limit"
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.2)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        }
      />

      {/* System Info Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 px-4 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">Version:</span>
          <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{data.systemVersion}</span>
        </div>
        <div className="w-px h-4 bg-[var(--border-default)]" />
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">Last Deploy:</span>
          <span className="text-xs font-mono text-[var(--text-secondary)]">{data.lastDeployedAt}</span>
        </div>
      </div>

      {/* SMS Gateway Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">SMS Gateway</h2>
          {data.gateways.length > 0 && (
            <span className="text-xs text-[var(--text-muted)] ml-auto">{onlineGateways}/{data.gateways.length} online</span>
          )}
        </div>

        {data.gateways.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
            <Server className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">ยังไม่มีข้อมูล Gateway</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">เชื่อมต่อ API เพื่อดูสถานะ SMS Gateway</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {data.gateways.map((gw) => (
              <div key={gw.name} className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <GatewayStatusIcon status={gw.status} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{gw.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Last check: {gw.lastCheck}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-[var(--text-muted)]">Latency</p>
                    <p className="text-sm font-mono font-semibold text-[var(--text-primary)]">{gw.latency}ms</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-[var(--text-muted)]">Throughput</p>
                    <p className="text-sm font-mono font-semibold text-[var(--text-primary)]">{gw.throughput}/s</p>
                  </div>
                  <GatewayStatusLabel status={gw.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Package Tiers Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Package Tiers</h2>
        </div>

        {data.packages.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
            <Package className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">ยังไม่มีข้อมูลแพ็กเกจ</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">เชื่อมต่อ API เพื่อดูรายการแพ็กเกจ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] py-3 px-4">แพ็กเกจ</th>
                  <th className="text-right text-xs font-medium text-[var(--text-muted)] py-3 px-4">จำนวน SMS</th>
                  <th className="text-right text-xs font-medium text-[var(--text-muted)] py-3 px-4">ราคา (฿)</th>
                  <th className="text-right text-xs font-medium text-[var(--text-muted)] py-3 px-4">ต่อข้อความ</th>
                  <th className="text-center text-xs font-medium text-[var(--text-muted)] py-3 px-4">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {data.packages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[var(--text-primary)]">{pkg.name}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-[var(--text-secondary)]">{pkg.smsCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-[var(--text-secondary)]">฿{pkg.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-[var(--accent)]">฿{pkg.pricePerSms.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {pkg.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(var(--success-rgb,34,197,94),0.1)] text-[var(--success)]">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(var(--text-muted-rgb,138,149,160),0.1)] text-[var(--text-muted)]">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Rate Limit Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Rate Limits</h2>
        </div>

        {data.rateLimits.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
            <Gauge className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">ยังไม่มีข้อมูล Rate Limit</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">เชื่อมต่อ API เพื่อดูสถานะ Rate Limit</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.rateLimits.map((rl) => (
              <div key={rl.endpoint} className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-sm font-mono font-medium text-[var(--text-primary)]">{rl.endpoint}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{rl.window}</span>
                </div>
                <UsageBar current={rl.current} limit={rl.limit} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Security Section */}
      <section className="mt-8 p-5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Security</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">SSL/TLS</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
              <span className="text-sm font-medium text-[var(--success)]">Active</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">PDPA Compliance</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
              <span className="text-sm font-medium text-[var(--success)]">Compliant</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">2FA Enforcement</p>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Optional</span>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
