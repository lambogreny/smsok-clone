"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  creditCost?: string;
  responseFields?: { name: string; type: string; description: string }[];
  errors?: { code: string; description: string }[];
};

const methodColors: Record<string, string> = {
  GET: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)]",
  POST: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)]",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  DELETE: "bg-[rgba(var(--error-rgb,239,68,68),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb,239,68,68),0.2)]",
};

const methodDotColors: Record<string, string> = {
  GET: "bg-[var(--accent)]",
  POST: "bg-[var(--accent)]",
  PUT: "bg-amber-400",
  DELETE: "bg-[var(--error)]",
};

const categories = ["ทั้งหมด", "SMS", "OTP", "Contacts", "Templates", "Account", "Admin"];

const endpoints: Endpoint[] = [
  // SMS
  {
    method: "POST", path: "/api/v1/sms/send", title: "Send SMS", category: "SMS",
    description: "ส่ง SMS ไปยังเบอร์ปลายทาง (1 เบอร์) — ใช้ 1 SMS",
    headers: "Authorization: Bearer <API_KEY>",
    creditCost: "1 SMS",
    body: `{
  "sender": "EasySlip",
  "to": "0891234567",
  "message": "สวัสดีครับ ข้อความทดสอบ"
}`,
    response: `{
  "id": "cm9abc123xyz",
  "status": "pending",
  "sms_used": 1,
  "sms_remaining": 1499
}`,
    rateLimit: "10 req/min",
    responseFields: [
      { name: "id", type: "string", description: "รหัสข้อความ (cuid)" },
      { name: "status", type: "string", description: "สถานะ: pending, sent, delivered, failed" },
      { name: "sms_used", type: "number", description: "SMS ที่ใช้" },
      { name: "sms_remaining", type: "number", description: "SMS คงเหลือ" },
    ],
    errors: [
      { code: "400", description: "ข้อมูลไม่ถูกต้อง (sender/to/message)" },
      { code: "401", description: "API Key ไม่ถูกต้อง" },
      { code: "402", description: "SMS ไม่เพียงพอ" },
      { code: "429", description: "เกิน Rate Limit (10 req/min)" },
    ],
  },
  {
    method: "POST", path: "/api/v1/sms/batch", title: "Batch Send SMS", category: "SMS",
    description: "ส่ง SMS แบบกลุ่ม (สูงสุด 10,000 เบอร์/ครั้ง) — ใช้ 1 SMS/เบอร์",
    headers: "Authorization: Bearer <API_KEY>",
    creditCost: "1 SMS / เบอร์",
    body: `{
  "sender": "EasySlip",
  "to": ["0891234567", "0812345678"],
  "message": "โปรโมชัน! ลด 50% วันนี้เท่านั้น"
}`,
    response: `{
  "total_messages": 2,
  "sms_used": 2,
  "sms_remaining": 1498
}`,
    rateLimit: "5 req/min",
    responseFields: [
      { name: "total_messages", type: "number", description: "จำนวนข้อความทั้งหมด" },
      { name: "sms_used", type: "number", description: "SMS ที่ใช้ทั้งหมด" },
      { name: "sms_remaining", type: "number", description: "SMS คงเหลือหลังส่ง" },
    ],
    errors: [
      { code: "400", description: "ข้อมูลไม่ถูกต้อง หรือเบอร์เกิน 10,000" },
      { code: "401", description: "API Key ไม่ถูกต้อง" },
      { code: "402", description: "SMS ไม่เพียงพอ" },
      { code: "429", description: "เกิน Rate Limit (5 req/min)" },
    ],
  },
  {
    method: "GET", path: "/api/v1/sms/status?id=msg_abc", title: "Message Status", category: "SMS",
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
    responseFields: [
      { name: "id", type: "string", description: "รหัสข้อความ" },
      { name: "recipient", type: "string", description: "เบอร์ปลายทาง" },
      { name: "status", type: "string", description: "สถานะ: sent, delivered, failed" },
      { name: "senderName", type: "string", description: "ชื่อผู้ส่ง" },
      { name: "creditCost", type: "number", description: "SMS ที่ใช้" },
      { name: "sentAt", type: "string (ISO8601)", description: "เวลาที่ส่ง" },
      { name: "deliveredAt", type: "string (ISO8601)", description: "เวลาที่ส่งถึง" },
    ],
  },
  {
    method: "POST", path: "/api/v1/sms/scheduled", title: "Schedule SMS", category: "SMS",
    description: "ตั้งเวลาส่ง SMS ล่วงหน้า",
    headers: "Authorization: Bearer <API_KEY>",
    body: `{
  "to": "0891234567",
  "message": "แจ้งเตือนนัดหมาย พรุ่งนี้ 10:00",
  "sender": "EasySlip",
  "scheduledAt": "2026-03-10T03:00:00Z"
}`,
    response: `{
  "id": "sch_xyz456",
  "status": "pending",
  "scheduledAt": "2026-03-10T03:00:00Z"
}`,
    responseFields: [
      { name: "id", type: "string", description: "รหัสการตั้งเวลา" },
      { name: "status", type: "string", description: "สถานะ: pending, sent, cancelled" },
      { name: "scheduledAt", type: "string (ISO8601)", description: "เวลาที่ตั้งไว้" },
    ],
  },

  // OTP
  {
    method: "POST", path: "/api/v1/otp/send", title: "Generate OTP", category: "OTP",
    description: "สร้างและส่งรหัส OTP 6 หลัก (หมดอายุ 5 นาที) — ใช้ 1 SMS/ครั้ง",
    headers: "Authorization: Bearer <API_KEY>",
    creditCost: "1 SMS / OTP",
    body: `{
  "phone": "0891234567",
  "purpose": "verify"
}`,
    response: `{
  "id": "cm9otp123xyz",
  "ref": "ABC123EF",
  "phone": "+66891234567",
  "purpose": "verify",
  "expiresAt": "2026-03-09T10:35:00Z",
  "expiresIn": 300,
  "smsUsed": 1,
  "smsRemaining": 1499
}`,
    rateLimit: "3 req/5min per phone",
    responseFields: [
      { name: "ref", type: "string", description: "รหัสอ้างอิง OTP (ใช้ใน verify)" },
      { name: "phone", type: "string", description: "เบอร์ที่ส่ง (E.164)" },
      { name: "purpose", type: "string", description: "วัตถุประสงค์: verify, login, transaction" },
      { name: "expiresAt", type: "string (ISO8601)", description: "เวลาหมดอายุ" },
      { name: "expiresIn", type: "number", description: "วินาทีที่เหลือก่อนหมดอายุ (300)" },
      { name: "smsUsed", type: "number", description: "SMS ที่ใช้" },
      { name: "smsRemaining", type: "number", description: "SMS คงเหลือ" },
    ],
    errors: [
      { code: "400", description: "เบอร์โทรศัพท์ไม่ถูกต้อง" },
      { code: "401", description: "API Key ไม่ถูกต้อง" },
      { code: "402", description: "SMS ไม่เพียงพอ" },
      { code: "429", description: "ส่ง OTP บ่อยเกินไป (สูงสุด 3 ครั้ง/5 นาที/เบอร์)" },
    ],
  },
  {
    method: "POST", path: "/api/v1/otp/verify", title: "Verify OTP", category: "OTP",
    description: "ยืนยันรหัส OTP (สูงสุด 5 ครั้ง — เกินจะถูกล็อค)",
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
    responseFields: [
      { name: "valid", type: "boolean", description: "รหัสถูกต้องหรือไม่" },
      { name: "verified", type: "boolean", description: "ยืนยันสำเร็จหรือไม่" },
      { name: "ref", type: "string", description: "รหัสอ้างอิง" },
      { name: "phone", type: "string", description: "เบอร์ที่ยืนยัน" },
      { name: "purpose", type: "string", description: "วัตถุประสงค์" },
    ],
    errors: [
      { code: "400", description: "รหัส OTP ไม่ถูกต้อง (แสดงจำนวนครั้งที่เหลือ)" },
      { code: "401", description: "API Key ไม่ถูกต้อง" },
      { code: "404", description: "ไม่พบ OTP นี้" },
      { code: "410", description: "OTP หมดอายุหรือถูกล็อค" },
      { code: "429", description: "เกิน Rate Limit" },
    ],
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
    responseFields: [
      { name: "contacts", type: "array", description: "รายชื่อผู้ติดต่อ" },
      { name: "pagination.page", type: "number", description: "หน้าปัจจุบัน" },
      { name: "pagination.total", type: "number", description: "จำนวนทั้งหมด" },
      { name: "pagination.totalPages", type: "number", description: "จำนวนหน้าทั้งหมด" },
    ],
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
    responseFields: [
      { name: "id", type: "string", description: "รหัสผู้ติดต่อ" },
      { name: "name", type: "string", description: "ชื่อ" },
      { name: "phone", type: "string", description: "เบอร์โทรศัพท์" },
    ],
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
    responseFields: [
      { name: "imported", type: "number", description: "จำนวนที่นำเข้าสำเร็จ" },
      { name: "skipped", type: "number", description: "จำนวนที่ข้าม" },
      { name: "errors", type: "array", description: "รายการข้อผิดพลาด" },
    ],
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
    responseFields: [
      { name: "templates", type: "array", description: "รายการเทมเพลต" },
      { name: "templates[].id", type: "string", description: "รหัสเทมเพลต" },
      { name: "templates[].name", type: "string", description: "ชื่อเทมเพลต" },
      { name: "templates[].content", type: "string", description: "เนื้อหา (รองรับ {{variable}})" },
      { name: "templates[].category", type: "string", description: "หมวดหมู่" },
    ],
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
    responseFields: [
      { name: "id", type: "string", description: "รหัสเทมเพลต" },
      { name: "name", type: "string", description: "ชื่อเทมเพลต" },
      { name: "content", type: "string", description: "เนื้อหา" },
    ],
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
    responseFields: [
      { name: "rendered", type: "string", description: "ข้อความที่แปลงแล้ว" },
    ],
  },

  // Account
  {
    method: "GET", path: "/api/v1/balance", title: "ตรวจสอบโควต้า", category: "Account",
    description: "ตรวจสอบจำนวนข้อความคงเหลือ",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "sms_remaining": 1500,
  "name": "สมชาย ใจดี",
  "email": "user@example.com"
}`,
    responseFields: [
      { name: "sms_remaining", type: "number", description: "SMS คงเหลือ" },
      { name: "name", type: "string", description: "ชื่อบัญชี" },
      { name: "email", type: "string", description: "อีเมล" },
    ],
  },
  {
    method: "GET", path: "/api/v1/analytics", title: "Usage Analytics", category: "Account",
    description: "ดูสถิติการใช้งาน SMS",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "today": { "total": 150, "delivered": 145, "failed": 5 },
  "thisMonth": { "total": 3200, "delivered": 3150, "failed": 50 }
}`,
    responseFields: [
      { name: "today.total", type: "number", description: "จำนวนข้อความวันนี้" },
      { name: "today.delivered", type: "number", description: "ส่งสำเร็จวันนี้" },
      { name: "today.failed", type: "number", description: "ส่งไม่สำเร็จวันนี้" },
      { name: "thisMonth.total", type: "number", description: "จำนวนข้อความเดือนนี้" },
    ],
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
    responseFields: [
      { name: "id", type: "string", description: "รหัส API Key" },
      { name: "name", type: "string", description: "ชื่อที่ตั้ง" },
      { name: "key", type: "string", description: "API Key (แสดงครั้งเดียว)" },
      { name: "createdAt", type: "string (ISO8601)", description: "เวลาที่สร้าง" },
    ],
  },
  {
    method: "GET", path: "/api/v1/senders", title: "List Sender Names", category: "Account",
    description: "ดูชื่อผู้ส่งที่ได้รับอนุมัติ",
    headers: "Authorization: Bearer <API_KEY>",
    response: `{
  "senders": [
    { "name": "EasySlip", "status": "APPROVED" },
    { "name": "MyBrand", "status": "PENDING" }
  ]
}`,
    responseFields: [
      { name: "senders", type: "array", description: "รายชื่อผู้ส่ง" },
      { name: "senders[].name", type: "string", description: "ชื่อผู้ส่ง" },
      { name: "senders[].status", type: "string", description: "สถานะ: approved, pending, rejected" },
    ],
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
    responseFields: [
      { name: "pending", type: "array", description: "รายการที่รออนุมัติ" },
      { name: "pending[].id", type: "string", description: "รหัส" },
      { name: "pending[].name", type: "string", description: "ชื่อผู้ส่งที่ขอ" },
      { name: "pending[].user", type: "string", description: "ผู้ขอ" },
    ],
  },
];

