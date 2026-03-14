import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

export const metadata: Metadata = {
  title: "สถานะระบบ — System Status",
  description:
    "ตรวจสอบสถานะระบบ SMSOK แบบเรียลไทม์ — SMS Gateway, API, เว็บไซต์ และ Uptime",
  openGraph: {
    title: "สถานะระบบ | SMSOK",
    description: "ตรวจสอบสถานะระบบ SMSOK แบบเรียลไทม์",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/status`,
  },
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
