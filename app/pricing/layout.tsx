import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

export const metadata: Metadata = {
  title: "แพ็กเกจ SMS — เลือกแพ็กเกจที่เหมาะกับธุรกิจ",
  description:
    "เปรียบเทียบแพ็กเกจ SMS ราคาเริ่มต้น 0.15 บาท ส่ง SMS ได้ทันที รองรับ Sender Name, OTP, แคมเปญ ทดลองฟรี 15 SMS",
  openGraph: {
    title: "แพ็กเกจ SMS | SMSOK",
    description:
      "เปรียบเทียบแพ็กเกจ SMS ราคาเริ่มต้น 0.15 บาท ส่งได้ทันที ทดลองฟรี",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
