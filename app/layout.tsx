import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { StoreProviders } from "@/providers/store-providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import NavigationProgress from "@/components/NavigationProgress";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SMSOK — แพลตฟอร์มส่ง SMS สำหรับธุรกิจ",
    template: "%s | SMSOK",
  },
  description: "ส่ง SMS ผ่านเว็บและ API ได้ทันที ราคาถูกสุด 0.15 บาท/ข้อความ ส่งเร็ว ทดลองฟรี 500 SMS รองรับ OTP, แคมเปญ, และ Sender Name",
  keywords: ["SMS", "ส่ง SMS", "SMS API", "SMS Thailand", "OTP", "SMS ราคาถูก", "SMS marketing", "แพลตฟอร์ม SMS", "SMSOK"],
  authors: [{ name: "SMSOK" }],
  creator: "SMSOK",
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "SMSOK",
    title: "SMSOK — แพลตฟอร์มส่ง SMS สำหรับธุรกิจ",
    description: "ส่ง SMS ผ่านเว็บและ API ได้ทันที ราคาถูก ส่งเร็ว ทดลองฟรี 500 SMS",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "SMSOK — แพลตฟอร์มส่ง SMS สำหรับธุรกิจ",
    description: "ส่ง SMS ผ่านเว็บและ API ได้ทันที ราคาถูก ส่งเร็ว ทดลองฟรี 500 SMS",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#061019",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={cn("dark", "font-sans")}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="alternate" hrefLang="th" href="https://smsok.9phum.me" />
        <link rel="alternate" hrefLang="en" href="https://smsok.9phum.me?lang=en" />
        <link rel="alternate" hrefLang="x-default" href="https://smsok.9phum.me" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SMSOK" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--accent)] focus:text-[var(--bg-base)] focus:text-sm focus:font-semibold">
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <StoreProviders>
          <TooltipProvider>
            <NavigationProgress />
            {children}
            <Toaster position="top-right" />
            <CookieConsentBanner />
          </TooltipProvider>
        </StoreProviders>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  );
}
