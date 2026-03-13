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
import { Send, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Smartphone, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { clearLogoutMarker } from "@/components/AuthGuard";

const formSchema = registerSchema.extend({
  confirmPassword: z.string(),
  consentService: z.literal(true, { error: "กรุณายอมรับข้อกำหนดการใช้งาน" }),
  consentThirdParty: z.literal(true, { error: "กรุณายอมรับการส่งข้อมูลให้ผู้ให้บริการภายนอก" }),
  consentMarketing: z.boolean(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;
type Step = "form" | "otp";

const RESEND_COOLDOWN = 60;
const OTP_EXPIRY = 5 * 60;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [formError, setFormError] = useState("");

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpRef, setOtpRef] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(OTP_EXPIRY);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpPending, setOtpPending] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      consentService: false as unknown as true,
      consentThirdParty: false as unknown as true,
      consentMarketing: false,
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const consentService = form.watch("consentService");
  const consentThirdParty = form.watch("consentThirdParty");
  const isSubmitting = form.formState.isSubmitting;
  const termsAccepted = consentService === true && consentThirdParty === true;

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== "otp") return;
    const t = setInterval(() => {
      setCountdown((v) => Math.max(0, v - 1));
      setResendCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step, otpRef]);

  const passwordChecks = [
    { label: "8 ตัวอักษรขึ้นไป", pass: password.length >= 8 },
    { label: "มีตัวพิมพ์ใหญ่", pass: /[A-Z]/.test(password) },
    { label: "มีตัวเลข", pass: /[0-9]/.test(password) },
  ];
  const strengthCount = passwordChecks.filter((c) => c.pass).length;

  async function handleSendOtp(data: FormValues) {
    setFormError("");
    try {
      const result: RegisterOtpSendResponse = await generateOtpForRegister(data.phone!);
      setOtpRef(result.ref);
      setCountdown(OTP_EXPIRY);
      setResendCooldown(RESEND_COOLDOWN);
      setStep("otp");
      toast.success("ส่ง OTP สำเร็จ");
      if (result.delivery === "debug") {
        setDebugCode(result.debugCode ?? null);
      }
    } catch (e) {
      const msg = safeErrorMessage(e) || "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setFormError(msg);
      toast.error(msg);
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
      if (result.delivery === "debug") {
        setDebugCode(result.debugCode ?? null);
      }
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
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg-base)]">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-10 flex items-center gap-1.5 text-[var(--text-muted)] hover:text-white transition-colors duration-200"
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

        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-lg shadow-none">
          {step === "form" ? (
            <>
              <CardHeader className="text-center pb-0 pt-8 px-8">
                <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-[var(--bg-base)]" />
                  </div>
                  <span className="text-xl font-bold text-white">SMSOK</span>
                </Link>
                <h1 className="text-2xl font-bold text-white">สร้างบัญชีใหม่</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">เริ่มต้นส่ง SMS ได้ทันที</p>
              </CardHeader>

              <CardContent className="px-8 pt-6 pb-2">
                {formError && (
                  <div className="mb-4 p-3 rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] text-[var(--error)] text-[13px] text-center">
                    {formError}
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSendOtp)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">ชื่อ</FormLabel>
                            <FormControl>
                              <Input placeholder="สมชาย" className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]" {...field} />
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
                              <Input placeholder="ใจดี" className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]" {...field} />
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
                            <Input type="email" placeholder="you@example.com" onKeyDown={blockThai} className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                            เบอร์โทร <span className="text-[var(--accent)] text-[10px] normal-case">*ใช้รับ OTP</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="tel" inputMode="numeric" maxLength={10} placeholder="0891234567" onKeyDown={blockNonNumeric} className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]" {...field} />
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
                          <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">รหัสผ่าน</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg pr-11 focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
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
                                placeholder="••••••••"
                                className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg pr-11 focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
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
                        </FormItem>
                      )}
                    />

                    {/* PDPA Consent */}
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                        ความยินยอม
                      </p>

                      {/* Required Group */}
                      <div className="rounded-[10px] border border-[var(--border-default)]/50 bg-white/[0.02] p-3.5 space-y-3.5">
                        {/* 1. Service Terms — Required */}
                        <FormField
                          control={form.control}
                          name="consentService"
                          render={({ field }) => (
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-[#3a4049] data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                                />
                              </FormControl>
                              <div className="min-w-0 space-y-1">
                                <FormLabel className="block text-[13px] text-[var(--text-secondary)] font-normal leading-relaxed break-words">
                                  ฉันยอมรับ{" "}
                                  <Link
                                    href="/terms"
                                    className="font-medium text-[var(--accent-blue)] hover:underline"
                                    target="_blank"
                                  >
                                    ข้อกำหนดการใช้งาน
                                  </Link>
                                  {" "}และ{" "}
                                  <Link
                                    href="/privacy"
                                    className="font-medium text-[var(--accent-blue)] hover:underline"
                                    target="_blank"
                                  >
                                    นโยบายความเป็นส่วนตัว
                                  </Link>
                                </FormLabel>
                                <span className="inline-flex w-fit rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
                                  บังคับ
                                </span>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* 2. Third-Party — Required */}
                        <FormField
                          control={form.control}
                          name="consentThirdParty"
                          render={({ field }) => (
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-[#3a4049] data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                                />
                              </FormControl>
                              <div className="min-w-0 space-y-1">
                                <FormLabel className="block text-[13px] text-[var(--text-secondary)] font-normal leading-relaxed break-words">
                                  ฉันยินยอมให้ส่งข้อมูลแก่ผู้ให้บริการ SMS ภายนอกเพื่อจัดส่งข้อความ{" "}
                                  <Link
                                    href="/privacy#third-party"
                                    className="font-medium text-[var(--accent-blue)] hover:underline"
                                    target="_blank"
                                  >
                                    อ่านเพิ่มเติม
                                  </Link>
                                </FormLabel>
                                <span className="inline-flex w-fit rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
                                  บังคับ
                                </span>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* 3. Marketing — Optional (outside required group) */}
                      <FormField
                        control={form.control}
                        name="consentMarketing"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-[#3a4049] data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                              />
                            </FormControl>
                            <FormLabel className="text-[13px] text-[var(--text-muted)] font-normal leading-relaxed">
                              รับข่าวสาร โปรโมชั่น และข้อเสนอพิเศษทาง SMS/Email จาก SMSOK{" "}
                              <span className="text-[11px] text-[#556677]">(ไม่บังคับ)</span>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !termsAccepted}
                      className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-xl text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,255,167,0.25)] group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังส่ง OTP...</span>
                      ) : (
                        <span className="flex items-center gap-2">รับ OTP ยืนยัน<ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
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
              <CardHeader className="text-center pb-0 pt-8 px-8">
                <button
                  onClick={() => { setStep("form"); setOtpCode(""); setOtpError(""); }}
                  className="inline-flex items-center gap-1 text-[13px] text-[var(--text-muted)] hover:text-white transition-colors duration-200 mb-4 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> แก้ไขข้อมูล
                </button>
                <div className="w-12 h-12 rounded-full bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h1 className="text-2xl font-bold text-white">ยืนยันเบอร์โทรศัพท์</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">ส่ง OTP ไปที่ {form.getValues("phone")}</p>
                {otpRef && <p className="text-[var(--text-muted)] text-[11px] mt-1 font-mono">REF: {otpRef.slice(0, 8).toUpperCase()}</p>}
              </CardHeader>

              <CardContent className="px-8 pt-6 pb-2">
                {debugCode && (
                  <div className="mb-4 p-3 rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] text-amber-300 text-sm text-center">
                    <span className="opacity-60 text-xs">DEV — OTP: </span>
                    <span className="font-mono font-bold tracking-widest">{debugCode}</span>
                  </div>
                )}
                {otpError && (
                  <div className="mb-4 p-3 rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] text-[var(--error)] text-[13px] text-center">
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
                            className="w-12 h-14 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white text-2xl font-bold font-mono rounded-lg data-[active=true]:border-[var(--accent)] data-[active=true]:ring-[rgba(0,255,167,0.12)]"
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
                    className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-xl text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,255,167,0.25)] group"
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
