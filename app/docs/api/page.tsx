"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Key, ChevronRight, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type Param = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

type StatusCode = {
  code: string;
  label: string;
  response: string;
};

type CodeExample = {
  lang: "cURL" | "Node.js" | "Python" | "PHP";
  code: string;
};

type Endpoint = {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  category: string;
  params: Param[];
  statusCodes: StatusCode[];
  examples: CodeExample[];
};

// ─── HTTP Method colors (hardcoded hex per spec) ──────────────────────────────

const METHOD_STYLES: Record<HttpMethod, { bg: string; text: string; border: string }> = {
  GET: { bg: "rgba(var(--success-rgb),0.13)", text: "var(--success)", border: "#16a34a44" },
  POST: { bg: "rgba(var(--info-rgb),0.13)", text: "var(--info)", border: "#2563eb44" },
  PUT: { bg: "rgba(var(--warning-rgb),0.13)", text: "var(--warning)", border: "#d9770644" },
  DELETE: { bg: "rgba(var(--error-rgb),0.13)", text: "var(--error)", border: "#dc262644" },
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "200": { bg: "rgba(var(--success-rgb),0.13)", text: "var(--success)" },
  "400": { bg: "rgba(var(--warning-rgb),0.13)", text: "var(--warning)" },
  "401": { bg: "rgba(var(--error-rgb),0.13)", text: "var(--error)" },
  "429": { bg: "rgba(var(--warning-rgb),0.13)", text: "var(--warning)" },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: string; label: string; endpoints: string[] }[] = [
  {
    id: "auth",
    label: "Authentication",
    endpoints: ["auth-login", "auth-register"],
  },
  {
    id: "sms",
    label: "SMS",
    endpoints: ["sms-send", "sms-bulk", "sms-get", "sms-status"],
  },
  {
    id: "contacts",
    label: "Contacts",
    endpoints: ["contacts-list", "contacts-create", "contacts-update", "contacts-delete"],
  },
  {
    id: "campaigns",
    label: "Campaigns",
    endpoints: ["campaigns-list", "campaigns-create", "campaigns-get"],
  },
  {
    id: "credits",
    label: "SMS Quota",
    endpoints: ["credits-balance", "credits-usage"],
  },
];