// -- Helper: parse JSON body string to field names for Try It form --
function parseBodyFields(body?: string): { key: string; example: string }[] {
  if (!body) return [];
  try {
    const parsed = JSON.parse(body);
    return Object.entries(parsed).map(([key, val]) => ({
      key,
      example: typeof val === "string" ? val : JSON.stringify(val),
    }));
  } catch {
    return [];
  }
}

// -- Helper: generate code examples --
function generateCurl(ep: Endpoint): string {
  const parts = [`curl -X ${ep.method} \\`, `  'https://api.smsok.com${ep.path.split("?")[0]}' \\`];
  if (ep.headers) parts.push(`  -H '${ep.headers}' \\`);
  if (ep.body) {
    parts.push(`  -H 'Content-Type: application/json' \\`);
    parts.push(`  -d '${ep.body.replace(/\n\s*/g, " ").trim()}'`);
  } else {
    // remove trailing backslash from last line
    parts[parts.length - 1] = parts[parts.length - 1].replace(/ \\$/, "");
  }
  return parts.join("\n");
}

function generateJavaScript(ep: Endpoint): string {
  const hasBody = !!ep.body;
  const lines = [
    `const response = await fetch('https://api.smsok.com${ep.path.split("?")[0]}', {`,
    `  method: '${ep.method}',`,
    `  headers: {`,
    `    'Authorization': 'Bearer YOUR_API_KEY',`,
  ];
  if (hasBody) lines.push(`    'Content-Type': 'application/json',`);
  lines.push(`  },`);
  if (hasBody) {
    lines.push(`  body: JSON.stringify(${ep.body!.replace(/\n/g, "\n  ")}),`);
  }
  lines.push(`});`);
  lines.push(``);
  lines.push(`const data = await response.json();`);
  lines.push(`console.log(data);`);
  return lines.join("\n");
}

