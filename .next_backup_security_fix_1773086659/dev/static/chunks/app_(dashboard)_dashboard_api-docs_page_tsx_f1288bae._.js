(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/(dashboard)/dashboard/api-docs/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ApiDocsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
"use client";
;
;
;
const methodColors = {
    GET: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    POST: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/20"
};
const methodDotColors = {
    GET: "bg-cyan-400",
    POST: "bg-violet-400",
    PUT: "bg-amber-400",
    DELETE: "bg-red-400"
};
const categories = [
    "ทั้งหมด",
    "SMS",
    "OTP",
    "Contacts",
    "Templates",
    "Account",
    "Admin"
];
const endpoints = [
    // SMS
    {
        method: "POST",
        path: "/api/v1/sms/send",
        title: "Send SMS",
        category: "SMS",
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
        responseFields: [
            {
                name: "id",
                type: "string",
                description: "รหัสข้อความ"
            },
            {
                name: "status",
                type: "string",
                description: "สถานะ: sent, failed"
            },
            {
                name: "creditCost",
                type: "number",
                description: "เครดิตที่ใช้"
            },
            {
                name: "sentAt",
                type: "string (ISO8601)",
                description: "เวลาที่ส่ง"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/sms/batch",
        title: "Batch Send SMS",
        category: "SMS",
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
        responseFields: [
            {
                name: "totalMessages",
                type: "number",
                description: "จำนวนข้อความทั้งหมด"
            },
            {
                name: "totalCredits",
                type: "number",
                description: "เครดิตที่ใช้ทั้งหมด"
            },
            {
                name: "sentCount",
                type: "number",
                description: "จำนวนที่ส่งสำเร็จ"
            },
            {
                name: "failedCount",
                type: "number",
                description: "จำนวนที่ส่งไม่สำเร็จ"
            }
        ]
    },
    {
        method: "GET",
        path: "/api/v1/sms/status?messageId=msg_abc",
        title: "Message Status",
        category: "SMS",
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
            {
                name: "id",
                type: "string",
                description: "รหัสข้อความ"
            },
            {
                name: "recipient",
                type: "string",
                description: "เบอร์ปลายทาง"
            },
            {
                name: "status",
                type: "string",
                description: "สถานะ: sent, delivered, failed"
            },
            {
                name: "senderName",
                type: "string",
                description: "ชื่อผู้ส่ง"
            },
            {
                name: "creditCost",
                type: "number",
                description: "เครดิตที่ใช้"
            },
            {
                name: "sentAt",
                type: "string (ISO8601)",
                description: "เวลาที่ส่ง"
            },
            {
                name: "deliveredAt",
                type: "string (ISO8601)",
                description: "เวลาที่ส่งถึง"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/sms/scheduled",
        title: "Schedule SMS",
        category: "SMS",
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
        responseFields: [
            {
                name: "id",
                type: "string",
                description: "รหัสการตั้งเวลา"
            },
            {
                name: "status",
                type: "string",
                description: "สถานะ: pending, sent, cancelled"
            },
            {
                name: "scheduledAt",
                type: "string (ISO8601)",
                description: "เวลาที่ตั้งไว้"
            }
        ]
    },
    // OTP
    {
        method: "POST",
        path: "/api/v1/otp/send",
        title: "Generate OTP",
        category: "OTP",
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
        responseFields: [
            {
                name: "ref",
                type: "string",
                description: "รหัสอ้างอิง OTP"
            },
            {
                name: "phone",
                type: "string",
                description: "เบอร์ที่ส่ง (E.164)"
            },
            {
                name: "purpose",
                type: "string",
                description: "วัตถุประสงค์"
            },
            {
                name: "expiresAt",
                type: "string (ISO8601)",
                description: "เวลาหมดอายุ"
            },
            {
                name: "creditUsed",
                type: "number",
                description: "เครดิตที่ใช้"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/otp/verify",
        title: "Verify OTP",
        category: "OTP",
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
        responseFields: [
            {
                name: "valid",
                type: "boolean",
                description: "รหัสถูกต้องหรือไม่"
            },
            {
                name: "verified",
                type: "boolean",
                description: "ยืนยันสำเร็จหรือไม่"
            },
            {
                name: "ref",
                type: "string",
                description: "รหัสอ้างอิง"
            },
            {
                name: "phone",
                type: "string",
                description: "เบอร์ที่ยืนยัน"
            },
            {
                name: "purpose",
                type: "string",
                description: "วัตถุประสงค์"
            }
        ]
    },
    // Contacts
    {
        method: "GET",
        path: "/api/v1/contacts",
        title: "List Contacts",
        category: "Contacts",
        description: "ดึงรายชื่อผู้ติดต่อทั้งหมด (pagination)",
        headers: "Authorization: Bearer <API_KEY>",
        response: `{
  "contacts": [
    { "id": "ct_1", "name": "สมชาย", "phone": "0891234567" }
  ],
  "pagination": { "page": 1, "total": 50, "totalPages": 5 }
}`,
        responseFields: [
            {
                name: "contacts",
                type: "array",
                description: "รายชื่อผู้ติดต่อ"
            },
            {
                name: "pagination.page",
                type: "number",
                description: "หน้าปัจจุบัน"
            },
            {
                name: "pagination.total",
                type: "number",
                description: "จำนวนทั้งหมด"
            },
            {
                name: "pagination.totalPages",
                type: "number",
                description: "จำนวนหน้าทั้งหมด"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/contacts",
        title: "Create Contact",
        category: "Contacts",
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
            {
                name: "id",
                type: "string",
                description: "รหัสผู้ติดต่อ"
            },
            {
                name: "name",
                type: "string",
                description: "ชื่อ"
            },
            {
                name: "phone",
                type: "string",
                description: "เบอร์โทรศัพท์"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/contacts/import",
        title: "Import Contacts",
        category: "Contacts",
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
            {
                name: "imported",
                type: "number",
                description: "จำนวนที่นำเข้าสำเร็จ"
            },
            {
                name: "skipped",
                type: "number",
                description: "จำนวนที่ข้าม"
            },
            {
                name: "errors",
                type: "array",
                description: "รายการข้อผิดพลาด"
            }
        ]
    },
    // Templates
    {
        method: "GET",
        path: "/api/v1/templates",
        title: "List Templates",
        category: "Templates",
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
            {
                name: "templates",
                type: "array",
                description: "รายการเทมเพลต"
            },
            {
                name: "templates[].id",
                type: "string",
                description: "รหัสเทมเพลต"
            },
            {
                name: "templates[].name",
                type: "string",
                description: "ชื่อเทมเพลต"
            },
            {
                name: "templates[].content",
                type: "string",
                description: "เนื้อหา (รองรับ {{variable}})"
            },
            {
                name: "templates[].category",
                type: "string",
                description: "หมวดหมู่"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/templates",
        title: "Create Template",
        category: "Templates",
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
            {
                name: "id",
                type: "string",
                description: "รหัสเทมเพลต"
            },
            {
                name: "name",
                type: "string",
                description: "ชื่อเทมเพลต"
            },
            {
                name: "content",
                type: "string",
                description: "เนื้อหา"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/templates/render",
        title: "Render Template",
        category: "Templates",
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
            {
                name: "rendered",
                type: "string",
                description: "ข้อความที่แปลงแล้ว"
            }
        ]
    },
    // Account
    {
        method: "GET",
        path: "/api/v1/balance",
        title: "Check Balance",
        category: "Account",
        description: "ตรวจสอบเครดิตคงเหลือ",
        headers: "Authorization: Bearer <API_KEY>",
        response: `{
  "credits": 1500,
  "name": "สมชาย ใจดี",
  "email": "user@example.com"
}`,
        responseFields: [
            {
                name: "credits",
                type: "number",
                description: "เครดิตคงเหลือ"
            },
            {
                name: "name",
                type: "string",
                description: "ชื่อบัญชี"
            },
            {
                name: "email",
                type: "string",
                description: "อีเมล"
            }
        ]
    },
    {
        method: "GET",
        path: "/api/v1/analytics",
        title: "Usage Analytics",
        category: "Account",
        description: "ดูสถิติการใช้งาน SMS",
        headers: "Authorization: Bearer <API_KEY>",
        response: `{
  "today": { "total": 150, "delivered": 145, "failed": 5 },
  "thisMonth": { "total": 3200, "delivered": 3150, "failed": 50 }
}`,
        responseFields: [
            {
                name: "today.total",
                type: "number",
                description: "จำนวนข้อความวันนี้"
            },
            {
                name: "today.delivered",
                type: "number",
                description: "ส่งสำเร็จวันนี้"
            },
            {
                name: "today.failed",
                type: "number",
                description: "ส่งไม่สำเร็จวันนี้"
            },
            {
                name: "thisMonth.total",
                type: "number",
                description: "จำนวนข้อความเดือนนี้"
            }
        ]
    },
    {
        method: "POST",
        path: "/api/v1/api-keys",
        title: "Create API Key",
        category: "Account",
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
            {
                name: "id",
                type: "string",
                description: "รหัส API Key"
            },
            {
                name: "name",
                type: "string",
                description: "ชื่อที่ตั้ง"
            },
            {
                name: "key",
                type: "string",
                description: "API Key (แสดงครั้งเดียว)"
            },
            {
                name: "createdAt",
                type: "string (ISO8601)",
                description: "เวลาที่สร้าง"
            }
        ]
    },
    {
        method: "GET",
        path: "/api/v1/senders",
        title: "List Sender Names",
        category: "Account",
        description: "ดูชื่อผู้ส่งที่ได้รับอนุมัติ",
        headers: "Authorization: Bearer <API_KEY>",
        response: `{
  "senders": [
    { "name": "EasySlip", "status": "approved" },
    { "name": "MyBrand", "status": "pending" }
  ]
}`,
        responseFields: [
            {
                name: "senders",
                type: "array",
                description: "รายชื่อผู้ส่ง"
            },
            {
                name: "senders[].name",
                type: "string",
                description: "ชื่อผู้ส่ง"
            },
            {
                name: "senders[].status",
                type: "string",
                description: "สถานะ: approved, pending, rejected"
            }
        ]
    },
    // Admin
    {
        method: "GET",
        path: "/api/v1/admin/senders",
        title: "Pending Approvals",
        category: "Admin",
        description: "ดูรายการชื่อผู้ส่งที่รออนุมัติ (Admin only)",
        headers: "Authorization: Bearer <ADMIN_KEY>",
        response: `{
  "pending": [
    { "id": "sn_1", "name": "NewBrand", "user": "สมชาย" }
  ]
}`,
        responseFields: [
            {
                name: "pending",
                type: "array",
                description: "รายการที่รออนุมัติ"
            },
            {
                name: "pending[].id",
                type: "string",
                description: "รหัส"
            },
            {
                name: "pending[].name",
                type: "string",
                description: "ชื่อผู้ส่งที่ขอ"
            },
            {
                name: "pending[].user",
                type: "string",
                description: "ผู้ขอ"
            }
        ]
    }
];
// -- Helper: parse JSON body string to field names for Try It form --
function parseBodyFields(body) {
    if (!body) return [];
    try {
        const parsed = JSON.parse(body);
        return Object.entries(parsed).map(([key, val])=>({
                key,
                example: typeof val === "string" ? val : JSON.stringify(val)
            }));
    } catch  {
        return [];
    }
}
// -- Helper: generate code examples --
function generateCurl(ep) {
    const parts = [
        `curl -X ${ep.method} \\`,
        `  'https://api.smsok.com${ep.path.split("?")[0]}' \\`
    ];
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
function generateJavaScript(ep) {
    const hasBody = !!ep.body;
    const lines = [
        `const response = await fetch('https://api.smsok.com${ep.path.split("?")[0]}', {`,
        `  method: '${ep.method}',`,
        `  headers: {`,
        `    'Authorization': 'Bearer YOUR_API_KEY',`
    ];
    if (hasBody) lines.push(`    'Content-Type': 'application/json',`);
    lines.push(`  },`);
    if (hasBody) {
        lines.push(`  body: JSON.stringify(${ep.body.replace(/\n/g, "\n  ")}),`);
    }
    lines.push(`});`);
    lines.push(``);
    lines.push(`const data = await response.json();`);
    lines.push(`console.log(data);`);
    return lines.join("\n");
}
function generatePython(ep) {
    const lines = [
        `import requests`,
        ``
    ];
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
function CopyButton({ text }) {
    _s();
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: ()=>{
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(()=>setCopied(false), 1500);
        },
        className: "absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-white",
        title: "Copy",
        children: copied ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            className: "text-emerald-400",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                points: "20 6 9 17 4 12"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 460,
                columnNumber: 136
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
            lineNumber: 460,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "9",
                    y: "9",
                    width: "13",
                    height: "13",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                    lineNumber: 462,
                    columnNumber: 107
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                    lineNumber: 462,
                    columnNumber: 157
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
            lineNumber: 462,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
        lineNumber: 454,
        columnNumber: 5
    }, this);
}
_s(CopyButton, "NE86rL3vg4NVcTTWDavsT0hUBJs=");
_c = CopyButton;
function CodeTabs({ endpoint }) {
    _s1();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("curl");
    const codeMap = {
        curl: generateCurl(endpoint),
        javascript: generateJavaScript(endpoint),
        python: generatePython(endpoint)
    };
    const labels = {
        curl: "cURL",
        javascript: "JavaScript",
        python: "Python"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider",
                children: "Code Examples"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 479,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#0d1117] rounded-xl border border-[var(--border-subtle)] overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex border-b border-[var(--border-subtle)]",
                        children: Object.keys(codeMap).map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveTab(tab),
                                className: `px-4 py-2 text-xs font-medium transition-all ${activeTab === tab ? "bg-violet-500/20 text-violet-300 border-b-2 border-violet-500" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5"}`,
                                children: labels[tab]
                            }, tab, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 483,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 481,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "text-cyan-300/80 font-mono text-xs whitespace-pre overflow-x-auto",
                                children: codeMap[activeTab]
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 497,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyButton, {
                                text: codeMap[activeTab]
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 498,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 496,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 480,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
        lineNumber: 478,
        columnNumber: 5
    }, this);
}
_s1(CodeTabs, "cb+wRi/YfQ+wtskQLoivQQBad0k=");
_c1 = CodeTabs;
function TryItPanel({ endpoint }) {
    _s2();
    const fields = parseBodyFields(endpoint.body);
    const [authToken, setAuthToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("sk_live_your_api_key_here");
    const [fieldValues, setFieldValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "TryItPanel.useState": ()=>{
            const init = {};
            fields.forEach({
                "TryItPanel.useState": (f)=>{
                    init[f.key] = f.example;
                }
            }["TryItPanel.useState"]);
            return init;
        }
    }["TryItPanel.useState"]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [response, setResponse] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleSend = ()=>{
        setLoading(true);
        // Simulate API call -- actual calls won't work from docs
        setTimeout(()=>{
            setResponse({
                status: 200,
                body: endpoint.response
            });
            setLoading(false);
        }, 800 + Math.random() * 600);
    };
    const statusColor = (code)=>{
        if (code >= 200 && code < 300) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (code >= 400 && code < 500) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
        return "bg-red-500/20 text-red-400 border-red-500/30";
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        width: "12",
                        height: "12",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        className: "text-violet-400",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                            points: "5 3 19 12 5 21 5 3"
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 534,
                            columnNumber: 135
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 534,
                        columnNumber: 9
                    }, this),
                    "Try It"
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 533,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium",
                                children: "Authorization"
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 540,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mt-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-violet-400 font-mono whitespace-nowrap",
                                        children: "Bearer"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 542,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: authToken,
                                        onChange: (e)=>setAuthToken(e.target.value),
                                        className: "input-glass text-xs font-mono flex-1"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 543,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 541,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 539,
                        columnNumber: 9
                    }, this),
                    fields.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium",
                                children: "Body Parameters"
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 555,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 space-y-2",
                                children: fields.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-cyan-400 font-mono w-28 shrink-0 truncate",
                                                children: f.key
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 559,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: fieldValues[f.key] || "",
                                                onChange: (e)=>setFieldValues((prev)=>({
                                                            ...prev,
                                                            [f.key]: e.target.value
                                                        })),
                                                className: "input-glass text-xs font-mono flex-1"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 560,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, f.key, true, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 558,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 556,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 554,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleSend,
                        disabled: loading,
                        className: "btn-primary w-full py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50",
                        children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "animate-spin h-4 w-4",
                                    viewBox: "0 0 24 24",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            className: "opacity-25",
                                            cx: "12",
                                            cy: "12",
                                            r: "10",
                                            stroke: "currentColor",
                                            strokeWidth: "4",
                                            fill: "none"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 580,
                                            columnNumber: 73
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            className: "opacity-75",
                                            fill: "currentColor",
                                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 580,
                                            columnNumber: 179
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 580,
                                    columnNumber: 15
                                }, this),
                                "Sending..."
                            ]
                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "14",
                                    height: "14",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: "22",
                                            y1: "2",
                                            x2: "11",
                                            y2: "13"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 585,
                                            columnNumber: 113
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                            points: "22 2 15 22 11 13 2 9 22 2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 585,
                                            columnNumber: 152
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 585,
                                    columnNumber: 15
                                }, this),
                                "Send Request"
                            ]
                        }, void 0, true)
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 573,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        children: response && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                height: 0
                            },
                            animate: {
                                opacity: 1,
                                height: "auto"
                            },
                            exit: {
                                opacity: 0,
                                height: 0
                            },
                            className: "overflow-hidden",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider",
                                            children: "Response"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 601,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusColor(response.status)}`,
                                            children: response.status
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 602,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 600,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#0d1117] rounded-xl p-3 relative border border-[var(--border-subtle)]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                            className: "text-emerald-300/80 font-mono text-xs whitespace-pre overflow-x-auto",
                                            children: response.body
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 607,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyButton, {
                                            text: response.body
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 608,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 606,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 594,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 592,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 537,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
        lineNumber: 532,
        columnNumber: 5
    }, this);
}
_s2(TryItPanel, "73HVsGIcAgo48PPNKzTXcqN5rio=");
_c2 = TryItPanel;
function ResponseFieldsTable({ fields }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider",
                children: "Response Fields"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 621,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full text-xs",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                className: "border-b border-[var(--border-subtle)]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left p-3 text-[var(--text-muted)] font-medium uppercase text-[10px] tracking-wider",
                                        children: "Field"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 626,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left p-3 text-[var(--text-muted)] font-medium uppercase text-[10px] tracking-wider",
                                        children: "Type"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 627,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left p-3 text-[var(--text-muted)] font-medium uppercase text-[10px] tracking-wider",
                                        children: "Description"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 628,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 625,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 624,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: fields.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-[var(--border-subtle)] last:border-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-3 font-mono text-cyan-400",
                                            children: f.name
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 634,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-3 text-violet-300",
                                            children: f.type
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 635,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-3 text-[var(--text-secondary)]",
                                            children: f.description
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 636,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, f.name, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 633,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 631,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                    lineNumber: 623,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 622,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
        lineNumber: 620,
        columnNumber: 5
    }, this);
}
_c3 = ResponseFieldsTable;
function EndpointCard({ endpoint, isExpanded, onToggle, id }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        id: id,
        className: "glass overflow-hidden card-hover",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onToggle,
                className: "w-full p-5 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `${methodColors[endpoint.method]} text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0`,
                        children: endpoint.method
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 654,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        className: "text-[var(--text-primary)] font-mono text-sm truncate",
                        children: endpoint.path
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 657,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm text-[var(--text-secondary)] hidden md:inline truncate",
                        children: endpoint.title
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 658,
                        columnNumber: 9
                    }, this),
                    endpoint.rateLimit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-md ml-auto mr-2 hidden sm:inline shrink-0",
                        children: endpoint.rateLimit
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 660,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].svg, {
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        className: "text-[var(--text-muted)] shrink-0",
                        animate: {
                            rotate: isExpanded ? 180 : 0
                        },
                        transition: {
                            duration: 0.2
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                            points: "6 9 12 15 18 9"
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 675,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 664,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 650,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                initial: false,
                children: isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        height: 0,
                        opacity: 0
                    },
                    animate: {
                        height: "auto",
                        opacity: 1
                    },
                    exit: {
                        height: 0,
                        opacity: 0
                    },
                    transition: {
                        duration: 0.25,
                        ease: "easeInOut"
                    },
                    className: "overflow-hidden",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-5 pb-6 pt-0 border-t border-[var(--border-subtle)]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-base font-semibold text-[var(--text-primary)] mb-1",
                                    children: endpoint.title
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 691,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-[var(--text-secondary)] mb-5",
                                    children: endpoint.description
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 692,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider",
                                                    children: "Request"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 697,
                                                    columnNumber: 21
                                                }, this),
                                                endpoint.headers && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 mb-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-[9px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider",
                                                            children: "Headers"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 700,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                            className: "text-cyan-300/80 font-mono text-xs",
                                                            children: endpoint.headers
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 701,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 699,
                                                    columnNumber: 23
                                                }, this),
                                                endpoint.body ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-[9px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider",
                                                            children: "Body"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 706,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                            className: "text-cyan-300/80 font-mono text-xs whitespace-pre overflow-x-auto",
                                                            children: endpoint.body
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 707,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyButton, {
                                                            text: endpoint.body
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 708,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 705,
                                                    columnNumber: 23
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-[var(--text-muted)] italic",
                                                        children: "ไม่มี Request Body"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                        lineNumber: 712,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 711,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 696,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider",
                                                    children: [
                                                        "Response ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-emerald-400",
                                                            children: "200"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 719,
                                                            columnNumber: 124
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 719,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                            className: "text-emerald-300/80 font-mono text-xs whitespace-pre overflow-x-auto",
                                                            children: endpoint.response
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 721,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyButton, {
                                                            text: endpoint.response
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 722,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 720,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 718,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 694,
                                    columnNumber: 17
                                }, this),
                                endpoint.responseFields && endpoint.responseFields.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-5",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ResponseFieldsTable, {
                                        fields: endpoint.responseFields
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 730,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 729,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-5",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CodeTabs, {
                                        endpoint: endpoint
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 736,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 735,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TryItPanel, {
                                    endpoint: endpoint
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 740,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 690,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 689,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                    lineNumber: 682,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 680,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
        lineNumber: 648,
        columnNumber: 5
    }, this);
}
_c4 = EndpointCard;
// -- Sidebar --
function Sidebar({ endpoints: eps, activeId, onSelect }) {
    _s3();
    const grouped = eps.reduce((acc, ep)=>{
        if (!acc[ep.category]) acc[ep.category] = [];
        acc[ep.category].push(ep);
        return acc;
    }, {});
    const [collapsed, setCollapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const toggleCategory = (cat)=>{
        setCollapsed((prev)=>({
                ...prev,
                [cat]: !prev[cat]
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: "glass p-4 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3",
                children: "Endpoints"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 774,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-1",
                children: Object.entries(grouped).map(([category, catEndpoints])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>toggleCategory(category),
                                className: "w-full flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors",
                                children: [
                                    category,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].svg, {
                                        width: "12",
                                        height: "12",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        className: "text-[var(--text-muted)]",
                                        animate: {
                                            rotate: collapsed[category] ? -90 : 0
                                        },
                                        transition: {
                                            duration: 0.15
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                            points: "6 9 12 15 18 9"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 789,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 783,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 778,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                initial: false,
                                children: !collapsed[category] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        height: 0,
                                        opacity: 0
                                    },
                                    animate: {
                                        height: "auto",
                                        opacity: 1
                                    },
                                    exit: {
                                        height: 0,
                                        opacity: 0
                                    },
                                    transition: {
                                        duration: 0.15
                                    },
                                    className: "overflow-hidden",
                                    children: catEndpoints.map((ep)=>{
                                        const epId = `ep-${ep.method}-${ep.path}`;
                                        const isActive = activeId === epId;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>onSelect(epId),
                                            className: `w-full text-left px-2 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-colors ${isActive ? "bg-violet-500/15 text-violet-300" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5"}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `w-1.5 h-1.5 rounded-full shrink-0 ${methodDotColors[ep.method]}`
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 814,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "truncate",
                                                    children: ep.title
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 815,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, epId, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 805,
                                            columnNumber: 23
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 794,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 792,
                                columnNumber: 13
                            }, this)
                        ]
                    }, category, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 777,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                lineNumber: 775,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
        lineNumber: 773,
        columnNumber: 5
    }, this);
}
_s3(Sidebar, "FiTHS2OW9vdw8qu16HdUc/zlJjg=");
_c5 = Sidebar;
function ApiDocsPage() {
    _s4();
    const [activeCategory, setActiveCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("ทั้งหมด");
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [expandedIds, setExpandedIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [activeNavId, setActiveNavId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const mainRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const filtered = endpoints.filter((ep)=>{
        const matchCategory = activeCategory === "ทั้งหมด" || ep.category === activeCategory;
        const matchSearch = !search || ep.title.toLowerCase().includes(search.toLowerCase()) || ep.path.includes(search) || ep.description.includes(search);
        return matchCategory && matchSearch;
    });
    const getEpId = (ep)=>`ep-${ep.method}-${ep.path}`;
    const toggleEndpoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ApiDocsPage.useCallback[toggleEndpoint]": (id)=>{
            setExpandedIds({
                "ApiDocsPage.useCallback[toggleEndpoint]": (prev)=>{
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                }
            }["ApiDocsPage.useCallback[toggleEndpoint]"]);
        }
    }["ApiDocsPage.useCallback[toggleEndpoint]"], []);
    const handleSidebarSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ApiDocsPage.useCallback[handleSidebarSelect]": (id)=>{
            setActiveNavId(id);
            // Expand the endpoint
            setExpandedIds({
                "ApiDocsPage.useCallback[handleSidebarSelect]": (prev)=>{
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                }
            }["ApiDocsPage.useCallback[handleSidebarSelect]"]);
            // Scroll to it
            setTimeout({
                "ApiDocsPage.useCallback[handleSidebarSelect]": ()=>{
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }["ApiDocsPage.useCallback[handleSidebarSelect]"], 50);
        }
    }["ApiDocsPage.useCallback[handleSidebarSelect]"], []);
    // Expand/collapse all
    const expandAll = ()=>{
        setExpandedIds(new Set(filtered.map(getEpId)));
    };
    const collapseAll = ()=>{
        setExpandedIds(new Set());
    };
    // Track active on scroll
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ApiDocsPage.useEffect": ()=>{
            const observer = new IntersectionObserver({
                "ApiDocsPage.useEffect": (entries)=>{
                    for (const entry of entries){
                        if (entry.isIntersecting) {
                            setActiveNavId(entry.target.id);
                        }
                    }
                }
            }["ApiDocsPage.useEffect"], {
                rootMargin: "-100px 0px -60% 0px",
                threshold: 0
            });
            const elements = document.querySelectorAll("[id^='ep-']");
            elements.forEach({
                "ApiDocsPage.useEffect": (el)=>observer.observe(el)
            }["ApiDocsPage.useEffect"]);
            return ({
                "ApiDocsPage.useEffect": ()=>observer.disconnect()
            })["ApiDocsPage.useEffect"];
        }
    }["ApiDocsPage.useEffect"], [
        filtered
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6 md:p-8 animate-fade-in-up",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-8 max-w-[1400px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "hidden xl:block w-64 shrink-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sidebar, {
                        endpoints: endpoints,
                        activeId: activeNavId,
                        onSelect: handleSidebarSelect
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                        lineNumber: 901,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                    lineNumber: 900,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 min-w-0",
                    ref: mainRef,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            className: "text-2xl font-bold gradient-text-mixed mb-2",
                                            children: "API Documentation"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 909,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[var(--text-secondary)] text-sm",
                                            children: [
                                                "SMSOK REST API v1 -- ",
                                                endpoints.length,
                                                " endpoints"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 910,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 908,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/dashboard/api-keys",
                                        className: "btn-primary px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "14",
                                                height: "14",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 914,
                                                    columnNumber: 115
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 914,
                                                columnNumber: 17
                                            }, this),
                                            "API Keys"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 913,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 912,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 907,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "glass p-6 mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "20",
                                                height: "20",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                className: "text-violet-400",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                        x: "3",
                                                        y: "11",
                                                        width: "18",
                                                        height: "11",
                                                        rx: "2",
                                                        ry: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                        lineNumber: 924,
                                                        columnNumber: 143
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M7 11V7a5 5 0 0110 0v4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                        lineNumber: 924,
                                                        columnNumber: 201
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 924,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 923,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "text-base font-semibold gradient-text-cyan",
                                                    children: "Authentication"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 927,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-[var(--text-muted)]",
                                                    children: "ทุก request ต้องมี API Key ใน Header"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 928,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 926,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 922,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider",
                                                    children: "Base URL"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 933,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                    className: "block mt-1 text-cyan-300/80 font-mono text-sm bg-[var(--bg-surface)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]",
                                                    children: "https://api.smsok.com"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 934,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 932,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider",
                                                    children: "Header Format"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 939,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                    className: "block mt-1 text-violet-300/80 font-mono text-sm bg-[var(--bg-surface)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]",
                                                    children: "Authorization: Bearer <API_KEY>"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 940,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 938,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 931,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 bg-[#0d1117] rounded-xl p-4 relative border border-[var(--border-subtle)]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                            className: "text-cyan-300/80 font-mono text-xs whitespace-pre overflow-x-auto",
                                            children: `// Example: Using fetch
const res = await fetch('https://api.smsok.com/api/v1/balance', {
  headers: { 'Authorization': 'Bearer sk_live_your_api_key' }
});`
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 946,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyButton, {
                                            text: `const res = await fetch('https://api.smsok.com/api/v1/balance', {\n  headers: { 'Authorization': 'Bearer sk_live_your_api_key' }\n});`
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 950,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 945,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-3 flex items-center gap-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/dashboard/api-keys",
                                        className: "text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "12",
                                                height: "12",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 954,
                                                    columnNumber: 115
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 954,
                                                columnNumber: 17
                                            }, this),
                                            "Manage API Keys"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 953,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 952,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 921,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col sm:flex-row gap-3 mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative flex-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "16",
                                            height: "16",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "11",
                                                    cy: "11",
                                                    r: "8"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 964,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "21",
                                                    y1: "21",
                                                    x2: "16.65",
                                                    y2: "16.65"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 964,
                                                    columnNumber: 49
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 963,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            placeholder: "ค้นหา endpoint...",
                                            value: search,
                                            onChange: (e)=>setSearch(e.target.value),
                                            className: "input-glass pl-10 w-full"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 966,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 962,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-1.5 flex-wrap",
                                    children: categories.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setActiveCategory(cat),
                                            className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === cat ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"}`,
                                            children: cat
                                        }, cat, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 976,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 974,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 961,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-[var(--text-muted)]",
                                    children: [
                                        filtered.length,
                                        " endpoint",
                                        filtered.length !== 1 ? "s" : ""
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 993,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: expandAll,
                                            className: "btn-glass px-3 py-1.5 text-[11px] rounded-lg flex items-center gap-1.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "12",
                                                    height: "12",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                            points: "15 3 21 3 21 9"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 998,
                                                            columnNumber: 115
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                            points: "9 21 3 21 3 15"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 998,
                                                            columnNumber: 151
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                            x1: "21",
                                                            y1: "3",
                                                            x2: "14",
                                                            y2: "10"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 998,
                                                            columnNumber: 187
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                            x1: "3",
                                                            y1: "21",
                                                            x2: "10",
                                                            y2: "14"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 998,
                                                            columnNumber: 226
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 998,
                                                    columnNumber: 17
                                                }, this),
                                                "Expand All"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 997,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: collapseAll,
                                            className: "btn-glass px-3 py-1.5 text-[11px] rounded-lg flex items-center gap-1.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "12",
                                                    height: "12",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                            points: "4 14 10 14 10 20"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1002,
                                                            columnNumber: 115
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                            points: "20 10 14 10 14 4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1002,
                                                            columnNumber: 153
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                            x1: "14",
                                                            y1: "10",
                                                            x2: "21",
                                                            y2: "3"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1002,
                                                            columnNumber: 191
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                            x1: "3",
                                                            y1: "21",
                                                            x2: "10",
                                                            y2: "14"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1002,
                                                            columnNumber: 230
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1002,
                                                    columnNumber: 17
                                                }, this),
                                                "Collapse All"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1001,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 996,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 992,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "glass p-4 mb-6 flex items-center gap-3 border-amber-500/10",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "14",
                                        height: "14",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        className: "text-amber-400",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 1012,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "12",
                                                y1: "9",
                                                x2: "12",
                                                y2: "13"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 1012,
                                                columnNumber: 113
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "12",
                                                y1: "17",
                                                x2: "12.01",
                                                y2: "17"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 1012,
                                                columnNumber: 152
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                        lineNumber: 1011,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 1010,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-[var(--text-secondary)] font-medium",
                                            children: "Rate Limiting"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1016,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[11px] text-[var(--text-muted)]",
                                            children: "API ถูกจำกัดตามประเภท -- OTP: 3 req/5min, SMS: 10 req/min, General: 60 req/min -- Response 429 เมื่อเกินลิมิต"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1017,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 1015,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 1009,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: filtered.map((ep)=>{
                                const epId = getEpId(ep);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EndpointCard, {
                                    id: epId,
                                    endpoint: ep,
                                    isExpanded: expandedIds.has(epId),
                                    onToggle: ()=>toggleEndpoint(epId)
                                }, epId, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 1026,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 1022,
                            columnNumber: 11
                        }, this),
                        filtered.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-16",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[var(--text-muted)] text-sm",
                                children: "ไม่พบ endpoint ที่ค้นหา"
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                lineNumber: 1039,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 1038,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "glass p-6 mt-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-base font-semibold gradient-text-mixed mb-4",
                                    children: "Error Codes"
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 1045,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
                                    children: [
                                        {
                                            code: "400",
                                            label: "Bad Request",
                                            desc: "ข้อมูลไม่ถูกต้อง",
                                            color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                        },
                                        {
                                            code: "401",
                                            label: "Unauthorized",
                                            desc: "API Key ไม่ถูกต้อง",
                                            color: "text-red-400 bg-red-500/10 border-red-500/20"
                                        },
                                        {
                                            code: "429",
                                            label: "Too Many Requests",
                                            desc: "เกินลิมิต rate limit",
                                            color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
                                        },
                                        {
                                            code: "500",
                                            label: "Server Error",
                                            desc: "เกิดข้อผิดพลาดภายใน",
                                            color: "text-red-400 bg-red-500/10 border-red-500/20"
                                        }
                                    ].map((err)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `rounded-xl p-3 border ${err.color}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-lg font-bold",
                                                    children: err.code
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1054,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs font-medium mt-0.5",
                                                    children: err.label
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1055,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] opacity-70 mt-0.5",
                                                    children: err.desc
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1056,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, err.code, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1053,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 1046,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 1044,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "glass p-6 mt-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "20",
                                                height: "20",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                className: "text-cyan-400",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                        points: "16 18 22 12 16 6"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                        lineNumber: 1066,
                                                        columnNumber: 141
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                        points: "8 6 2 12 8 18"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                        lineNumber: 1066,
                                                        columnNumber: 179
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                lineNumber: 1066,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1065,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-base font-semibold gradient-text-cyan",
                                                    children: "SDK & Libraries"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1069,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-[var(--text-muted)]",
                                                    children: "ติดตั้ง SDK สำหรับใช้งานง่ายขึ้น"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1070,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1068,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 1064,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider",
                                                    children: "Installation"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1077,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-[#0d1117] rounded-xl p-4 relative border border-[var(--border-subtle)]",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                            className: "text-cyan-300/80 font-mono text-xs",
                                                            children: `# npm
npm install @smsok/sdk

# yarn
yarn add @smsok/sdk

# pnpm
pnpm add @smsok/sdk`
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1079,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyButton, {
                                                            text: "npm install @smsok/sdk"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1087,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1078,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1076,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider",
                                                    children: "Quick Start"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1093,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-[#0d1117] rounded-xl p-4 relative border border-[var(--border-subtle)]",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                            className: "text-cyan-300/80 font-mono text-xs",
                                                            children: `import { SMSOK } from '@smsok/sdk';

const sms = new SMSOK('sk_live_your_key');

// Send SMS
const result = await sms.send({
  recipient: '0891234567',
  message: 'Hello from SMSOK!',
  senderName: 'MyApp',
});

console.log(result.id); // msg_abc123`
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1095,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyButton, {
                                                            text: `import { SMSOK } from '@smsok/sdk';\n\nconst sms = new SMSOK('sk_live_your_key');\n\nconst result = await sms.send({\n  recipient: '0891234567',\n  message: 'Hello from SMSOK!',\n  senderName: 'MyApp',\n});\n\nconsole.log(result.id);`
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                            lineNumber: 1107,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                                    lineNumber: 1094,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                            lineNumber: 1092,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                                    lineNumber: 1074,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                            lineNumber: 1063,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
                    lineNumber: 905,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
            lineNumber: 898,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/(dashboard)/dashboard/api-docs/page.tsx",
        lineNumber: 897,
        columnNumber: 5
    }, this);
}
_s4(ApiDocsPage, "Tgey7d9UK29nxKpEfpBImfH/Wt4=");
_c6 = ApiDocsPage;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "CopyButton");
__turbopack_context__.k.register(_c1, "CodeTabs");
__turbopack_context__.k.register(_c2, "TryItPanel");
__turbopack_context__.k.register(_c3, "ResponseFieldsTable");
__turbopack_context__.k.register(_c4, "EndpointCard");
__turbopack_context__.k.register(_c5, "Sidebar");
__turbopack_context__.k.register(_c6, "ApiDocsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_%28dashboard%29_dashboard_api-docs_page_tsx_f1288bae._.js.map