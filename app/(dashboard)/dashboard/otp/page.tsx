"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { generateOtpForSession, verifyOtpForSession } from "@/lib/actions/otp";
import { blockNonNumeric, fieldCls } from "@/lib/form-utils";
import CustomSelect from "@/components/ui/CustomSelect";
import { safeErrorMessage } from "@/lib/error-messages";

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    title: "ปลอดภัยสูงสุด",
    desc: "รหัส 6 หลัก สุ่มด้วย crypto-safe algorithm",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "หมดอายุ 5 นาที",
    desc: "TTL 300 วินาที ป้องกันการใช้ซ้ำ",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Rate Limited",
    desc: "3 req/5min per phone + IP dual-key protection",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "ล็อกเอาท์อัตโนมัติ",
    desc: "ลองผิด 5 ครั้ง = ต้องขอรหัสใหม่",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

const purposes = [
  { value: "verify", label: "ยืนยันตัวตน", desc: "สมัครสมาชิก, ยืนยันเบอร์โทร" },
  { value: "login", label: "เข้าสู่ระบบ", desc: "2FA login, passwordless auth" },
  { value: "transaction", label: "ยืนยันธุรกรรม", desc: "โอนเงิน, เปลี่ยนรหัสผ่าน" },
];

function CodeBlock({ title, code, lang }: { title: string; code: string; lang: "request" | "response" }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-2 rounded-t-xl border-b" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{title}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="p-1 rounded-md hover:bg-white/5 transition-colors"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
          )}
        </button>
      </div>
      <pre className={`rounded-b-xl p-4 overflow-x-auto text-[12px] font-mono ${lang === "response" ? "text-emerald-300/80" : "text-cyan-300/80"}`} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderTop: "none" }}>
        {code}
      </pre>
    </div>
  );
}

