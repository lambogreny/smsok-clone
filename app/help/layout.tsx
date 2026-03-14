import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

export const metadata: Metadata = {
  title: "ศูนย์ช่วยเหลือ — คำถามที่พบบ่อย",
  description:
    "คำถามที่พบบ่อยเกี่ยวกับการส่ง SMS, API, การชำระเงิน, บัญชีผู้ใช้ และ PDPA พร้อมคำตอบจากทีม SMSOK",
  openGraph: {
    title: "ศูนย์ช่วยเหลือ | SMSOK",
    description:
      "คำถามที่พบบ่อยเกี่ยวกับการส่ง SMS, API, การชำระเงิน และอื่นๆ",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/help`,
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
