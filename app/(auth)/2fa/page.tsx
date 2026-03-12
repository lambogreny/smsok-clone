"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Challenge2FAResponse } from "@/lib/types/api-responses";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Send, ArrowLeft, ArrowRight, Shield, Loader2 } from "lucide-react";
import { clearLogoutMarker } from "@/components/AuthGuard";

const otpSchema = z.object({
  code: z.string().length(6, "กรอกรหัส 6 หลัก"),
});

const recoverySchema = z.object({
  recoveryCode: z.string().min(8, "รหัสสำรองต้องมีอย่างน้อย 8 ตัวอักษร"),
});

type OtpValues = z.infer<typeof otpSchema>;
type RecoveryValues = z.infer<typeof recoverySchema>;

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
      <TwoFactorContent />
    </Suspense>
  );
}

function TwoFactorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeToken = searchParams.get("token") ?? "";
  const [error, setError] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);

  const otpForm = useForm<OtpValues>({
    mode: "onChange",
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const recoveryForm = useForm<RecoveryValues>({
    mode: "onChange",
    resolver: zodResolver(recoverySchema),
    defaultValues: { recoveryCode: "" },
  });

  const isSubmitting = useRecovery ? recoveryForm.formState.isSubmitting : otpForm.formState.isSubmitting;

  async function handleVerify(data: OtpValues | RecoveryValues) {
    setError("");
    try {
      const isRecovery = "recoveryCode" in data;
      const endpoint = isRecovery ? "/api/auth/2fa/recovery" : "/api/auth/2fa/verify";
      const body = isRecovery
        ? { challengeToken, recoveryCode: (data as RecoveryValues).recoveryCode }
        : { challengeToken, code: (data as OtpValues).code };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: Challenge2FAResponse & { error?: string } = await res.json();
      if (!res.ok) {
        setError(result.error || "รหัสไม่ถูกต้อง กรุณาลองใหม่");
        if (!isRecovery) {
          otpForm.setValue("code", "");
        }
        return;
      }
      clearLogoutMarker();
      router.push(result.redirectTo ?? "/dashboard");
    } catch {
      setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-base)]">
      <div className="w-full max-w-[420px]">
        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-lg shadow-none">
          <CardHeader className="text-center pb-0 pt-8 px-8">
            <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-[var(--bg-base)]" />
              </div>
              <span className="text-xl font-bold text-white">SMSOK</span>
            </Link>
            <div className="w-12 h-12 rounded-full bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl font-bold text-white">ยืนยันตัวตน</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {useRecovery
                ? "กรอกรหัสสำรองเพื่อเข้าสู่ระบบ"
                : "กรอกรหัส 6 หลักจาก Authenticator App"}
            </p>
          </CardHeader>

          <CardContent className="px-8 pt-6 pb-2">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[rgba(var(--error-rgb),0.06)] border border-[rgba(var(--error-rgb),0.15)] text-[var(--error)] text-[13px] text-center">
                {error}
              </div>
            )}

            {useRecovery ? (
              <Form {...recoveryForm}>
                <form onSubmit={recoveryForm.handleSubmit(handleVerify)} className="space-y-5">
                  <FormField
                    control={recoveryForm.control}
                    name="recoveryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                          รหัสสำรอง
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="xxxx-xxxx-xxxx"
                            className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg font-mono focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                            autoFocus
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-xl text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,255,167,0.25)] group"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังยืนยัน...</span>
                    ) : (
                      <span className="flex items-center gap-2">ยืนยัน<ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(handleVerify)} className="space-y-5">
                  <FormField
                    control={otpForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex justify-center">
                            <InputOTP
                              maxLength={6}
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                if (value.length === 6) {
                                  setTimeout(() => otpForm.handleSubmit(handleVerify)(), 100);
                                }
                              }}
                              autoFocus
                            >
                              <InputOTPGroup className="gap-2">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                  <InputOTPSlot
                                    key={i}
                                    index={i}
                                    className="w-12 h-14 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white text-2xl font-bold font-mono rounded-lg data-[active=true]:border-[var(--accent)] data-[active=true]:ring-[rgba(0,255,167,0.12)]"
                                  />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </FormControl>
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || otpForm.watch("code").length < 6}
                    className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-xl text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,255,167,0.25)] group"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังยืนยัน...</span>
                    ) : (
                      <span className="flex items-center gap-2">ยืนยัน<ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pb-8 pt-4 px-8">
            <button
              type="button"
              onClick={() => { setUseRecovery(!useRecovery); setError(""); }}
              className="text-[13px] text-[var(--accent-blue)] hover:underline transition-colors duration-150 cursor-pointer"
            >
              {useRecovery ? "ใช้รหัส Authenticator" : "ใช้รหัสสำรอง"}
            </button>
            <Link
              href="/login"
              className="flex items-center gap-1 text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้า Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
