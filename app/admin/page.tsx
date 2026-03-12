"use client";

import Link from "next/link";
import {
  Radio,
  DollarSign,
  Headphones,
  BarChart3,
  Cpu,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

const DASHBOARDS = [
  {
    title: "Operations",
    description: "SMS delivery, providers, carriers, queue",
    icon: Radio,
    href: "/admin/operations",
    color: "var(--accent)",
    bg: "rgba(0,226,181,0.08)",
  },
  {
    title: "Finance",
    description: "Revenue, invoices, refunds, tax",
    icon: DollarSign,
    href: "/admin/finance",
    color: "var(--success)",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    title: "Support",
    description: "Tickets, SLA, customer issues",
    icon: Headphones,
    href: "/admin/support",
    color: "var(--info)",
    bg: "rgba(50,152,218,0.08)",
  },
  {
    title: "CEO",
    description: "KPIs, growth, executive summary",
    icon: BarChart3,
    href: "/admin/ceo",
    color: "var(--warning)",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    title: "CTO",
    description: "System health, infrastructure, errors",
    icon: Cpu,
    href: "/admin/cto",
    color: "var(--text-body)",
    bg: "rgba(176,180,184,0.08)",
  },
  {
    title: "Marketing",
    description: "Campaigns, engagement, conversion",
    icon: Megaphone,
    href: "/admin/marketing",
    color: "var(--error)",
    bg: "rgba(239,68,68,0.08)",
  },
];

export default function AdminOverview() {
  return (
    <PageLayout>
      <PageHeader
        title="Admin Overview"
        description="เลือก Dashboard ที่ต้องการ"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DASHBOARDS.map((d) => {
          const Icon = d.icon;
          return (
            <Link key={d.href} href={d.href}>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 hover:border-[rgba(0,226,181,0.15)] transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: d.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      {d.title}
                    </h3>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      {d.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] mt-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </PageLayout>
  );
}
