import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API Documentation — เอกสาร REST API สำหรับนักพัฒนา",
  description: "เอกสาร SMSOK REST API สำหรับส่ง SMS, OTP, และจัดการ Contacts ผ่าน API พร้อมตัวอย่างโค้ด cURL, Node.js, Python",
  alternates: { canonical: "/docs/api" },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
