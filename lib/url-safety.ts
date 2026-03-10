/**
 * SSRF Protection — blocks requests to internal/private IP addresses.
 * Used before every outbound webhook fetch.
 */

import { isIP } from "net"
import dns from "dns/promises"

// Private/reserved IPv4 ranges
const BLOCKED_IPV4_RANGES = [
  { prefix: "127.", name: "loopback" },           // 127.0.0.0/8
  { prefix: "10.", name: "private-A" },            // 10.0.0.0/8
  { prefix: "0.", name: "current-network" },       // 0.0.0.0/8
  { prefix: "169.254.", name: "link-local" },      // 169.254.0.0/16 (AWS metadata)
  { prefix: "192.168.", name: "private-C" },       // 192.168.0.0/16
]

// CGNAT range: 100.64.0.0/10 (100.64.x.x – 100.127.x.x)
function isCGNAT(ip: string): boolean {
  if (!ip.startsWith("100.")) return false
  const second = parseInt(ip.split(".")[1] ?? "0", 10)
  return second >= 64 && second <= 127
}

// 172.16.0.0/12 requires range check (172.16.x.x – 172.31.x.x)
function isPrivate172(ip: string): boolean {
  if (!ip.startsWith("172.")) return false
  const second = parseInt(ip.split(".")[1] ?? "0", 10)
  return second >= 16 && second <= 31
}

/**
 * Extract embedded IPv4 from IPv4-mapped/translated IPv6 addresses.
 * Formats: ::ffff:A.B.C.D, ::ffff:0:A.B.C.D, 0:0:0:0:0:ffff:A.B.C.D
 */
function extractEmbeddedIPv4(ip: string): string | null {
  const lower = ip.toLowerCase()

  // ::ffff:A.B.C.D (most common IPv4-mapped)
  if (lower.startsWith("::ffff:")) {
    const rest = lower.slice(7)
    if (isIP(rest) === 4) return rest
  }

  // ::ffff:0:A.B.C.D (IPv4-translated)
  if (lower.startsWith("::ffff:0:")) {
    const rest = lower.slice(9)
    if (isIP(rest) === 4) return rest
  }

  // Full form: 0:0:0:0:0:ffff:A.B.C.D
  const fullMapped = /^(?:0+:){5}ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i
  const match = lower.match(fullMapped)
  if (match && isIP(match[1]!) === 4) return match[1]!

  return null
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()

  // Check for IPv4-mapped/translated IPv6 — apply IPv4 rules to embedded address
  const embeddedIPv4 = extractEmbeddedIPv4(normalized)
  if (embeddedIPv4) return isBlockedIPv4(embeddedIPv4)

  // Loopback ::1 (all forms: 0:0:0:0:0:0:0:1, etc.)
  if (normalized === "::1" || /^(?:0+:){7}0*1$/.test(normalized)) return true

  // Unspecified :: (0:0:0:0:0:0:0:0)
  if (normalized === "::" || normalized === "::0" || /^(?:0+:){7}0+$/.test(normalized)) return true

  // Link-local fe80::/10
  if (normalized.startsWith("fe80:") || normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") || normalized.startsWith("fea") ||
      normalized.startsWith("feb")) return true

  // Unique-local fc00::/7 (fc00:: – fdff::)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true

  return false
}

function isBlockedIPv4(ip: string): boolean {
  for (const range of BLOCKED_IPV4_RANGES) {
    if (ip.startsWith(range.prefix)) return true
  }
  if (isPrivate172(ip)) return true
  if (isCGNAT(ip)) return true
  return false
}

function isBlockedIP(ip: string): boolean {
  // Strip IPv6 brackets if present (e.g., "[::1]" → "::1")
  const cleaned = ip.startsWith("[") && ip.endsWith("]") ? ip.slice(1, -1) : ip
  if (isIP(cleaned) === 4) return isBlockedIPv4(cleaned)
  if (isIP(cleaned) === 6) return isBlockedIPv6(cleaned)
  return false
}

/**
 * Check if a URL points to an internal/private address.
 * Resolves DNS to catch hostname-based SSRF (e.g., internal.company.com → 10.x.x.x).
 */
export async function isInternalUrl(urlString: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return true // Invalid URL = block
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return true
  }

  const hostname = parsed.hostname

  // Direct IP check
  if (isIP(hostname)) {
    return isBlockedIP(hostname)
  }

  // Block common internal hostnames
  const blockedHostnames = [
    "localhost",
    "metadata.google.internal",
    "metadata.google.com",
  ]
  if (blockedHostnames.includes(hostname.toLowerCase())) {
    return true
  }

  // DNS resolution check — resolve hostname and verify all IPs are public
  try {
    const addresses = await dns.resolve4(hostname).catch(() => [] as string[])
    const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[])
    const allAddresses = [...addresses, ...addresses6]

    // If no addresses resolved, block
    if (allAddresses.length === 0) return true

    // Block if ANY resolved address is internal
    for (const addr of allAddresses) {
      if (isBlockedIP(addr)) return true
    }
  } catch {
    // DNS resolution failed — block to be safe
    return true
  }

  return false
}

/**
 * Anti-DNS-rebinding fetch: resolves DNS → validates all IPs → fetches by IP.
 * Prevents TOCTOU between DNS resolution in isInternalUrl() and fetch().
 * For HTTPS: uses Host header + resolved IP (SNI still works in most runtimes).
 */
export async function safeFetch(
  urlString: string,
  init?: RequestInit
): Promise<Response> {
  const parsed = new URL(urlString)
  const hostname = parsed.hostname

  // Direct IP — already validated by caller's isInternalUrl()
  if (isIP(hostname)) {
    if (isBlockedIP(hostname)) {
      throw new Error("SSRF blocked: internal IP address")
    }
    return fetch(urlString, init)
  }

  // Resolve DNS ourselves — prevents rebinding between check and fetch
  const addresses = await dns.resolve4(hostname).catch(() => [] as string[])
  const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[])
  const allAddresses = [...addresses, ...addresses6]

  if (allAddresses.length === 0) {
    throw new Error("SSRF blocked: DNS resolution failed")
  }

  // Check ALL resolved IPs
  for (const addr of allAddresses) {
    if (isBlockedIP(addr)) {
      throw new Error(`SSRF blocked: resolved to internal IP`)
    }
  }

  // Use first safe IP to prevent rebinding — set Host header for vhosts
  const ip = allAddresses[0]!
  const targetUrl = new URL(urlString)
  targetUrl.hostname = isIP(ip) === 6 ? `[${ip}]` : ip

  const headers = new Headers(init?.headers)
  headers.set("Host", parsed.host)

  return fetch(targetUrl.toString(), {
    ...init,
    headers,
  })
}

/**
 * Synchronous URL format check (no DNS) — for quick validation on create/update.
 * Does NOT catch DNS-based SSRF; use isInternalUrl() for full check before fetch.
 */
export function isObviouslyInternalUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString)
    if (!["http:", "https:"].includes(parsed.protocol)) return true

    const hostname = parsed.hostname.toLowerCase()

    // Check direct IP
    if (isIP(hostname)) return isBlockedIP(hostname)

    // Check common internal hostnames
    if (hostname === "localhost") return true
    if (hostname.endsWith(".local")) return true
    if (hostname.endsWith(".internal")) return true

    return false
  } catch {
    return true
  }
}
