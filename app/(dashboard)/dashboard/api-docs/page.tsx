"use client";

import { useState } from "react";
import Link from "next/link";

type Endpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  description: string;
  category: string;
  headers?: string;
  body?: string;
  response: string;
  rateLimit?: string;
};

const methodColors: Record<string, string> = {
  GET: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  POST: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/20",
};

const categories = ["ทั้งหมด", "SMS", "OTP", "Contacts", "Templates", "Account", "Admin"];

const endpoints: Endpoint[] = [
  // SMS
  {
    method: "POST", path: "/api/v1/sms/send", title: "Send SMS", category: "SMS",
    description: "ส่ง SMS ไปยังเบอร์ปลายทาง (1 เบอร์)",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "recipient": "0891234567",
  "message": "สวัสดีครับ ข้อความทดสอบ",
  "senderName": "EasySlip"
}`,
    response: `{
  "id": "msg_abc123",
  "status": "sent",
  "creditCost": 1,
  "sentAt": "2026-03-09T10:30:00Z"
}`,
    rateLimit: "10 req/min",
  },
  {
    method: "POST", path: "/api/v1/sms/batch", title: "Batch Send SMS", category: "SMS",
    description: "ส่ง SMS แบบกลุ่ม (สูงสุด 1,000 เบอร์/ครั้ง)",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "recipients": ["0891234567", "0812345678"],
  "message": "โปรโมชัน! ลด 50% วันนี้เท่านั้น",
  "senderName": "EasySlip"
}`,
    response: `{
  "totalMessages": 2,
  "totalCredits": 2,
  "sentCount": 2,
  "failedCount": 0
}`,
    rateLimit: "5 req/min",
  },
  {
    method: "GET", path: "/api/v1/sms/status?messageId=msg_abc", title: "Message Status", category: "SMS",
    description: "ตรวจสอบสถานะข้อความที่ส่งไป",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "id": "msg_abc123",
  "recipient": "0891234567",
  "status": "delivered",
  "senderName": "EasySlip",
  "creditCost": 1,
  "sentAt": "2026-03-09T10:30:00Z",
  "deliveredAt": "2026-03-09T10:30:05Z"
}`,
  },
  {
    method: "POST", path: "/api/v1/sms/scheduled", title: "Schedule SMS", category: "SMS",
    description: "ตั้งเวลาส่ง SMS ล่วงหน้า",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "recipient": "0891234567",
  "message": "แจ้งเตือนนัดหมาย พรุ่งนี้ 10:00",
  "senderName": "EasySlip",
  "scheduledAt": "2026-03-10T03:00:00Z"
}`,
    response: `{
  "id": "sch_xyz456",
  "status": "pending",
  "scheduledAt": "2026-03-10T03:00:00Z"
}`,
  },

  // OTP
  {
    method: "POST", path: "/api/v1/otp/send", title: "Generate OTP", category: "OTP",
    description: "สร้างและส่งรหัส OTP 6 หลัก (หมดอายุ 5 นาที)",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "phone": "0891234567",
  "purpose": "verify"
}`,
    response: `{
  "ref": "ABC123EF",
  "phone": "+66891234567",
  "purpose": "verify",
  "expiresAt": "2026-03-09T10:35:00Z",
  "creditUsed": 1
}`,
    rateLimit: "3 req/5min per phone",
  },
  {
    method: "POST", path: "/api/v1/otp/verify", title: "Verify OTP", category: "OTP",
    description: "ยืนยันรหัส OTP (สูงสุด 5 ครั้ง)",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "ref": "ABC123EF",
  "code": "123456"
}`,
    response: `{
  "valid": true,
  "verified": true,
  "ref": "ABC123EF",
  "phone": "+66891234567",
  "purpose": "verify"
}`,
    rateLimit: "10 req/15min",
  },

  // Contacts
  {
    method: "GET", path: "/api/v1/contacts", title: "List Contacts", category: "Contacts",
    description: "ดึงรายชื่อผู้ติดต่อทั้งหมด (pagination)",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "contacts": [
    { "id": "ct_1", "name": "สมชาย", "phone": "0891234567" }
  ],
  "pagination": { "page": 1, "total": 50, "totalPages": 5 }
}`,
  },
  {
    method: "POST", path: "/api/v1/contacts", title: "Create Contact", category: "Contacts",
    description: "เพิ่มผู้ติดต่อใหม่",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "name": "สมชาย ใจดี",
  "phone": "0891234567",
  "email": "somchai@example.com",
  "tags": "vip,customer"
}`,
    response: `{
  "id": "ct_abc",
  "name": "สมชาย ใจดี",
  "phone": "0891234567"
}`,
  },
  {
    method: "POST", path: "/api/v1/contacts/import", title: "Import Contacts", category: "Contacts",
    description: "นำเข้าผู้ติดต่อจำนวนมาก (CSV format)",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "contacts": [
    { "name": "สมชาย", "phone": "0891234567" },
    { "name": "สมหญิง", "phone": "0812345678" }
  ]
}`,
    response: `{
  "imported": 2,
  "skipped": 0,
  "errors": []
}`,
    rateLimit: "5 req/min",
  },

  // Templates
  {
    method: "GET", path: "/api/v1/templates", title: "List Templates", category: "Templates",
    description: "ดึงเทมเพลตข้อความทั้งหมด",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "templates": [
    {
      "id": "tpl_1",
      "name": "OTP Template",
      "content": "รหัส OTP: {{code}}",
      "category": "otp"
    }
  ]
}`,
  },
  {
    method: "POST", path: "/api/v1/templates", title: "Create Template", category: "Templates",
    description: "สร้างเทมเพลตข้อความใหม่",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "name": "Welcome Message",
  "content": "สวัสดี {{name}}! ยินดีต้อนรับ",
  "category": "general"
}`,
    response: `{
  "id": "tpl_abc",
  "name": "Welcome Message",
  "content": "สวัสดี {{name}}! ยินดีต้อนรับ"
}`,
  },
  {
    method: "POST", path: "/api/v1/templates/render", title: "Render Template", category: "Templates",
    description: "แปลงเทมเพลตเป็นข้อความจริง",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "templateId": "tpl_abc",
  "variables": { "name": "สมชาย" }
}`,
    response: `{
  "rendered": "สวัสดี สมชาย! ยินดีต้อนรับ"
}`,
  },

  // Account
  {
    method: "GET", path: "/api/v1/balance", title: "Check Balance", category: "Account",
    description: "ตรวจสอบเครดิตคงเหลือ",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "credits": 1500,
  "name": "สมชาย ใจดี",
  "email": "user@example.com"
}`,
  },
  {
    method: "GET", path: "/api/v1/analytics", title: "Usage Analytics", category: "Account",
    description: "ดูสถิติการใช้งาน SMS",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "today": { "total": 150, "delivered": 145, "failed": 5 },
  "thisMonth": { "total": 3200, "delivered": 3150, "failed": 50 }
}`,
  },
  {
    method: "POST", path: "/api/v1/api-keys", title: "Create API Key", category: "Account",
    description: "สร้าง API Key ใหม่",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{ "name": "Production Key" }`,
    response: `{
  "id": "key_abc",
  "name": "Production Key",
  "key": "sk_live_aBcDeFgH...",
  "createdAt": "2026-03-09T10:00:00Z"
}`,
  },
  {
    method: "GET", path: "/api/v1/senders", title: "List Sender Names", category: "Account",
    description: "ดูชื่อผู้ส่งที่ได้รับอนุมัติ",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "senders": [
    { "name": "EasySlip", "status": "approved" },
    { "name": "MyBrand", "status": "pending" }
  ]
}`,
  },

  // Admin
  {
    method: "GET", path: "/api/v1/admin/senders", title: "Pending Approvals", category: "Admin",
    description: "ดูรายการชื่อผู้ส่งที่รออนุมัติ (Admin only)",
    headers: "Authorization: Bearer <ADMIN_KEY>",
    response: `{
  "pending": [
    { "id": "sn_1", "name": "NewBrand", "user": "สมชาย" }
  ]
}`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-white"
      title="Copy"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
      )}
    </button>
  );
}

