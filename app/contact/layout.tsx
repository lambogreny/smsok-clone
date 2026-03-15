import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ติดต่อเรา",
  description:
    "ติดต่อทีม SMSOK — สอบถามข้อมูล ขอใบเสนอราคา แจ้งปัญหา หรือเป็นพาร์ทเนอร์กับเรา พร้อมให้บริการ จ-ศ 9:00-18:00",
  openGraph: {
    title: "ติดต่อเรา | SMSOK",
    description:
      "ติดต่อทีม SMSOK — สอบถามข้อมูล ขอใบเสนอราคา แจ้งปัญหา หรือเป็นพาร์ทเนอร์กับเรา",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
