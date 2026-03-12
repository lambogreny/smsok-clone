"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/lib/validations";
import type { LoginResponse } from "@/lib/types/api-responses";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Send, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clearLogoutMarker } from "@/components/AuthGuard";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: LoginValues) {
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.trim().toLowerCase(), password: data.password }),
      });
      const result: LoginResponse = await res.json();
      if (!res.ok) {
        const msg = (result as { error?: string }).error || "เกิดข้อผิดพลาด กรุณาลองใหม่";
        setServerError(msg);
        toast.error(msg);
        return;
      }
      if (result.needs2FA) {
        toast.info("กรุณายืนยันตัวตนด้วย 2FA");
        router.push(`/2fa?token=${encodeURIComponent(result.challengeToken)}`);
        return;
      }
      toast.success("เข้าสู่ระบบสำเร็จ");
      clearLogoutMarker();
      router.push(result.redirectTo ?? "/dashboard");
    } catch {
      const msg = "ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่";
      setServerError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-base)]">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-10 flex items-center gap-1.5 text-[var(--text-muted)] hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-[13px]">กลับหน้าหลัก</span>
      </Link>

      <div className="w-full max-w-[420px]">
        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-lg shadow-none">
          <CardHeader className="text-center pb-0 pt-8 px-8">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-[var(--bg-base)]" />
              </div>
              <span className="text-xl font-bold text-white">SMSOK</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">เข้าสู่ระบบ</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">ลงชื่อเข้าใช้งานบัญชีของคุณ</p>
          </CardHeader>

          <CardContent className="px-8 pt-6 pb-2">
            {serverError && (
              <div className="mb-4 p-3 rounded-lg bg-[rgba(var(--error-rgb),0.06)] border border-[rgba(var(--error-rgb),0.15)] text-[var(--error)] text-[13px] text-center">
                {serverError}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                        EMAIL
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                          รหัสผ่าน
                        </FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-[13px] text-[var(--accent-blue)] hover:underline transition-colors duration-150"
                        >
                          ลืมรหัสผ่าน?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg pr-11 focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
                          >
                            {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                  className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-xl text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,255,167,0.25)] group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      เข้าสู่ระบบ
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center pb-8 pt-4">
            <p className="text-[13px] text-[var(--text-muted)]">
              ยังไม่มีบัญชี?{" "}
              <Link href="/register" className="text-[var(--accent-blue)] hover:underline transition-colors duration-150">
                สมัครฟรี
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Trust badge */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          ใช้งานโดยธุรกิจกว่า 10,000+ ราย
        </p>
      </div>
    </div>
  );
}