function generatePython(ep: Endpoint): string {
  const lines = [`import requests`, ``];
  if (ep.body) {
    lines.push(`payload = ${ep.body.replace(/"/g, '"').replace(/\n/g, "\n")}`);
    lines.push(``);
  }
  lines.push(`response = requests.${ep.method.toLowerCase()}(`);
  lines.push(`    'https://api.smsok.com${ep.path.split("?")[0]}',`);
  lines.push(`    headers={'Authorization': 'Bearer YOUR_API_KEY'},`);
  if (ep.body) lines.push(`    json=payload,`);
  lines.push(`)`);
  lines.push(``);
  lines.push(`print(response.json())`);
  return lines.join("\n");
}

// ===== Components =====

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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

function CodeTabs({ endpoint }: { endpoint: Endpoint }) {
  const [activeTab, setActiveTab] = useState<"curl" | "javascript" | "python">("curl");
  const codeMap = {
    curl: generateCurl(endpoint),
    javascript: generateJavaScript(endpoint),
    python: generatePython(endpoint),
  };
  const labels = { curl: "cURL", javascript: "JavaScript", python: "Python" };

  return (
    <div>
      <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Code Examples</p>
      <div className="bg-[var(--code-bg)] rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="flex border-b border-[var(--border-default)]">
          {(Object.keys(codeMap) as Array<keyof typeof codeMap>).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium transition-all ${
                activeTab === tab
                  ? "bg-[rgba(var(--accent-rgb),0.15)] text-[var(--info)] border-b-2 border-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5"
              }`}
            >
              {labels[tab]}
            </button>
          ))}
        </div>
        <div className="p-4 relative">
          <pre className="text-[var(--accent)]/80 font-mono text-xs whitespace-pre overflow-x-auto">{codeMap[activeTab]}</pre>
          <CopyButton text={codeMap[activeTab]} />
        </div>
      </div>
    </div>
  );
}

function TryItPanel({ endpoint }: { endpoint: Endpoint }) {
  const fields = parseBodyFields(endpoint.body);
  const [authToken, setAuthToken] = useState("sk_live_your_api_key_here");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = f.example; });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);

  const handleSend = () => {
    setLoading(true);
    // Simulate API call -- actual calls won't work from docs
    setTimeout(() => {
      setResponse({ status: 200, body: endpoint.response });
      setLoading(false);
    }, 800 + Math.random() * 600);
  };

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (code >= 400 && code < 500) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-[rgba(var(--error-rgb,239,68,68),0.2)] text-[var(--error)] border-[rgba(var(--error-rgb,239,68,68),0.3)]";
  };

  return (
    <div>
      <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        Try It
      </p>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        {/* Auth */}
        <div>
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Authorization</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--accent)] font-mono whitespace-nowrap">Bearer</span>
            <input
              type="text"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-xs font-mono flex-1"
            />
          </div>
        </div>

        {/* Body fields */}
        {fields.length > 0 && (
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Body Parameters</label>
            <div className="mt-1 space-y-2">
              {fields.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--accent)] font-mono w-28 shrink-0 truncate">{f.key}</span>
                  <input
                    type="text"
                    value={fieldValues[f.key] || ""}
                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-xs font-mono flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Sending...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              Send Request
            </>
          )}
        </button>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Response</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusColor(response.status)}`}>
                  {response.status}
                </span>
              </div>
              <div className="bg-[var(--code-bg)] rounded-xl p-3 relative border border-[var(--border-default)]">
                <pre className="text-emerald-300/80 font-mono text-xs whitespace-pre overflow-x-auto">{response.body}</pre>
                <CopyButton text={response.body} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResponseFieldsTable({ fields }: { fields: { name: string; type: string; description: string }[] }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Response Fields</p>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="text-left p-3 text-[var(--text-muted)] font-medium uppercase text-[10px] tracking-wider">Field</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium uppercase text-[10px] tracking-wider">Type</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium uppercase text-[10px] tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="p-3 font-mono text-[var(--accent)]">{f.name}</td>
                <td className="p-3 text-[var(--info)]">{f.type}</td>
                <td className="p-3 text-[var(--text-secondary)]">{f.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EndpointCard({ endpoint, isExpanded, onToggle, id }: { endpoint: Endpoint; isExpanded: boolean; onToggle: () => void; id: string }) {
  return (
    <div id={id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden card-hover">
      {/* Collapsed header -- always visible */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className={`${methodColors[endpoint.method]} text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0`}>
          {endpoint.method}
        </span>
        <code className="text-[var(--text-primary)] font-mono text-sm truncate">{endpoint.path}</code>
        <span className="text-sm text-[var(--text-secondary)] hidden md:inline truncate">{endpoint.title}</span>
        {endpoint.rateLimit && (
          <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-md ml-auto mr-2 hidden sm:inline shrink-0">
            {endpoint.rateLimit}
          </span>
        )}
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--text-muted)] shrink-0"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pt-0 border-t border-[var(--border-default)]">
              <div className="pt-4">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{endpoint.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-5">{endpoint.description}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                  {/* Request */}
                  <div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Request</p>
                    {endpoint.headers && (
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 mb-2">
                        <p className="text-[9px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Headers</p>
                        <code className="text-[var(--accent)]/80 font-mono text-xs">{endpoint.headers}</code>
                      </div>
                    )}
                    {endpoint.body ? (
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 relative">
                        <p className="text-[9px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Body</p>
                        <pre className="text-[var(--accent)]/80 font-mono text-xs whitespace-pre overflow-x-auto">{endpoint.body}</pre>
                        <CopyButton text={endpoint.body} />
                      </div>
                    ) : (
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3">
                        <p className="text-xs text-[var(--text-muted)] italic">ไม่มี Request Body</p>
                      </div>
                    )}
                  </div>

                  {/* Response */}
                  <div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Response <span className="text-emerald-400">200</span></p>
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 relative">
                      <pre className="text-emerald-300/80 font-mono text-xs whitespace-pre overflow-x-auto">{endpoint.response}</pre>
                      <CopyButton text={endpoint.response} />
                    </div>
                  </div>
                </div>

                {/* SMS Cost */}
                {endpoint.creditCost && (
                  <div className="mb-4 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </span>
                    <span className="text-emerald-400 font-medium">ราคา:</span>
                    <span className="text-[var(--text-secondary)]">{endpoint.creditCost}</span>
                  </div>
                )}

                {/* Response Fields Table */}
                {endpoint.responseFields && endpoint.responseFields.length > 0 && (
                  <div className="mb-5">
                    <ResponseFieldsTable fields={endpoint.responseFields} />
                  </div>
                )}

                {/* Endpoint Errors */}
                {endpoint.errors && endpoint.errors.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Error Codes</p>
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody>
                          {endpoint.errors.map((err) => (
                            <tr key={err.code} className="border-b border-[var(--border-default)] last:border-0">
                              <td className="p-3 font-mono text-[var(--error)] w-16 shrink-0">{err.code}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{err.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Code Tabs */}
                <div className="mb-5">
                  <CodeTabs endpoint={endpoint} />
                </div>

                {/* Try It Panel */}
                <TryItPanel endpoint={endpoint} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -- Sidebar --
function Sidebar({
  endpoints: eps,
  activeId,
  onSelect,
}: {
  endpoints: Endpoint[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const grouped = eps.reduce<Record<string, Endpoint[]>>((acc, ep) => {
    if (!acc[ep.category]) acc[ep.category] = [];
    acc[ep.category].push(ep);
    return acc;
  }, {});

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <nav className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Endpoints</p>
      <div className="space-y-1">
        {Object.entries(grouped).map(([category, catEndpoints]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {category}
              <motion.svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-[var(--text-muted)]"
                animate={{ rotate: collapsed[category] ? -90 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </motion.svg>
            </button>
            <AnimatePresence initial={false}>
              {!collapsed[category] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  {catEndpoints.map((ep) => {
                    const epId = `ep-${ep.method}-${ep.path}`;
                    const isActive = activeId === epId;
                    return (
                      <button
                        key={epId}
                        onClick={() => onSelect(epId)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-colors ${
                          isActive
                            ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--info)]"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${methodDotColors[ep.method]}`} />
                        <span className="truncate">{ep.title}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </nav>
  );
}

// ===== Main Page =====
export default function ApiDocsPage() {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeNavId, setActiveNavId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const filtered = endpoints.filter((ep) => {
    const matchCategory = activeCategory === "ทั้งหมด" || ep.category === activeCategory;
    const matchSearch = !search || ep.title.toLowerCase().includes(search.toLowerCase()) || ep.path.includes(search) || ep.description.includes(search);
    return matchCategory && matchSearch;
  });

  const getEpId = (ep: Endpoint) => `ep-${ep.method}-${ep.path}`;

  const toggleEndpoint = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSidebarSelect = useCallback((id: string) => {
    setActiveNavId(id);
    // Expand the endpoint
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Scroll to it
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  // Expand/collapse all
  const expandAll = () => {
    setExpandedIds(new Set(filtered.map(getEpId)));
  };
  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Track active on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNavId(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    const elements = document.querySelectorAll("[id^='ep-']");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [filtered]);

  return (
    <div className="p-6 md:p-8 animate-fade-in-up">
      <div className="flex gap-8 max-w-[1400px]">
        {/* Left Sidebar -- desktop only */}
        <div className="hidden xl:block w-64 shrink-0">
          <Sidebar endpoints={endpoints} activeId={activeNavId} onSelect={handleSidebarSelect} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0" ref={mainRef}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">API Documentation</h1>
              <p className="text-[var(--text-secondary)] text-sm">SMSOK REST API v1 -- {endpoints.length} endpoints</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/api-keys" className="btn-primary px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                API Keys
              </Link>
            </div>
          </div>

          {/* Authentication Section */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--accent)]">Authentication</h2>
                <p className="text-xs text-[var(--text-muted)]">ทุก request ต้องมี API Key ใน Header</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Base URL</span>
                <code className="block mt-1 text-[var(--accent)]/80 font-mono text-sm bg-[var(--bg-surface)] px-3 py-2 rounded-lg border border-[var(--border-default)]">
                  https://api.smsok.com
                </code>
              </div>
              <div>
                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Header Format</span>
                <code className="block mt-1 text-[var(--info)]/80 font-mono text-sm bg-[var(--bg-surface)] px-3 py-2 rounded-lg border border-[var(--border-default)]">
                  Authorization: Bearer &lt;API_KEY&gt;
                </code>
              </div>
            </div>
            <div className="mt-4 bg-[var(--code-bg)] rounded-xl p-4 relative border border-[var(--border-default)]">
              <pre className="text-[var(--accent)]/80 font-mono text-xs whitespace-pre overflow-x-auto">{`// Example: Using fetch
const res = await fetch('https://api.smsok.com/api/v1/balance', {
  headers: { 'Authorization': 'Bearer sk_live_your_api_key' }
});`}</pre>
              <CopyButton text={`const res = await fetch('https://api.smsok.com/api/v1/balance', {\n  headers: { 'Authorization': 'Bearer sk_live_your_api_key' }\n});`} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link href="/dashboard/api-keys" className="text-xs text-[var(--accent)] hover:text-[var(--info)] transition-colors flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                Manage API Keys
              </Link>
            </div>
          </div>

          {/* Search + Categories */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="ค้นหา endpoint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none px-3 py-2 pl-10 w-full"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-[rgba(var(--accent-rgb),0.15)] text-[var(--info)] border border-[rgba(var(--accent-rgb),0.2)]"
                      : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-default)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Expand/Collapse controls */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[var(--text-muted)]">
              {filtered.length} endpoint{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button onClick={expandAll} className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] px-3 py-1.5 text-[11px] rounded-lg flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                Expand All
              </button>
              <button onClick={collapseAll} className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] px-3 py-1.5 text-[11px] rounded-lg flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                Collapse All
              </button>
            </div>
          </div>

          {/* Rate Limit Info */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4 mb-6 flex items-center gap-3 border-amber-500/10">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Rate Limiting</p>
              <p className="text-[11px] text-[var(--text-muted)]">API ถูกจำกัดตามประเภท -- OTP: 3 req/5min, SMS: 10 req/min, General: 60 req/min -- Response 429 เมื่อเกินลิมิต</p>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-3">
            {filtered.map((ep) => {
              const epId = getEpId(ep);
              return (
                <EndpointCard
                  key={epId}
                  id={epId}
                  endpoint={ep}
                  isExpanded={expandedIds.has(epId)}
                  onToggle={() => toggleEndpoint(epId)}
                />
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[var(--text-muted)] text-sm">ไม่พบ endpoint ที่ค้นหา</p>
            </div>
          )}

          {/* Error Codes */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mt-8">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Error Codes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { code: "400", label: "Bad Request", desc: "ข้อมูลไม่ถูกต้อง", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                { code: "401", label: "Unauthorized", desc: "API Key ไม่ถูกต้อง", color: "text-[var(--error)] bg-[rgba(var(--error-rgb,239,68,68),0.1)] border-[rgba(var(--error-rgb,239,68,68),0.2)]" },
                { code: "429", label: "Too Many Requests", desc: "เกินลิมิต rate limit", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                { code: "500", label: "Server Error", desc: "เกิดข้อผิดพลาดภายใน", color: "text-[var(--error)] bg-[rgba(var(--error-rgb,239,68,68),0.1)] border-[rgba(var(--error-rgb,239,68,68),0.2)]" },
              ].map((err) => (
                <div key={err.code} className={`rounded-xl p-3 border ${err.color}`}>
                  <span className="text-lg font-bold">{err.code}</span>
                  <p className="text-xs font-medium mt-0.5">{err.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{err.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SDK Section */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--accent)]">SDK & Libraries</h3>
                <p className="text-xs text-[var(--text-muted)]">ติดตั้ง SDK สำหรับใช้งานง่ายขึ้น</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Install */}
              <div>
                <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Installation</p>
                <div className="bg-[var(--code-bg)] rounded-xl p-4 relative border border-[var(--border-default)]">
                  <pre className="text-[var(--accent)]/80 font-mono text-xs">{`# npm
npm install @smsok/sdk

# yarn
yarn add @smsok/sdk

# pnpm
pnpm add @smsok/sdk`}</pre>
                  <CopyButton text="npm install @smsok/sdk" />
                </div>
              </div>

              {/* Quick Start */}
              <div>
                <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Quick Start</p>
                <div className="bg-[var(--code-bg)] rounded-xl p-4 relative border border-[var(--border-default)]">
                  <pre className="text-[var(--accent)]/80 font-mono text-xs">{`import { SMSOK } from '@smsok/sdk';

const sms = new SMSOK('sk_live_your_key');

// Send SMS
const result = await sms.send({
  recipient: '0891234567',
  message: 'Hello from SMSOK!',
  senderName: 'MyApp',
});

console.log(result.id); // msg_abc123`}</pre>
                  <CopyButton text={`import { SMSOK } from '@smsok/sdk';\n\nconst sms = new SMSOK('sk_live_your_key');\n\nconst result = await sms.send({\n  recipient: '0891234567',\n  message: 'Hello from SMSOK!',\n  senderName: 'MyApp',\n});\n\nconsole.log(result.id);`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
