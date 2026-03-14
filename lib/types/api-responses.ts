/**
 * Shared API response types — used by both frontend and backend
 * to prevent field mismatch issues.
 */

// ── Base API Response ───────────────────────────────────

export type ApiErrorResponse = {
  error: string
  code?: string
}

// ── Auth Responses ──────────────────────────────────────

export type LoginResponse =
  | {
      success: true
      needs2FA: true
      challengeToken: string
    }
  | {
      success: true
      needs2FA?: false
      user: {
        id: string
        email: string
        name: string
      }
      mustChangePassword: boolean
      redirectTo: string
    }

export type RegisterResponse = {
  success: true
  redirectTo: string
}

export type Challenge2FAResponse = {
  success: true
  user: {
    id: string
    email: string
    name: string
  }
  redirectTo: string
}

// ── OTP Responses ───────────────────────────────────────

export type OtpCooldownState = "ready" | "cooldown" | "backoff" | "blocked"

export type SendOtpResponse = {
  id: string
  ref: string
  phone: string
  purpose: string
  expiresAt: string
  expiresIn: number
  smsUsed: number
  smsRemaining: number
  delivery: "sms" | "debug"
  debugCode?: string
  retryAfter: number
  otpExpiresIn: number
  cooldownState: OtpCooldownState
}

export type OtpRateLimitResponse = {
  error: string
  retryAfter: number
  otpExpiresIn: number
  cooldownState: OtpCooldownState
}

export type VerifyOtpResponse = {
  valid: true
  verified: true
  ref: string
  phone: string
  purpose: string
}

export type RegisterOtpSendResponse = {
  ref: string
  expiresIn: number
  delivery: "sms" | "debug"
  debugCode?: string
}

export type RegisterOtpVerifyResponse = {
  valid: true
  phone: string
}

// ── SMS Responses ───────────────────────────────────────

export type SendSmsResponse = {
  id: string
  status: string
  sms_used: number
  sms_remaining: number
}

export type BatchSmsResponse = {
  totalRecipients: number
  totalSmsUsed: number
  smsRemaining: number
  results: Array<{
    phone: string
    status: string
    messageId: string | null
    error?: string
  }>
}

// ── User / Account ──────────────────────────────────────

export type UserData = {
  id: string
  name: string
  email: string
  role: string
}

export type BalanceResponse = {
  smsRemaining: number
}

export type ProfileResponse = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
}

// ── API Key Responses ───────────────────────────────────

export type ApiKeyCreateResponse = {
  id: string
  name: string
  key: string
  rateLimit: number
  ipWhitelist: string[]
  createdAt: Date
}

export type ApiKeyListItem = {
  id: string
  name: string
  key: string // masked: sk_live_xxxx...xxxx
  permissions: string[]
  rateLimit: number
  ipWhitelist: string[]
  isActive: boolean
  lastUsed: Date | null
  revokedAt: Date | null
  createdAt: Date
}

// ── Settings Responses ──────────────────────────────────

export type WorkspaceSettingsResponse = {
  name: string
  timezone: string
  language: string
}

export type NotificationPrefsResponse = {
  emailSmsLow: boolean
  emailCampaignDone: boolean
  emailWeeklyReport: boolean
  smsSmsLow: boolean
  smsCampaignDone: boolean
}

export type TwoFactorStatusResponse = {
  enabled: boolean
  setupAt: Date | null
  remainingRecoveryCodes: number
}

// ── Contact Responses ───────────────────────────────────

export type ContactItem = {
  id: string
  name: string
  phone: string
  email: string | null
  tags: string | null
  smsConsent: boolean
  groups: Array<{ id: string; name: string }>
  createdAt: string
}

export type ContactListResponse = {
  contacts: ContactItem[]
  pagination: PaginationMeta
}

// ── Custom Field Responses ──────────────────────────────

export type CustomFieldItem = {
  id: string
  name: string
  type: string
  options: string | null
  required: boolean
  createdAt: string
}

export type CustomFieldValueItem = {
  id: string
  contactId: string
  fieldId: string
  value: string
  field: {
    id: string
    name: string
    type: string
    options: string | null
  }
}

// ── Activity Timeline ───────────────────────────────────

export type ActivityItem = {
  type: "sms" | "otp"
  id: string
  timestamp: string
  data: Record<string, unknown>
}

