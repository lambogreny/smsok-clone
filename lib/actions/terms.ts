
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const CURRENT_TOS_VERSION = "1.0"

// ── Accept Terms (append-only — never overwrite) ────────

export async function acceptTerms(options?: {
  ipAddress?: string
  userAgent?: string
  userId?: string
}) {
  const sessionUser = await getSession()
  const userId = options?.userId ?? sessionUser?.id
  if (!userId) throw new Error("กรุณาเข้าสู่ระบบ")
  const user = { id: userId }

  // Check if already accepted this version
  const existing = await prisma.termsAcceptance.findFirst({
    where: { userId: user.id, version: CURRENT_TOS_VERSION },
    select: { id: true },
  })
  if (existing) {
    return { success: true, alreadyAccepted: true, version: CURRENT_TOS_VERSION }
  }

  // Append-only: create new record, also update User.acceptedTermsAt for quick checks
  await prisma.$transaction(async (tx) => {
    await tx.termsAcceptance.create({
      data: {
        userId: user.id,
        version: CURRENT_TOS_VERSION,
        ipAddress: options?.ipAddress ?? null,
        userAgent: options?.userAgent ?? null,
      },
    })
    await tx.user.update({
      where: { id: user.id },
      data: { acceptedTermsAt: new Date() },
    })
  })

  return { success: true, version: CURRENT_TOS_VERSION }
}

// ── Get Terms Status ────────────────────────────────────

export async function getTermsStatus(apiUserId?: string) {
  const sessionUser = await getSession()
  const userId = apiUserId ?? sessionUser?.id
  if (!userId) throw new Error("กรุณาเข้าสู่ระบบ")
  const user = { id: userId }

  const latest = await prisma.termsAcceptance.findFirst({
    where: { userId: user.id },
    orderBy: { acceptedAt: "desc" },
    select: { version: true, acceptedAt: true },
  })

  return {
    accepted: latest?.version === CURRENT_TOS_VERSION,
    currentVersion: CURRENT_TOS_VERSION,
    acceptedVersion: latest?.version ?? null,
    acceptedAt: latest?.acceptedAt ?? null,
    needsReaccept: latest ? latest.version !== CURRENT_TOS_VERSION : true,
  }
}

// ── Get Current ToS Version ─────────────────────────────

export async function getCurrentTermsVersion() {
  return CURRENT_TOS_VERSION
}

// ── Get Acceptance History (audit trail) ─────────────────

export async function getTermsHistory() {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  const history = await prisma.termsAcceptance.findMany({
    where: { userId: user.id },
    orderBy: { acceptedAt: "desc" },
    select: {
      version: true,
      acceptedAt: true,
    },
  })

  return history
}