export default function ApiDocsPage() {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");

  const filtered = endpoints.filter((ep) => {
    const matchCategory = activeCategory === "ทั้งหมด" || ep.category === activeCategory;
    const matchSearch = !search || ep.title.toLowerCase().includes(search.toLowerCase()) || ep.path.includes(search) || ep.description.includes(search);
    return matchCategory && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text-mixed mb-2">API Documentation</h1>
          <p className="text-[var(--text-secondary)] text-sm">SMSOK REST API v1 — {endpoints.length} endpoints</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/api-keys" className="btn-primary px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
            API Keys
          </Link>
        </div>
      </div>

      {/* Base URL + Auth */}
      <div className="glass p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Base URL</span>
            <code className="block mt-1 text-cyan-300/80 font-mono text-sm bg-[var(--bg-surface)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
              https://api.smsok.com
            </code>
          </div>
          <div>
            <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Authentication</span>
            <code className="block mt-1 text-violet-300/80 font-mono text-sm bg-[var(--bg-surface)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
              Authorization: Bearer &lt;API_KEY&gt;
            </code>
          </div>
        </div>
      </div>

      {/* Search + Categories */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหา endpoint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass pl-10 w-full"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rate Limit Info */}
      <div className="glass p-4 mb-6 flex items-center gap-3 border-amber-500/10">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)] font-medium">Rate Limiting</p>
          <p className="text-[11px] text-[var(--text-muted)]">API ถูกจำกัดตามประเภท — OTP: 3 req/5min, SMS: 10 req/min, General: 60 req/min — Response 429 เมื่อเกินลิมิต</p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-5">
        {filtered.map((ep) => (
          <div key={ep.path + ep.method} className="glass p-6 card-hover">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`${methodColors[ep.method]} text-[10px] font-bold px-2.5 py-1 rounded-lg border`}>
                {ep.method}
              </span>
              <code className="text-[var(--text-primary)] font-mono text-sm">{ep.path}</code>
              {ep.rateLimit && (
                <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-md ml-auto hidden sm:inline">
                  {ep.rateLimit}
                </span>
              )}
            </div>

            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{ep.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-5">{ep.description}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Request */}
              <div>
                <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Request</p>
                {ep.headers && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 mb-2">
                    <p className="text-[9px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Headers</p>
                    <code className="text-cyan-300/80 font-mono text-xs">{ep.headers}</code>
                  </div>
                )}
                {ep.body ? (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 relative">
                    <p className="text-[9px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Body</p>
                    <pre className="text-cyan-300/80 font-mono text-xs whitespace-pre overflow-x-auto">{ep.body}</pre>
                    <CopyButton text={ep.body} />
                  </div>
                ) : (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-muted)] italic">ไม่มี Request Body</p>
                  </div>
                )}
              </div>

              {/* Response */}
              <div>
                <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Response <span className="text-emerald-400">200</span></p>
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 relative">
                  <pre className="text-emerald-300/80 font-mono text-xs whitespace-pre overflow-x-auto">{ep.response}</pre>
                  <CopyButton text={ep.response} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] text-sm">ไม่พบ endpoint ที่ค้นหา</p>
        </div>
      )}

      {/* Error Codes */}
      <div className="glass p-6 mt-8">
        <h3 className="text-base font-semibold gradient-text-mixed mb-4">Error Codes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { code: "400", label: "Bad Request", desc: "ข้อมูลไม่ถูกต้อง", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { code: "401", label: "Unauthorized", desc: "API Key ไม่ถูกต้อง", color: "text-red-400 bg-red-500/10 border-red-500/20" },
            { code: "429", label: "Too Many Requests", desc: "เกินลิมิต rate limit", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
            { code: "500", label: "Server Error", desc: "เกิดข้อผิดพลาดภายใน", color: "text-red-400 bg-red-500/10 border-red-500/20" },
          ].map((err) => (
            <div key={err.code} className={`rounded-xl p-3 border ${err.color}`}>
              <span className="text-lg font-bold">{err.code}</span>
              <p className="text-xs font-medium mt-0.5">{err.label}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{err.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
