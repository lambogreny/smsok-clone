import type { Metadata } from "next";
import { Suspense } from "react";
import LandingPageWrapper from "./components/LandingPageWrapper";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

export const metadata: Metadata = {
  title: {
    absolute: "บริการส่ง SMS Marketing & OTP API ราคาถูก | SMSOK",
  },
  description: "บริการส่ง SMS ผ่านเว็บและ API ที่ดีที่สุดในไทย ส่งได้ทั้ง Marketing และ OTP ราคาเริ่มต้น 0.15 บาท เริ่มต้นฟรี 15 SMS!",
  alternates: { canonical: "/" },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SMSOK",
    url: BASE_URL,
    description: "บริการส่ง SMS Marketing และ OTP API สำหรับธุรกิจไทย",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Thai", "English"],
    },
  },
  {
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
      description: "ทดลองฟรี 15 SMS",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
        <LandingPageWrapper />
      </Suspense>
    </>
  );
}
