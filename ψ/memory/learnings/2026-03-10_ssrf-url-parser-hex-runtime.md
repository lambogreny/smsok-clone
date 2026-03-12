---
title: URL Parser IPv6 Hex Conversion + SSRF Self-Testing
created: 2026-03-10
tags: [ssrf, ipv6, url-parser, bun, nodejs, security, testing]
---

# URL Parser IPv6 Runtime Behavior

## Key Discovery
Bun/Node URL parser does TWO transformations on IPv6:
1. **Keeps brackets**: `new URL("http://[::1]/").hostname` → `[::1]` (not `::1`)
2. **Converts dotted to hex**: `::ffff:127.0.0.1` → `::ffff:7f00:1`

Both break naive SSRF checks that assume `isIP(hostname)` works directly.

## Fix Pattern
```ts
// 1. Strip brackets BEFORE isIP() guard
const hostname = stripBrackets(parsed.hostname)

// 2. Handle hex IPv4-mapped IPv6
function hexToIPv4(hexStr: string): string | null {
  const [high, low] = hexStr.split(":").map(h => parseInt(h, 16))
  return `${(high>>8)&0xff}.${high&0xff}.${(low>>8)&0xff}.${low&0xff}`
}
```

## Rule
Always self-test security fixes with actual runtime URL parser before committing.
5 minutes of self-testing saves 30 minutes of QA roundtrips.
