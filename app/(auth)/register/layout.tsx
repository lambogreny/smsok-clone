import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description:
    "สมัครสมาชิก SMSOK ฟรี ทดลองส่ง SMS 15 ข้อความ พร้อม API key ใช้งานได้ทันที",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
