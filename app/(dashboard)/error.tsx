"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error.digest ?? "unknown");
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-base)]">
      <Card className="max-w-md w-full bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg shadow-none">
        <CardContent className="p-10 sm:p-14 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-[rgba(var(--error-rgb),0.08)] border border-[rgba(var(--error-rgb),0.15)] flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-[var(--error)]" />
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
            กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่<br />กรุณาติดต่อทีมสนับสนุน
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-xl font-semibold gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              ลองใหม่
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl gap-2">
                <Home className="w-4 h-4" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
