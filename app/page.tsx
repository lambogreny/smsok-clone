import type { Metadata } from "next";
import LandingPage from "./components/LandingPage";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

export const metadata: Metadata = {
  title: {
    absolute: "SMSOK - แพลตฟอร์มส่ง SMS มาตรฐานระดับโลก",
  },
  description: "ส่ง SMS ผ่านเว็บและ API ได้ทันที ราคาถูกสุด 0.15 บาท/ข้อความ ส่งเร็ว รองรับ OTP, แคมเปญ, Sender Name พร้อม Dashboard จัดการครบ",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SMSOK",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description: "แพลตฟอร์มส่ง SMS สำหรับธุรกิจ รองรับ API, OTP, แคมเปญ",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
    description: "ทดลองฟรี 500 SMS",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
