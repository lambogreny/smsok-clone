import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา",
  description:
    "SMSOK — แพลตฟอร์มส่ง SMS สำหรับธุรกิจ ด้วยมาตรฐานระดับสากล NBTC registered, PDPA compliant ส่งเร็ว ราคาถูก ธุรกิจกว่า 500+ รายไว้วางใจ",
  openGraph: {
    title: "เกี่ยวกับเรา | SMSOK",
    description:
      "SMSOK — ทำให้ SMS เข้าถึงได้สำหรับทุกธุรกิจ ไม่ว่าเล็กหรือใหญ่ ส่งเร็ว ราคาถูก มาตรฐานระดับสากล",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