function OtpTestPanel() {
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("verify");
  const [code, setCode] = useState("");
  const [ref, setRef] = useState("");
  const [step, setStep] = useState<"generate" | "verify">("generate");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleGenerate = async () => {
    if (!phone) return;
    setResult(null);
    setLoading(true);

    startTransition(async () => {
      try {
        const data = await generateOtpForSession({ phone, purpose });
        setRef(data.ref || "");
        setStep("verify");
        setCountdown(data.expiresIn ?? 300);
        setResult({ ok: true, msg: `OTP sent! Ref: ${data.ref || "N/A"}` });
      } catch (error) {
        setResult({
          ok: false,
          msg: safeErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const handleVerify = async () => {
    if (!code) return;
    setResult(null);
    setLoading(true);

    startTransition(async () => {
      try {
        const data = await verifyOtpForSession({ ref, code });
        if (data.verified) {
          setResult({ ok: true, msg: "OTP verified successfully!" });
          setStep("generate");
          setCode("");
          setRef("");
          setCountdown(0);
        } else {
          setResult({ ok: false, msg: "Invalid OTP" });
        }
      } catch (error) {
        setResult({
          ok: false,
          msg: safeErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="glass p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-violet-500/5 blur-[60px]" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="gradient-text-mixed">ทดสอบ OTP</span>
          </h2>
          {countdown > 0 && (
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              หมดอายุใน {mins}:{secs.toString().padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${step === "generate" ? "bg-violet-500/15 text-violet-400 border border-violet-500/20" : "text-[var(--text-muted)]"}`}>
            <span className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold">1</span>
            Generate
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${step === "verify" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "text-[var(--text-muted)]"}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold">2</span>
            Verify
          </div>
        </div>

        {step === "generate" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">เบอร์โทร</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                onKeyDown={blockNonNumeric}
                className={fieldCls(phone && !/^0[689]\d{8}$/.test(phone) ? "error" : undefined, phone && /^0[689]\d{8}$/.test(phone) ? phone : "")}
                placeholder="0891234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">Purpose</label>
              <CustomSelect
                value={purpose}
                onChange={setPurpose}
                options={[
                  { value: "verify", label: "verify" },
                  { value: "login", label: "login" },
                  { value: "transaction", label: "transaction" },
                ]}
              />
            </div>
            <div>
              <button
                onClick={handleGenerate}
                disabled={loading || isPending || !phone}
                className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                )}
                ส่ง OTP
              </button>
              <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                การส่ง OTP จะหัก <span className="text-amber-400">1 เครดิต</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">Ref Code</label>
              <div className="input-glass bg-[var(--bg-surface)] cursor-default text-violet-400 font-mono text-sm">{ref || "—"}</div>
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">OTP Code</label>
              <input
                type="text"
                className="input-glass font-mono text-center text-lg tracking-[0.3em]"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleVerify}
                disabled={loading || isPending || code.length !== 6}
                className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                )}
                Verify
              </button>
              <button
                onClick={() => { setStep("generate"); setCode(""); setRef(""); setCountdown(0); setResult(null); }}
                className="btn-glass px-3 py-2.5 rounded-xl text-sm"
                title="Reset"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium border ${result.ok ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            {result.msg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OtpPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "verify">("generate");

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold gradient-text-mixed">OTP API</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            สร้างและยืนยันรหัส OTP 6 หลักผ่าน REST API — ใช้ 1 เครดิต/OTP
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/api-keys" className="btn-primary px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
            API Key
          </Link>
          <Link href="/dashboard/api-docs" className="btn-glass px-4 py-2.5 text-sm font-medium rounded-xl">
            API Docs
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {features.map((f) => (
          <div key={f.title} className="glass p-4 card-hover">
            <div className={`w-9 h-9 rounded-lg ${f.bg} border flex items-center justify-center mb-3 ${f.color}`}>
              {f.icon}
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{f.title}</h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Flow Diagram */}
      <div className="glass p-6 mb-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5">ขั้นตอนการใช้งาน</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
          {[
            { step: "1", label: "สร้าง API Key", desc: "จากหน้า API Keys" },
            { step: "2", label: "Generate OTP", desc: "POST /otp/send" },
            { step: "3", label: "ผู้ใช้รับ SMS", desc: "รหัส 6 หลัก" },
            { step: "4", label: "Verify OTP", desc: "POST /otp/verify" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center gap-3 sm:flex-1">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-violet-400">{s.step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{s.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{s.desc}</p>
                </div>
              </div>
              {i < 3 && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] hidden sm:block flex-shrink-0 mx-2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Purpose Types */}
      <div className="glass p-6 mb-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">ประเภท OTP (purpose)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {purposes.map((p) => (
            <div key={p.value} className="rounded-xl p-4 border border-[var(--border-subtle)]" style={{ background: "var(--bg-surface)" }}>
              <code className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{p.value}</code>
              <p className="text-sm font-medium text-[var(--text-primary)] mt-2">{p.label}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Tabs */}
      <div className="glass overflow-hidden mb-8">
        <div className="flex border-b border-[var(--border-subtle)]">
          {(["generate", "verify"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-medium transition-all relative ${
                activeTab === tab
                  ? "text-violet-400"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab === "generate" ? "Generate OTP" : "Verify OTP"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-cyan-500" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "generate" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-violet-400 bg-violet-500/15 border border-violet-500/20">POST</span>
                <code className="text-sm font-mono text-[var(--text-primary)]">/api/v1/otp/send</code>
                <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-md ml-auto">3 req/5min</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeBlock
                  title="Request"
                  lang="request"
                  code={`curl -X POST https://api.smsok.com/api/v1/otp/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "0891234567",
    "purpose": "verify"
  }'`}
                />
                <CodeBlock
                  title="Response 201"
                  lang="response"
                  code={`{
  "ref": "ABC123EF",
  "phone": "+66891234567",
  "purpose": "verify",
  "expiresAt": "2026-03-09T10:35:00Z",
  "creditUsed": 1
}`}
                />
              </div>

              <div className="rounded-xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] mt-4">
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Parameters</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[var(--text-muted)]">
                      <th className="text-left pb-2 font-medium">Field</th>
                      <th className="text-left pb-2 font-medium">Type</th>
                      <th className="text-left pb-2 font-medium">Required</th>
                      <th className="text-left pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-secondary)]">
                    <tr className="border-t border-[var(--border-subtle)]">
                      <td className="py-2 font-mono text-cyan-400">phone</td>
                      <td className="py-2">string</td>
                      <td className="py-2"><span className="text-emerald-400">Yes</span></td>
                      <td className="py-2">เบอร์โทร (08x/09x/06x)</td>
                    </tr>
                    <tr className="border-t border-[var(--border-subtle)]">
                      <td className="py-2 font-mono text-cyan-400">purpose</td>
                      <td className="py-2">string</td>
                      <td className="py-2"><span className="text-[var(--text-muted)]">No</span></td>
                      <td className="py-2">verify | login | transaction</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-violet-400 bg-violet-500/15 border border-violet-500/20">POST</span>
                <code className="text-sm font-mono text-[var(--text-primary)]">/api/v1/otp/verify</code>
                <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-md ml-auto">5 attempts max</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeBlock
                  title="Request"
                  lang="request"
                  code={`curl -X POST https://api.smsok.com/api/v1/otp/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ref": "ABC123EF",
    "code": "123456"
  }'`}
                />
                <CodeBlock
                  title="Response 200"
                  lang="response"
                  code={`{
  "valid": true,
  "verified": true,
  "ref": "ABC123EF",
  "phone": "+66891234567",
  "purpose": "verify"
}`}
                />
              </div>

              <div className="rounded-xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] mt-4">
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Error Responses</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-red-400 font-mono font-bold">400</span>
                    <span className="text-[var(--text-secondary)]">OTP ไม่ถูกต้อง (เหลือ N ครั้ง)</span>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-red-400 font-mono font-bold">400</span>
                    <span className="text-[var(--text-secondary)]">ไม่พบ OTP นี้ หรือ OTP หมดอายุแล้ว</span>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-red-400 font-mono font-bold">400</span>
                    <span className="text-[var(--text-secondary)]">OTP ถูกล็อคแล้ว กรุณาขอรหัสใหม่</span>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-orange-400 font-mono font-bold">429</span>
                    <span className="text-[var(--text-secondary)]">Too many requests (rate limited)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Live Test Panel ═══ */}
      <OtpTestPanel />

      {/* Quick Start Code */}
      <div className="glass p-6 mb-8">
        <h2 className="text-base font-semibold gradient-text-cyan mb-4">Quick Start — Node.js</h2>
        <CodeBlock
          title="JavaScript / Node.js"
          lang="request"
          code={`const API_KEY = "sk_live_your_key";
const BASE = "https://api.smsok.com/api/v1";

// 1. Generate OTP
const gen = await fetch(BASE + "/otp/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ phone: "0891234567", purpose: "verify" })
});
const { ref, expiresAt } = await gen.json();

// 2. User enters code from SMS...
const userCode = "123456";

// 3. Verify OTP
const verify = await fetch(BASE + "/otp/verify", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ ref, code: userCode })
});
const { valid } = await verify.json();
console.log(valid ? "OTP correct!" : "Invalid OTP");`}
        />
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/api-keys" className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2">
          สร้าง API Key เลย
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
        <Link href="/dashboard/api-docs" className="btn-glass px-5 py-2.5 text-sm font-medium rounded-xl">
          ดู API Docs ทั้งหมด
        </Link>
      </div>
    </div>
  );
}
