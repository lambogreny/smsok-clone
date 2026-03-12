"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "@/lib/actions";
import { safeErrorMessage } from "@/lib/error-messages";
import { blockNonNumeric } from "@/lib/form-utils";

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
import { Send, ArrowLeft, ArrowRight, Lock, CheckCircle, Loader2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  phone: z.string().regex(/^0[0-9]\d{8}$/, "เบอร์โทรไม่ถูกต้อง (ตัวอย่าง: 0891234567)"),
});

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");

  const form = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phone: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: FormValues) {
    setErrorMsg("");
    try {
      await forgotPassword(data.phone);
      setSubmittedPhone(data.phone);
      setSuccess(true);
    } catch (e) {
      setErrorMsg(safeErrorMessage(e));
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
          {success ? (
            <>
              <CardHeader className="text-center pb-0 pt-8 px-8">
                <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-[var(--bg-base)]" />
                  </div>
                  <span className="text-xl font-bold text-white">SMSOK</span>
                </Link>
                <div className="w-12 h-12 rounded-full bg-[rgba(var(--success-rgb),0.08)] border border-[rgba(var(--success-rgb),0.15)] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-[var(--success)]" />
                </div>
                <h1 className="text-2xl font-bold text-white">ส่งลิงก์รีเซ็ตแล้ว</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                  ตรวจสอบ SMS ที่เบอร์ <span className="text-white">{submittedPhone}</span>
                </p>
              </CardHeader>
              <CardContent className="px-8 pt-6 pb-8">
                <Link href="/login">
                  <Button className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-xl text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,255,167,0.25)] group">
                    <span className="flex items-center gap-2">
                      ไปหน้า Login
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-0 pt-8 px-8">
                <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-[var(--bg-base)]" />
                  </div>
                  <span className="text-xl font-bold text-white">SMSOK</span>
                </Link>
                <div className="w-12 h-12 rounded-full bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h1 className="text-2xl font-bold text-white">ลืมรหัสผ่าน</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">กรอกเบอร์โทรเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
              </CardHeader>

              <CardContent className="px-8 pt-6 pb-2">
                {errorMsg && (
                  <div className="mb-4 p-3 rounded-lg bg-[rgba(var(--error-rgb),0.06)] border border-[rgba(var(--error-rgb),0.15)] text-[var(--error)] text-[13px] text-center">
                    {errorMsg}
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                            เบอร์โทรศัพท์
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="0891234567"
                              onKeyDown={blockNonNumeric}
                              className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                              autoFocus
                              {...field}
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
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังส่ง SMS...</span>
                      ) : (
                        <span className="flex items-center gap-2">ส่งลิงก์รีเซ็ต<ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>

              <CardFooter className="justify-center pb-8 pt-4">
                <p className="text-[13px] text-[var(--text-muted)]">
                  จำรหัสได้แล้ว?{" "}
                  <Link href="/login" className="text-[var(--accent-blue)] hover:underline transition-colors duration-150">เข้าสู่ระบบ</Link>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