export type ActivityTimelineResponse = {
  activities: ActivityItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Excel Import ────────────────────────────────────────

export type ExcelPreviewResponse = {
  headers: string[]
  preview: Record<string, string>[]
  totalRows: number
}

export type ExcelImportResult = {
  total: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ row: number; phone: string; error: string }>
}

export type ContactGroupItem = {
  id: string
  name: string
  memberCount: number
}

export type ContactGroupMembership = {
  id: string
  name: string
}

// ── Template Responses ───────────────────────────────────

export type TemplateItem = {
  id: string
  userId: string
  name: string
  content: string
  category: string
  createdAt: string
  updatedAt: string
}

// ── Tag Responses ───────────────────────────────────────

export type TagItem = {
  id: string
  name: string
  color: string
  createdAt: string | Date
  _count: { contactTags: number }
}

// ── Group Responses ─────────────────────────────────────

export type GroupItem = {
  id: string
  name: string
  createdAt: string | Date
  _count: { members: number }
}

export type GroupContactStub = {
  id: string
  name: string
  phone: string
}

export type GroupMember = {
  id: string
  groupId: string
  contactId: string
  contact: GroupContactStub
}

export type GroupDetailMember = {
  id: string
  contactId: string
  name: string
  phone: string
  email: string | null
}

export type GroupDetailContactStub = {
  id: string
  name: string
  phone: string
  tags: string | null
}

// ── Billing Responses ───────────────────────────────────

export type BillingInfoResponse = {
  id: string
  accountType: "INDIVIDUAL" | "CORPORATION"
  fullName: string | null
  citizenId: string | null
  companyName: string | null
  taxId: string | null
  branchCode: string | null
  branchName: string | null
  contactPerson: string | null
  address: string
  phone: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export type PackageTierResponse = {
  id: string
  name: string
  tierCode: string
  smsQuota: number
  totalSms: number
  price: string
  isActive: boolean
  sortOrder: number
}

export type DocumentNumberResponse = {
  documentNumber: string // e.g. "TIV-2569-000001"
  type: string
  year: number
}

// ── 2FA Responses ───────────────────────────────────────

export type Setup2FAResponse = {
  qrCode: string
  secret: string
  recoveryCodes: string[]
}

export type TwoFAStatusResponse = {
  enabled: boolean
  setupAt: Date | null
  remainingRecoveryCodes: number
}

export type RecoveryCodeResponse = {
  success: true
  remainingCodes: number
}

// ── Terms of Service Responses ───────────────────────────

export type TermsStatusResponse = {
  accepted: boolean
  currentVersion: string
  acceptedVersion: string | null
  acceptedAt: Date | null
  needsReaccept: boolean
}

export type AcceptTermsResponse = {
  success: true
  version: string
  alreadyAccepted?: boolean
}

export type TermsHistoryItem = {
  version: string
  acceptedAt: Date
}

// ── Webhook Responses ───────────────────────────────────

export type WebhookItem = {
  id: string
  url: string
  events: string[]
  active: boolean
  secret: string // masked
  failCount: number
  createdAt: Date
}

// ── Messages ───────────────────────────────────────────

export type MessageItem = {
  id: string
  recipient: string
  content: string
  senderName: string
  status: string
  creditCost: number
  createdAt: string | Date
}

// ── Dashboard ──────────────────────────────────────────

export type DayStats = {
  day: string
  short: string
  date: string
  sms: number
  delivered: number
  failed: number
}

export type PeriodStats = {
  total: number
  delivered: number
  failed: number
  sent: number
  pending: number
}

export type DashboardStats = {
  user: { name: string; email: string }
  today: PeriodStats
  yesterday: PeriodStats
  thisMonth: PeriodStats
  recentMessages: Array<{
    id: string
    recipient: string
    status: string
    senderName: string
    creditCost: number
    createdAt: string | Date
  }>
  last7Days: DayStats[]
}

// ── Pagination ──────────────────────────────────────────

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: PaginationMeta
}

// ── Queue Health ────────────────────────────────────────

export type { QueueHealthInfo, QueuesHealthResponse } from "../queue/types"

// ── Generic Success ─────────────────────────────────────

export type SuccessResponse = {
  success: true
}
