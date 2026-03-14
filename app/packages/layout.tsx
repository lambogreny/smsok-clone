import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แพ็กเกจ SMS — เลือกแพ็กเกจที่เหมาะกับธุรกิจของคุณ",
  description: "แพ็กเกจส่ง SMS ราคาถูกสุด 0.15 บาท/ข้อความ มีให้เลือกหลายขนาด ตั้งแต่ 500 ถึง 1,000,000 SMS พร้อมโบนัสพิเศษ",
  alternates: { canonical: "/packages" },
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
