"use client";

import dynamic from "next/dynamic";

const LandingPage = dynamic(() => import("./LandingPage"), {
  loading: () => <div className="min-h-screen bg-[var(--bg-base)]" />,
});

export default function LandingPageWrapper() {
  return <LandingPage />;
}
