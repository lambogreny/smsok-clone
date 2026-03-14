export function maskPhoneForLog(phone: string | null | undefined) {
  const value = (phone ?? "").trim();
  if (!value) {
    return "[redacted]";
  }

  const prefixLength = value.startsWith("+") ? 3 : 2;
  const suffixLength = value.length > prefixLength + 2 ? 2 : 1;
  const visiblePrefix = value.slice(0, prefixLength);
  const visibleSuffix = value.slice(-suffixLength);
  const hiddenLength = Math.max(value.length - visiblePrefix.length - visibleSuffix.length, 1);

  return `${visiblePrefix}${"*".repeat(hiddenLength)}${visibleSuffix}`;
}
