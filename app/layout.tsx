import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { StoreProviders } from "@/providers/store-providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import NavigationProgress from "@/components/NavigationProgress";

export const metadata: Metadata = {
  title: "SMSOK Clone — SMS Sending Platform",
  description: "ส่ง SMS ผ่านเว็บและ API ได้ทันที ราคาถูก ส่งเร็ว ทดลองฟรี 500 SMS",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <StoreProviders>
          <TooltipProvider>
            <NavigationProgress />
            {children}
            <Toaster position="top-right" />
            <CookieConsentBanner />
          </TooltipProvider>
        </StoreProviders>
      </body>
    </html>
  );
}
