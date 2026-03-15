"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/validations";
import { generateOtpForRegister } from "@/lib/actions/otp";
import { registerWithOtp } from "@/lib/actions";
import { safeErrorMessage } from "@/lib/error-messages";
import { blockNonNumeric, blockThai } from "@/lib/form-utils";
import type { RegisterOtpSendResponse } from "@/lib/types/api-responses";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Send, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Smartphone, Check, AlertTriangle, CircleCheck, CircleX } from "lucide-react";
import { toast } from "sonner";
import { clearLogoutMarker } from "@/components/AuthGuard";
import RateLimitCountdown, { extractRateLimitSeconds, friendlyRateLimitMessage } from "@/components/RateLimitCountdown";

const formSchema = registerSchema.extend({
  confirmPassword: z.string(),
  consentService: z.boolean(),
  consentThirdParty: z.boolean(),
  consentMarketing: z.boolean(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;
type Step = "form" | "otp";
type AvailabilityStatus = "idle" | "checking" | "available" | "taken";
type AvailabilityState = {
  status: AvailabilityStatus;
  message: string;
};

const RESEND_COOLDOWN = 60;
const OTP_EXPIRY = 5 * 60;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [formError, setFormError] = useState("");
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpRef, setOtpRef] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(OTP_EXPIRY);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpPending, setOtpPending] = useState(false);

  const [emailAvailability, setEmailAvailability] = useState<AvailabilityState>({ status: "idle", message: "" });
  const [phoneAvailability, setPhoneAvailability] = useState<AvailabilityState>({ status: "idle", message: "" });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      consentService: false,
      consentThirdParty: false,
      consentMarketing: false,
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const email = form.watch("email");
  const phone = form.watch("phone") ?? "";
  const consentService = form.watch("consentService");
  const consentThirdParty = form.watch("consentThirdParty");
  const isSubmitting = form.formState.isSubmitting;
  const termsAccepted = consentService === true && consentThirdParty === true;
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const hasBlockingDuplicate =
    emailAvailability.status === "taken" ||
    phoneAvailability.status === "taken" ||
    emailAvailability.status === "checking" ||
    phoneAvailability.status === "checking";

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== "otp") return;
    const t = setInterval(() => {
      setCountdown((v) => Math.max(0, v - 1));
      setResendCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step, otpRef]);

  useEffect(() => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setEmailAvailability({ status: "idle", message: "" });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setEmailAvailability({ status: "checking", message: "กำลังตรวจสอบ..." });
      try {
        const res = await fetch(`/api/auth/check-duplicate?email=${encodeURIComponent(trimmedEmail)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setEmailAvailability({
          status: data.available ? "available" : "taken",
          message: data.message ?? (data.available ? "อีเมลนี้ใช้ได้" : "อีเมลนี้ถูกใช้แล้ว"),
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setEmailAvailability({ status: "idle", message: "" });
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [email]);

  useEffect(() => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 9) {
      setPhoneAvailability({ status: "idle", message: "" });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPhoneAvailability({ status: "checking", message: "กำลังตรวจสอบ..." });
      try {
        const res = await fetch(`/api/auth/check-duplicate?phone=${encodeURIComponent(trimmedPhone)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setPhoneAvailability({
          status: data.available ? "available" : "taken",
          message: data.message ?? (data.available ? "เบอร์นี้ใช้ได้" : "เบอร์นี้ถูกใช้แล้ว"),
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setPhoneAvailability({ status: "idle", message: "" });
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [phone]);

  const passwordChecks = [
    { label: "8 ตัวอักษรขึ้นไป", pass: password.length >= 8 },
    { label: "มีตัวพิมพ์ใหญ่", pass: /[A-Z]/.test(password) },
    { label: "มีตัวเลข", pass: /[0-9]/.test(password) },
  ];
  const strengthCount = passwordChecks.filter((c) => c.pass).length;

  async function handleSendOtp(data: FormValues) {
    setFormError("");
    if (!data.consentService || !data.consentThirdParty) {
      return;
    }
    try {
      const result: RegisterOtpSendResponse = await generateOtpForRegister(data.phone!);
      setOtpRef(result.ref);
      setCountdown(OTP_EXPIRY);
      setResendCooldown(RESEND_COOLDOWN);
      setStep("otp");
      toast.success("ส่ง OTP สำเร็จ");
    } catch (e) {
      const msg = safeErrorMessage(e) || "เกิดข้อผิดพลาด กรุณาลองใหม่";
      const rlSeconds = extractRateLimitSeconds(msg);
      if (rlSeconds) {
        setRateLimitSeconds(rlSeconds);
        setFormError("");
        toast.error(friendlyRateLimitMessage(rlSeconds));
      } else {
        setFormError(msg);
        toast.error(msg);
      }
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setOtpPending(true);
    try {
      const result: RegisterOtpSendResponse = await generateOtpForRegister(form.getValues("phone")!);
      setOtpRef(result.ref);
      setCountdown(OTP_EXPIRY);
      setResendCooldown(RESEND_COOLDOWN);
      setOtpCode("");
      setOtpError("");
    } catch (e) {
      setOtpError(safeErrorMessage(e));
    } finally {
      setOtpPending(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) return;
    setOtpError("");
    setOtpPending(true);
    try {
      const v = form.getValues();
      await registerWithOtp({
        name: `${v.firstName.trim()} ${v.lastName.trim()}`,
        email: v.email,
        phone: v.phone!,
        password: v.password,
        otpRef,
        otpCode,
        acceptTerms: true,
        consentService: true,
        consentThirdParty: true,
        consentMarketing: v.consentMarketing,
      });
      toast.success("สมัครสมาชิกสำเร็จ");
      clearLogoutMarker();
      router.push("/dashboard");
    } catch (e) {
      const msg = safeErrorMessage(e) || "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setOtpPending(false);
    }
  }

  function fmtCountdown(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const stepIndex = step === "form" ? 0 : 1;

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-12 bg-[var(--bg-base)]">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-10 flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-[13px]">กลับหน้าหลัก</span>
      </Link>

      <div className="w-full max-w-[460px]">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                  i < stepIndex
                    ? "bg-[var(--accent)] text-[var(--bg-base)]"
                    : i === stepIndex
                    ? "bg-[var(--accent)] text-[var(--bg-base)]"
                    : "bg-transparent border border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 1 && (
                <div className={`w-8 h-0.5 ${i < stepIndex ? "bg-[var(--accent)]" : "bg-[var(--border-subtle)]"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg shadow-none">
          {step === "form" ? (
            <>
              <CardHeader className="text-center pb-0 pt-8 px-5 sm:px-8">
                <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-[var(--bg-base)]" />
                  </div>
                  <span className="text-xl font-bold text-[var(--text-primary)]">SMSOK</span>
                </Link>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">สร้างบัญชีใหม่</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">เริ่มต้นส่ง SMS ได้ทันที</p>
              </CardHeader>

              <CardContent className="px-5 sm:px-8 pt-6 pb-2">
                {rateLimitSeconds && rateLimitSeconds > 0 && (
                  <div className="mb-4">
                    <RateLimitCountdown seconds={rateLimitSeconds} onExpire={() => setRateLimitSeconds(null)} />
                  </div>
                )}
                {formError && !rateLimitSeconds && (
                  <div className="mb-4 p-3 rounded-lg bg-[rgba(var(--error-rgb),0.06)] border border-[rgba(var(--error-rgb),0.15)] text-[var(--error)] text-[13px] text-center">
                    {formError}
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSendOtp)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">ชื่อ</FormLabel>
                            <FormControl>
                              <Input placeholder="สมชาย" className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent)] focus:ring-[rgba(var(--accent-rgb),0.12)]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">นามสกุล</FormLabel>
                            <FormControl>
                              <Input placeholder="ใจดี" className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent)] focus:ring-[rgba(var(--accent-rgb),0.12)]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">อีเมล</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                onKeyDown={blockThai}
                                aria-invalid={emailAvailability.status === "taken" || undefined}
                                aria-describedby="email-availability"
                                className="h-11 bg-[var(--bg-base)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg pr-10 transition-[border-color,box-shadow] duration-200"
                                style={{
                                  borderColor:
                                    emailAvailability.status === "available" ? "#089981"
                                    : emailAvailability.status === "taken" ? "#f23645"
                                    : undefined,
                                  boxShadow:
                                    emailAvailability.status === "available" ? "0 0 0 1px rgba(8,153,129,0.2)"
                                    : emailAvailability.status === "taken" ? "0 0 0 1px rgba(242,54,69,0.2)"
                                    : undefined,
                                }}
                                {...field}
                              />
                              {emailAvailability.status === "checking" && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#949FA8]" aria-label="กำลังตรวจสอบ" />
                              )}
                              {emailAvailability.status === "available" && (
                                <CircleCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#089981] animate-in fade-in duration-200" />
                              )}
                              {emailAvailability.status === "taken" && (
                                <CircleX className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f23645] animate-in fade-in duration-200" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                          <div id="email-availability" className="min-h-[20px]">
                            {emailAvailability.status !== "idle" && (
                              <p
                                role="status"
                                className={`flex items-center gap-1 text-[12px] animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                                  emailAvailability.status === "available"
                                    ? "text-[#089981]"
                                    : emailAvailability.status === "taken"
                                    ? "text-[#f23645]"
                                    : "text-[#949FA8]"
                                }`}
                              >
                                {emailAvailability.status === "checking" && <Loader2 className="w-3 h-3 animate-spin" />}
                                {emailAvailability.status === "available" && <Check className="w-3 h-3" />}
                                {emailAvailability.status === "taken" && <CircleX className="w-3 h-3" />}
                                {emailAvailability.message}
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                            หมายเลขโทรศัพท์
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="tel"
                                autoComplete="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="0891234567"
                                onKeyDown={blockNonNumeric}
                                aria-invalid={phoneAvailability.status === "taken" || undefined}
                                aria-describedby="phone-availability"
                                className="h-11 bg-[var(--bg-base)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg pr-10 transition-[border-color,box-shadow] duration-200"
                                style={{
                                  borderColor:
                                    phoneAvailability.status === "available" ? "#089981"
                                    : phoneAvailability.status === "taken" ? "#f23645"
                                    : undefined,
                                  boxShadow:
                                    phoneAvailability.status === "available" ? "0 0 0 1px rgba(8,153,129,0.2)"
                                    : phoneAvailability.status === "taken" ? "0 0 0 1px rgba(242,54,69,0.2)"
                                    : undefined,
                                }}
                                {...field}
                              />
                              {phoneAvailability.status === "checking" && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#949FA8]" aria-label="กำลังตรวจสอบ" />
                              )}
                              {phoneAvailability.status === "available" && (
                                <CircleCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#089981] animate-in fade-in duration-200" />
                              )}
                              {phoneAvailability.status === "taken" && (
                                <CircleX className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f23645] animate-in fade-in duration-200" />
                              )}
                            </div>
                          </FormControl>
                          <p className="text-[11px] text-[var(--text-muted)]">ใช้สำหรับรับ OTP ยืนยันตัวตน</p>
                          <FormMessage />
                          <div id="phone-availability" className="min-h-[20px]">
                            {phoneAvailability.status !== "idle" && (
                              <p
                                role="status"
                                className={`flex items-center gap-1 text-[12px] animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                                  phoneAvailability.status === "available"
                                    ? "text-[#089981]"
                                    : phoneAvailability.status === "taken"
                                    ? "text-[#f23645]"
                                    : "text-[#949FA8]"
                                }`}
                              >
                                {phoneAvailability.status === "checking" && <Loader2 className="w-3 h-3 animate-spin" />}
                                {phoneAvailability.status === "available" && <Check className="w-3 h-3" />}
                                {phoneAvailability.status === "taken" && <CircleX className="w-3 h-3" />}
                                {phoneAvailability.message}
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">รหัสผ่าน</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg pr-11 focus:border-[var(--accent)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                                onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                                onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                                onBlur={(e) => { setCapsLockOn(false); field.onBlur(); }}
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150">
                                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                              </button>
                            </div>
                          </FormControl>
                          {capsLockOn && (
                            <p role="alert" className="flex items-center gap-1 text-xs font-medium text-[var(--warning)] animate-fade-in mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Caps Lock เปิดอยู่
                            </p>
                          )}
                          <FormMessage />
                          {password && (
                            <>
                              <div className="flex gap-1 mt-1.5">
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className={`h-[3px] flex-1 rounded-full transition-colors duration-200 ${
                                      i < strengthCount
                                        ? strengthCount === 1
                                          ? "bg-[var(--error)]"
                                          : strengthCount === 2
                                          ? "bg-[var(--warning)]"
                                          : "bg-[var(--success)]"
                                        : "bg-[var(--border-subtle)]"
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="space-y-0.5 mt-1">
                                {passwordChecks.map((c) => (
                                  <p key={c.label} className={`text-[11px] ${c.pass ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}>
                                    {c.pass ? "✓" : "○"} {c.label}
                                  </p>
                                ))}
                              </div>
                            </>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">ยืนยันรหัสผ่าน</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirm ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg pr-11 focus:border-[var(--accent)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                                onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                                onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                                onBlur={(e) => { setCapsLockOn(false); field.onBlur(); }}
                              />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150">
                                {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                              </button>
                            </div>
                          </FormControl>
                          {capsLockOn && (
                            <p role="alert" className="flex items-center gap-1 text-xs font-medium text-[var(--warning)] animate-fade-in mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Caps Lock เปิดอยู่
                            </p>
                          )}
                          <FormMessage />
                          {confirmPassword.length > 0 && (
                            <p className={`text-[11px] ${passwordsMatch ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                              {passwordsMatch ? "✓ รหัสผ่านตรงกัน" : "✕ รหัสผ่านไม่ตรงกัน"}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* PDPA Consent */}
                    <div className="space-y-2.5 pt-2">
                      {/* 1. Service Terms — Required */}
                      <FormField
                        control={form.control}
                        name="consentService"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-2.5 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-required="true"
                                className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-[1.5px] border-[var(--border-default)] data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                              />
                            </FormControl>
                            <FormLabel className="text-xs text-[var(--text-secondary)] font-normal leading-relaxed break-words">
                              ฉันยอมรับ{" "}
                              <Link
                                href="/terms"
                                className="font-medium text-[var(--accent-blue)] hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                ข้อกำหนดการใช้งาน
                              </Link>
                              {" "}และ{" "}
                              <Link
                                href="/privacy"
                                className="font-medium text-[var(--accent-blue)] hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                นโยบายความเป็นส่วนตัว
                              </Link>
                              <span className="text-[var(--error)] text-[10px] ml-0.5">*</span>
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {/* 2. Third-Party — Required */}
                      <FormField
                        control={form.control}
                        name="consentThirdParty"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-2.5 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-required="true"
                                className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-[1.5px] border-[var(--border-default)] data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                              />
                            </FormControl>
                            <FormLabel className="text-xs text-[var(--text-secondary)] font-normal leading-relaxed break-words">
                              ฉันยินยอมให้ส่งข้อมูลแก่ผู้ให้บริการ SMS ภายนอกเพื่อจัดส่งข้อความ{" "}
                              <Link
                                href="/privacy#sharing"
                                className="font-medium text-[var(--accent-blue)] hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                อ่านเพิ่มเติม
                              </Link>
                              <span className="text-[var(--error)] text-[10px] ml-0.5">*</span>
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {/* 3. Marketing — Optional */}
                      <FormField
                        control={form.control}
                        name="consentMarketing"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-2.5 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-[1.5px] border-[var(--border-default)] data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                              />
                            </FormControl>
                            <FormLabel className="text-xs text-[var(--text-muted)] font-normal leading-relaxed">
                              รับข่าวสาร โปรโมชั่น และข้อเสนอพิเศษทาง SMS/Email จาก SMSOK{" "}
                              <span className="text-[11px] text-[var(--text-secondary)]">(ไม่บังคับ)</span>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !termsAccepted || !passwordsMatch || hasBlockingDuplicate}
                      className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-lg text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(var(--accent-rgb),0.25)] group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังส่ง OTP...</span>
                      ) : (
                        <span className="flex items-center gap-2">สมัครสมาชิก<ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>

              <CardFooter className="justify-center pb-8 pt-4">
                <p className="text-[13px] text-[var(--text-muted)]">
                  มีบัญชีอยู่แล้ว?{" "}
                  <Link href="/login" className="text-[var(--accent-blue)] hover:underline transition-colors duration-150">เข้าสู่ระบบ</Link>
                </p>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-0 pt-8 px-5 sm:px-8">
                <button
                  onClick={() => { setStep("form"); setOtpCode(""); setOtpError(""); }}
                  className="inline-flex items-center gap-1 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 mb-4 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> แก้ไขข้อมูล
                </button>
                <div className="w-12 h-12 rounded-full bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">ยืนยันเบอร์โทรศัพท์</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">ส่ง OTP ไปที่ {form.getValues("phone")}</p>
                {otpRef && <p className="text-[var(--text-muted)] text-[11px] mt-1 font-mono">REF: {otpRef.slice(0, 8).toUpperCase()}</p>}
              </CardHeader>

              <CardContent className="px-5 sm:px-8 pt-6 pb-2">

                {otpError && (
                  <div className="mb-4 p-3 rounded-lg bg-[rgba(var(--error-rgb),0.06)] border border-[rgba(var(--error-rgb),0.15)] text-[var(--error)] text-[13px] text-center">
                    {otpError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => {
                        setOtpCode(value);
                        if (value.length === 6) {
                          setTimeout(() => handleVerifyOtp(), 100);
                        }
                      }}
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="w-12 h-14 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] text-2xl font-bold font-mono rounded-lg data-[active=true]:border-[var(--accent)] data-[active=true]:ring-[rgba(var(--accent-rgb),0.12)]"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{countdown > 0 ? `หมดอายุใน ${fmtCountdown(countdown)}` : "OTP หมดอายุแล้ว"}</span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || otpPending}
                      className="text-[var(--accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {resendCooldown > 0 ? `ส่งอีกครั้ง (${resendCooldown}s)` : "ส่งอีกครั้ง"}
                    </button>
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={otpPending || otpCode.length < 6 || countdown === 0}
                    className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-lg text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(var(--accent-rgb),0.25)] group"
                  >
                    {otpPending ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังยืนยัน...</span>
                    ) : (
                      <span className="flex items-center gap-2">ยืนยัน OTP<ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
                    )}
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="pb-8 pt-4" />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