const SMS_SEND_EXAMPLES: CodeExample[] = [
  {
    lang: "cURL",
    code: `curl -X POST https://api.smsok.io/v1/sms/send \\
  -H "Authorization: Bearer sk_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "0812345678",
    "message": "Hello from SMSOK!",
    "sender_name": "SMSOK"
  }'`,
  },
  {
    lang: "Node.js",
    code: `const response = await fetch('https://api.smsok.io/v1/sms/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_your_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: '0812345678',
    message: 'Hello from SMSOK!',
    sender_name: 'SMSOK',
  }),
});
const data = await response.json();
console.log(data);`,
  },
  {
    lang: "Python",
    code: `import requests

response = requests.post(
    'https://api.smsok.io/v1/sms/send',
    headers={
        'Authorization': 'Bearer sk_live_your_key_here',
        'Content-Type': 'application/json',
    },
    json={
        'to': '0812345678',
        'message': 'Hello from SMSOK!',
        'sender_name': 'SMSOK',
    }
)
print(response.json())`,
  },
  {
    lang: "PHP",
    code: `<?php
$ch = curl_init('https://api.smsok.io/v1/sms/send');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer sk_live_your_key_here',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'to'          => '0812345678',
        'message'     => 'Hello from SMSOK!',
        'sender_name' => 'SMSOK',
    ]),
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
  },
];

const ENDPOINTS: Record<string, Endpoint> = {
  "auth-login": {
    id: "auth-login",
    method: "POST",
    path: "/auth/login",
    description: "Authenticate a user and receive a JWT access token.",
    category: "auth",
    params: [
      { name: "email", type: "string", required: true, description: "User email address." },
      { name: "password", type: "string", required: true, description: "User account password." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "expires_in": 86400\n}` },
      { code: "400", label: "Bad Request", response: `{\n  "error": "invalid_credentials",\n  "message": "Email or password is incorrect."\n}` },
      { code: "429", label: "Too Many Requests", response: `{\n  "error": "rate_limited",\n  "retry_after": 60\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl -X POST https://api.smsok.io/v1/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"user@example.com","password":"secret"}'` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/auth/login', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.post('https://api.smsok.io/v1/auth/login', json={'email':'user@example.com','password':'secret'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/auth/login');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email'=>'user@example.com','password'=>'secret']));\necho curl_exec($ch);` },
    ],
  },
  "auth-register": {
    id: "auth-register",
    method: "POST",
    path: "/auth/register",
    description: "Create a new user account.",
    category: "auth",
    params: [
      { name: "name", type: "string", required: true, description: "Full name of the user." },
      { name: "email", type: "string", required: true, description: "Email address (must be unique)." },
      { name: "password", type: "string", required: true, description: "Minimum 8 characters." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "usr_abc123",\n  "email": "user@example.com",\n  "created_at": "2026-01-01T00:00:00Z"\n}` },
      { code: "400", label: "Bad Request", response: `{\n  "error": "email_taken",\n  "message": "This email is already registered."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl -X POST https://api.smsok.io/v1/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"John Doe","email":"john@example.com","password":"securepass"}'` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/auth/register', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ name: 'John Doe', email: 'john@example.com', password: 'securepass' }),\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.post('https://api.smsok.io/v1/auth/register', json={'name':'John Doe','email':'john@example.com','password':'securepass'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/auth/register');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name'=>'John Doe','email'=>'john@example.com','password'=>'securepass']));\necho curl_exec($ch);` },
    ],
  },
  "sms-send": {
    id: "sms-send",
    method: "POST",
    path: "/sms/send",
    description: "Send a single SMS message to a phone number.",
    category: "sms",
    params: [
      { name: "to", type: "string", required: true, description: "Recipient phone number (E.164 or local format)." },
      { name: "message", type: "string", required: true, description: "SMS body text. Max 160 chars for single segment." },
      { name: "sender_name", type: "string", required: false, description: "Sender ID shown on the recipient's device." },
      { name: "schedule_at", type: "string", required: false, description: "ISO 8601 datetime to schedule the message." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "sms_xyz789",\n  "status": "queued",\n  "to": "0812345678",\n  "sms_used": 1,\n  "sms_remaining": 1499\n}` },
      { code: "400", label: "Bad Request", response: `{\n  "error": "invalid_phone",\n  "message": "The 'to' field is not a valid phone number."\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
      { code: "429", label: "Too Many Requests", response: `{\n  "error": "rate_limited",\n  "retry_after": 30\n}` },
    ],
    examples: SMS_SEND_EXAMPLES,
  },
  "sms-bulk": {
    id: "sms-bulk",
    method: "POST",
    path: "/sms/bulk",
    description: "Send SMS messages to multiple recipients in a single request.",
    category: "sms",
    params: [
      { name: "to", type: "string[]", required: true, description: "Array of recipient phone numbers. Max 1,000 per request." },
      { name: "message", type: "string", required: true, description: "SMS body text shared across all recipients." },
      { name: "sender_name", type: "string", required: false, description: "Sender ID displayed on recipient devices." },
      { name: "schedule_at", type: "string", required: false, description: "ISO 8601 datetime to schedule the bulk send." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "batch_id": "bat_abc456",\n  "queued": 250,\n  "sms_used": 250,\n  "sms_remaining": 1250\n}` },
      { code: "400", label: "Bad Request", response: `{\n  "error": "too_many_recipients",\n  "message": "Maximum 1,000 recipients per request."\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
      { code: "429", label: "Too Many Requests", response: `{\n  "error": "rate_limited",\n  "retry_after": 60\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl -X POST https://api.smsok.io/v1/sms/bulk \\\n  -H "Authorization: Bearer sk_live_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"to":["0812345678","0898765432"],"message":"Hello!"}'` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/sms/bulk', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here', 'Content-Type': 'application/json' },\n  body: JSON.stringify({ to: ['0812345678', '0898765432'], message: 'Hello!' }),\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.post('https://api.smsok.io/v1/sms/bulk',\n  headers={'Authorization':'Bearer sk_live_your_key_here'},\n  json={'to':['0812345678','0898765432'],'message':'Hello!'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/sms/bulk');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here','Content-Type: application/json']);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['to'=>['0812345678','0898765432'],'message'=>'Hello!']));\necho curl_exec($ch);` },
    ],
  },
  "sms-get": {
    id: "sms-get",
    method: "GET",
    path: "/sms/{id}",
    description: "Retrieve the details of a specific SMS message by ID.",
    category: "sms",
    params: [
      { name: "id", type: "string", required: true, description: "The unique SMS message ID (path parameter)." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "sms_xyz789",\n  "to": "0812345678",\n  "message": "Hello from SMSOK!",\n  "status": "delivered",\n  "sent_at": "2026-01-15T08:30:00Z",\n  "delivered_at": "2026-01-15T08:30:04Z"\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl https://api.smsok.io/v1/sms/sms_xyz789 \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/sms/sms_xyz789', {\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.get('https://api.smsok.io/v1/sms/sms_xyz789',\n  headers={'Authorization':'Bearer sk_live_your_key_here'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/sms/sms_xyz789');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
  "sms-status": {
    id: "sms-status",
    method: "GET",
    path: "/sms/status/{id}",
    description: "Get the delivery status of an SMS message.",
    category: "sms",
    params: [
      { name: "id", type: "string", required: true, description: "SMS message ID (path parameter)." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "sms_xyz789",\n  "status": "delivered",\n  "updated_at": "2026-01-15T08:30:04Z"\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl https://api.smsok.io/v1/sms/status/sms_xyz789 \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/sms/status/sms_xyz789', {\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.get('https://api.smsok.io/v1/sms/status/sms_xyz789',\n  headers={'Authorization':'Bearer sk_live_your_key_here'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/sms/status/sms_xyz789');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
  "contacts-list": {
    id: "contacts-list",
    method: "GET",
    path: "/contacts",
    description: "List all contacts in your account with optional pagination.",
    category: "contacts",
    params: [
      { name: "page", type: "number", required: false, description: "Page number (default: 1)." },
      { name: "per_page", type: "number", required: false, description: "Results per page (default: 20, max: 100)." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "data": [\n    { "id": "con_001", "name": "Alice", "phone": "0812345678" }\n  ],\n  "total": 150,\n  "page": 1,\n  "per_page": 20\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl "https://api.smsok.io/v1/contacts?page=1&per_page=20" \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/contacts?page=1&per_page=20', {\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.get('https://api.smsok.io/v1/contacts',\n  headers={'Authorization':'Bearer sk_live_your_key_here'},\n  params={'page':1,'per_page':20})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/contacts?page=1&per_page=20');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
  "contacts-create": {
    id: "contacts-create",
    method: "POST",
    path: "/contacts",
    description: "Create a new contact in your account.",
    category: "contacts",
    params: [
      { name: "name", type: "string", required: true, description: "Full name of the contact." },
      { name: "phone", type: "string", required: true, description: "Phone number in E.164 or local format." },
      { name: "email", type: "string", required: false, description: "Email address of the contact." },
      { name: "tags", type: "string[]", required: false, description: "Array of tag names to apply." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "con_002",\n  "name": "Bob",\n  "phone": "0898765432",\n  "created_at": "2026-01-15T09:00:00Z"\n}` },
      { code: "400", label: "Bad Request", response: `{\n  "error": "duplicate_phone",\n  "message": "A contact with this phone number already exists."\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl -X POST https://api.smsok.io/v1/contacts \\\n  -H "Authorization: Bearer sk_live_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Bob","phone":"0898765432"}'` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/contacts', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here', 'Content-Type': 'application/json' },\n  body: JSON.stringify({ name: 'Bob', phone: '0898765432' }),\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.post('https://api.smsok.io/v1/contacts',\n  headers={'Authorization':'Bearer sk_live_your_key_here'},\n  json={'name':'Bob','phone':'0898765432'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/contacts');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here','Content-Type: application/json']);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name'=>'Bob','phone'=>'0898765432']));\necho curl_exec($ch);` },
    ],
  },
  "contacts-update": {
    id: "contacts-update",
    method: "PUT",
    path: "/contacts/{id}",
    description: "Update an existing contact's information.",
    category: "contacts",
    params: [
      { name: "id", type: "string", required: true, description: "Contact ID (path parameter)." },
      { name: "name", type: "string", required: false, description: "Updated full name." },
      { name: "phone", type: "string", required: false, description: "Updated phone number." },
      { name: "email", type: "string", required: false, description: "Updated email address." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "con_002",\n  "name": "Bobby",\n  "phone": "0898765432",\n  "updated_at": "2026-01-15T10:00:00Z"\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl -X PUT https://api.smsok.io/v1/contacts/con_002 \\\n  -H "Authorization: Bearer sk_live_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Bobby"}'` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/contacts/con_002', {\n  method: 'PUT',\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here', 'Content-Type': 'application/json' },\n  body: JSON.stringify({ name: 'Bobby' }),\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.put('https://api.smsok.io/v1/contacts/con_002',\n  headers={'Authorization':'Bearer sk_live_your_key_here'},\n  json={'name':'Bobby'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/contacts/con_002');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here','Content-Type: application/json']);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name'=>'Bobby']));\necho curl_exec($ch);` },
    ],
  },
  "contacts-delete": {
    id: "contacts-delete",
    method: "DELETE",
    path: "/contacts/{id}",
    description: "Permanently delete a contact from your account.",
    category: "contacts",
    params: [
      { name: "id", type: "string", required: true, description: "Contact ID (path parameter)." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "deleted": true,\n  "id": "con_002"\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl -X DELETE https://api.smsok.io/v1/contacts/con_002 \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/contacts/con_002', {\n  method: 'DELETE',\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.delete('https://api.smsok.io/v1/contacts/con_002',\n  headers={'Authorization':'Bearer sk_live_your_key_here'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/contacts/con_002');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
  "campaigns-list": {
    id: "campaigns-list",
    method: "GET",
    path: "/campaigns",
    description: "List all SMS campaigns in your account.",
    category: "campaigns",
    params: [
      { name: "status", type: "string", required: false, description: "Filter by status: draft, scheduled, sent, cancelled." },
      { name: "page", type: "number", required: false, description: "Page number (default: 1)." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "data": [\n    { "id": "cam_001", "name": "January Promo", "status": "sent", "sent_at": "2026-01-01T00:00:00Z" }\n  ],\n  "total": 12\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl "https://api.smsok.io/v1/campaigns?status=sent" \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/campaigns?status=sent', {\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.get('https://api.smsok.io/v1/campaigns',\n  headers={'Authorization':'Bearer sk_live_your_key_here'},\n  params={'status':'sent'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/campaigns?status=sent');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
  "campaigns-create": {
    id: "campaigns-create",
    method: "POST",
    path: "/campaigns",
    description: "Create a new SMS campaign targeting a contact group.",
    category: "campaigns",
    params: [
      { name: "name", type: "string", required: true, description: "Campaign name for internal reference." },
      { name: "message", type: "string", required: true, description: "SMS body text." },
      { name: "group_id", type: "string", required: true, description: "Target contact group ID." },
      { name: "sender_name", type: "string", required: false, description: "Sender ID to display on recipient devices." },
      { name: "schedule_at", type: "string", required: false, description: "ISO 8601 datetime — leave empty to send immediately." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "cam_002",\n  "name": "Summer Sale",\n  "status": "scheduled",\n  "schedule_at": "2026-06-01T09:00:00Z"\n}` },
      { code: "400", label: "Bad Request", response: `{\n  "error": "invalid_group",\n  "message": "group_id does not exist."\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl -X POST https://api.smsok.io/v1/campaigns \\\n  -H "Authorization: Bearer sk_live_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Summer Sale","message":"50% off!","group_id":"grp_001"}'` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/campaigns', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here', 'Content-Type': 'application/json' },\n  body: JSON.stringify({ name: 'Summer Sale', message: '50% off!', group_id: 'grp_001' }),\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.post('https://api.smsok.io/v1/campaigns',\n  headers={'Authorization':'Bearer sk_live_your_key_here'},\n  json={'name':'Summer Sale','message':'50% off!','group_id':'grp_001'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/campaigns');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here','Content-Type: application/json']);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name'=>'Summer Sale','message'=>'50% off!','group_id'=>'grp_001']));\necho curl_exec($ch);` },
    ],
  },
  "campaigns-get": {
    id: "campaigns-get",
    method: "GET",
    path: "/campaigns/{id}",
    description: "Retrieve the full details and statistics of a campaign.",
    category: "campaigns",
    params: [
      { name: "id", type: "string", required: true, description: "Campaign ID (path parameter)." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "id": "cam_001",\n  "name": "January Promo",\n  "status": "sent",\n  "sent": 500,\n  "delivered": 492,\n  "failed": 8\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl https://api.smsok.io/v1/campaigns/cam_001 \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/campaigns/cam_001', {\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.get('https://api.smsok.io/v1/campaigns/cam_001',\n  headers={'Authorization':'Bearer sk_live_your_key_here'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/campaigns/cam_001');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
  "credits-balance": {
    id: "credits-balance",
    method: "GET",
    path: "/credits/balance",
    description: "Get the current SMS balance for your account.",
    category: "credits",
    params: [],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "balance": 1500,\n  "currency": "sms",\n  "last_updated": "2026-01-15T10:00:00Z"\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl https://api.smsok.io/v1/credits/balance \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/credits/balance', {\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.get('https://api.smsok.io/v1/credits/balance',\n  headers={'Authorization':'Bearer sk_live_your_key_here'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/credits/balance');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
  "credits-usage": {
    id: "credits-usage",
    method: "GET",
    path: "/credits/usage",
    description: "Get SMS usage history with optional date range filtering.",
    category: "credits",
    params: [
      { name: "from", type: "string", required: false, description: "Start date in YYYY-MM-DD format." },
      { name: "to", type: "string", required: false, description: "End date in YYYY-MM-DD format." },
    ],
    statusCodes: [
      { code: "200", label: "OK", response: `{\n  "data": [\n    { "date": "2026-01-15", "sms_used": 50, "messages_sent": 50 }\n  ],\n  "total_used": 50\n}` },
      { code: "401", label: "Unauthorized", response: `{\n  "error": "unauthorized",\n  "message": "Invalid or missing API key."\n}` },
    ],
    examples: [
      { lang: "cURL", code: `curl "https://api.smsok.io/v1/credits/usage?from=2026-01-01&to=2026-01-31" \\\n  -H "Authorization: Bearer sk_live_your_key_here"` },
      { lang: "Node.js", code: `const res = await fetch('https://api.smsok.io/v1/credits/usage?from=2026-01-01&to=2026-01-31', {\n  headers: { 'Authorization': 'Bearer sk_live_your_key_here' },\n});\nconst data = await res.json();` },
      { lang: "Python", code: `import requests\nres = requests.get('https://api.smsok.io/v1/credits/usage',\n  headers={'Authorization':'Bearer sk_live_your_key_here'},\n  params={'from':'2026-01-01','to':'2026-01-31'})\nprint(res.json())` },
      { lang: "PHP", code: `<?php\n$ch = curl_init('https://api.smsok.io/v1/credits/usage?from=2026-01-01&to=2026-01-31');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer sk_live_your_key_here']);\necho curl_exec($ch);` },
    ],
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MethodBadge({ method, size = "sm" }: { method: HttpMethod; size?: "sm" | "md" | "lg" }) {
  const s = METHOD_STYLES[method];
  const padding = size === "lg" ? "px-3 py-1 text-sm" : size === "md" ? "px-2.5 py-0.5 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center rounded font-mono font-bold tracking-wide border ${padding}`}
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {method}
    </span>
  );
}

function StatusBadge({ code }: { code: string }) {
  const s = STATUS_STYLE[code] ?? { bg: "rgba(var(--text-muted-rgb),0.13)", text: "var(--text-muted)" };
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {code}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors"
      style={{
        color: copied ? "var(--accent)" : "var(--text-muted)",
        background: "transparent",
      }}
      aria-label="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("sms-send");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"params" | "response" | "examples">("params");
  const [activeLanguage, setActiveLanguage] = useState<"cURL" | "Node.js" | "Python" | "PHP">("cURL");
  const [tryItOpen, setTryItOpen] = useState(false);
  const [tryItResponse, setTryItResponse] = useState<string | null>(null);

  const endpoint = ENDPOINTS[selectedEndpointId];

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    endpoints: cat.endpoints.filter((id) => {
      if (!searchQuery) return true;
      const ep = ENDPOINTS[id];
      return (
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }),
  })).filter((cat) => cat.endpoints.length > 0);

  const handleSelectEndpoint = (id: string) => {
    setSelectedEndpointId(id);
    setActiveTab("params");
    setTryItOpen(false);
    setTryItResponse(null);
  };

  const handleSendRequest = () => {
    setTryItResponse(
      endpoint.statusCodes[0]?.response ??
        '{\n  "status": "ok"\n}'
    );
  };

  const tabs: { id: "params" | "response" | "examples"; label: string }[] = [
    { id: "params", label: "Parameters" },
    { id: "response", label: "Response" },
    { id: "examples", label: "Examples" },
  ];

  const languages: Array<"cURL" | "Node.js" | "Python" | "PHP"> = ["cURL", "Node.js", "Python", "PHP"];

  const currentExample = endpoint.examples.find((e) => e.lang === activeLanguage) ?? endpoint.examples[0];

  // Default Try It values
  const defaultHeader = "Authorization: Bearer sk_live_...";
  const defaultBody = endpoint.params.some((p) => p.required && endpoint.method !== "GET")
    ? JSON.stringify(
        Object.fromEntries(
          endpoint.params
            .filter((p) => p.required && endpoint.method !== "GET")
            .map((p) => [p.name, p.type === "string[]" ? ["example"] : p.type === "number" ? 1 : "example"])
        ),
        null,
        2
      )
    : "";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* ── Top Bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 h-14 border-b"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        {/* Title + version */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
            SMSOK API Documentation
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: "rgba(var(--accent-rgb),0.12)",
              color: "var(--accent)",
              border: "1px solid rgba(var(--accent-rgb),0.2)",
            }}
          >
            v1.0
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            placeholder="Search endpoints…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--accent)]"
          />
        </div>

        {/* API Keys link */}
        <div className="ml-auto shrink-0">
          <Link href="/dashboard/api-keys">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <Key className="h-3.5 w-3.5" />
              API Keys
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Below top bar ── */}
      <div className="flex w-full pt-14">
        {/* ── Sidebar ── */}
        <aside
          className="w-[240px] shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-r"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          <div className="py-4 px-3 space-y-5">
            {filteredCategories.map((cat) => (
              <div key={cat.id}>
                {/* Category header */}
                <div
                  className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  {cat.label}
                </div>
                {/* Endpoints */}
                <div className="space-y-0.5">
                  {cat.endpoints.map((id) => {
                    const ep = ENDPOINTS[id];
                    const isActive = id === selectedEndpointId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectEndpoint(id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors"
                        style={{
                          background: isActive ? "var(--bg-elevated)" : "transparent",
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                          borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                        }}
                      >
                        <MethodBadge method={ep.method} size="sm" />
                        <span className="font-mono truncate">{ep.path}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <p className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                No endpoints match your search.
              </p>
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 px-8 py-8 max-w-[800px]">
          {endpoint && (
            <div className="space-y-8">
              {/* ── Endpoint Header ── */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method={endpoint.method} size="lg" />
                  <code
                    className="text-lg font-mono font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {endpoint.path}
                  </code>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {endpoint.description}
                </p>
              </div>

              {/* ── Tabs ── */}
              <div>
                <div
                  className="flex gap-1 border-b mb-6"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className="px-4 py-2 text-sm font-medium transition-colors relative"
                        style={{
                          color: isActive ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {tab.label}
                        {isActive && (
                          <span
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                            style={{ background: "var(--accent)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Parameters Tab */}
                {activeTab === "params" && (
                  <div>
                    {endpoint.params.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        This endpoint has no parameters.
                      </p>
                    ) : (
                      <div
                        className="rounded-lg overflow-hidden border"
                        style={{ borderColor: "var(--border-default)" }}
                      >
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ background: "var(--bg-elevated)" }}>
                              {["Name", "Type", "Required", "Description"].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.params.map((param, i) => (
                              <tr
                                key={param.name}
                                style={{
                                  borderTop: i > 0 ? `1px solid var(--border-default)` : undefined,
                                }}
                              >
                                <td className="px-4 py-3">
                                  <code
                                    className="text-xs font-mono font-medium"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {param.name}
                                  </code>
                                </td>
                                <td className="px-4 py-3">
                                  <code
                                    className="text-xs font-mono"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    {param.type}
                                  </code>
                                </td>
                                <td className="px-4 py-3">
                                  {param.required ? (
                                    <span
                                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                      style={{
                                        background: "rgba(var(--accent-rgb),0.12)",
                                        color: "var(--accent)",
                                        border: "1px solid rgba(var(--accent-rgb),0.2)",
                                      }}
                                    >
                                      required
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                                      style={{
                                        background: "var(--bg-muted)",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      optional
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {param.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Response Tab */}
                {activeTab === "response" && (
                  <div className="space-y-4">
                    {endpoint.statusCodes.map((sc) => (
                      <div
                        key={sc.code}
                        className="rounded-lg border overflow-hidden"
                        style={{ borderColor: "var(--border-default)" }}
                      >
                        <div
                          className="flex items-center gap-2 px-4 py-2.5 border-b"
                          style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border-default)",
                          }}
                        >
                          <StatusBadge code={sc.code} />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="relative">
                          <pre
                            className="p-4 text-xs font-mono overflow-x-auto leading-relaxed"
                            style={{
                              background: "var(--bg-surface)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <JsonHighlight code={sc.response} />
                          </pre>
                          <div className="absolute top-2 right-2">
                            <CopyButton text={sc.response} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Examples Tab */}
                {activeTab === "examples" && (
                  <div>
                    {/* Language tabs */}
                    <div
                      className="flex gap-1 mb-4 p-1 rounded-lg w-fit"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      {languages.map((lang) => {
                        const isActive = activeLanguage === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setActiveLanguage(lang)}
                            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                            style={{
                              background: isActive ? "var(--bg-surface)" : "transparent",
                              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                            }}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>

                    {/* Code block */}
                    {currentExample && (
                      <div
                        className="rounded-lg border overflow-hidden"
                        style={{ borderColor: "var(--border-default)" }}
                      >
                        <div
                          className="flex items-center justify-between px-4 py-2 border-b"
                          style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border-default)",
                          }}
                        >
                          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                            {currentExample.lang}
                          </span>
                          <CopyButton text={currentExample.code} />
                        </div>
                        <pre
                          className="p-4 text-xs font-mono overflow-x-auto leading-relaxed"
                          style={{
                            background: "var(--bg-surface)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {currentExample.code}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Try It Section ── */}
              <div
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: "var(--border-default)" }}
              >
                {/* Collapsible header */}
                <button
                  type="button"
                  onClick={() => setTryItOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" style={{ color: "var(--accent)" }} />
                    Try it
                  </span>
                  {tryItOpen ? (
                    <ChevronUp className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  )}
                </button>

                {tryItOpen && (
                  <div
                    className="p-4 space-y-4"
                    style={{ background: "var(--bg-surface)" }}
                  >
                    {/* Header input */}
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Authorization Header
                      </label>
                      <Input
                        defaultValue={defaultHeader}
                        className="font-mono text-xs border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--accent)]"
                      />
                    </div>

                    {/* Body textarea (only for non-GET) */}
                    {endpoint.method !== "GET" && (
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Request Body
                        </label>
                        <textarea
                          defaultValue={defaultBody}
                          rows={6}
                          className="w-full rounded-md border px-3 py-2 font-mono text-xs leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                    )}

                    {/* Send button */}
                    <Button
                      onClick={handleSendRequest}
                      className="text-xs font-semibold"
                      style={{
                        background: "var(--accent)",
                        color: "var(--text-on-accent)",
                      }}
                    >
                      Send Request
                    </Button>

                    {/* Response area */}
                    {tryItResponse && (
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Response
                        </label>
                        <pre
                          className="rounded-md border p-3 text-xs font-mono leading-relaxed overflow-x-auto"
                          style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border-default)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <JsonHighlight code={tryItResponse} />
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── JSON Syntax Highlighter ──────────────────────────────────────────────────

function JsonHighlight({ code }: { code: string }) {
  // Tokenize JSON into colored spans
  const tokens = tokenizeJson(code);
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} style={{ color: token.color }}>
          {token.text}
        </span>
      ))}
    </>
  );
}

type Token = { text: string; color: string };

function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = [];
  // Regex to match JSON tokens
  const re =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],:])/g;
  let last = 0;
  let match: RegExpExecArray | null;

  // Colors using CSS vars where possible, or fixed for the dark theme
  const KEY_COLOR = "var(--info)";       // blue — JSON key
  const STRING_COLOR = "var(--success)";    // green — string value
  const LITERAL_COLOR = "var(--error)";   // red — true/false/null
  const NUMBER_COLOR = "var(--warning)";    // amber — number
  const PUNCT_COLOR = "var(--text-muted)";     // muted — punctuation

  while ((match = re.exec(code)) !== null) {
    // Preceding plain text (whitespace/newlines)
    if (match.index > last) {
      tokens.push({ text: code.slice(last, match.index), color: PUNCT_COLOR });
    }

    if (match[1]) {
      // key: push key + colon
      const full = match[0];
      const keyText = match[1];
      const rest = full.slice(keyText.length); // ": " etc
      tokens.push({ text: keyText, color: KEY_COLOR });
      tokens.push({ text: rest, color: PUNCT_COLOR });
    } else if (match[2]) {
      tokens.push({ text: match[2], color: STRING_COLOR });
    } else if (match[3]) {
      tokens.push({ text: match[3], color: LITERAL_COLOR });
    } else if (match[4]) {
      tokens.push({ text: match[4], color: NUMBER_COLOR });
    } else if (match[5]) {
      tokens.push({ text: match[5], color: PUNCT_COLOR });
    }

    last = match.index + match[0].length;
  }

  if (last < code.length) {
    tokens.push({ text: code.slice(last), color: PUNCT_COLOR });
  }

  return tokens;
}
