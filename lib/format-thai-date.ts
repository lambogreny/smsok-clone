/**
 * Centralized Thai date/time formatting utilities.
 *
 * All user-facing dates MUST use these helpers so the UI is consistently
 * displayed in Thai locale with Buddhist-era year (พ.ศ.).
 */

// ── Full datetime ────────────────────────────────────────────────────────
// "13 มี.ค. 2569 14:09 น."
export function formatThaiDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  const date = d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time} น.`;
}

// ── Date only (with year) ────────────────────────────────────────────────
// "13 มี.ค. 2569"
export function formatThaiDateOnly(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Short date (no year) ────────────────────────────────────────────────
// "13 มี.ค."
export function formatThaiDateShort(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

// ── Short date + time (no year) ─────────────────────────────────────────
// "13 มี.ค. 14:09 น."
export function formatThaiDateTimeShort(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  const date = d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time} น.`;
}

// ── Split date & time (for two-line layouts) ─────────────────────────────
// { date: "13 มี.ค. 2569", time: "14:09 น." }
export function formatThaiDateSplit(iso: string | Date): {
  date: string;
  time: string;
} {
  const d = iso instanceof Date ? iso : new Date(iso);
  return {
    date: d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    time:
      d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " น.",
  };
}

// ── Timestamp with seconds (for logs) ────────────────────────────────────
// "13 มี.ค. 14:09:30"
export function formatThaiTimestamp(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleString("th-TH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Full timestamp with seconds + year (for log detail) ──────────────────
// "13 มี.ค. 2569 14:09:30"
export function formatThaiTimestampFull(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Time only ────────────────────────────────────────────────────────────
// "14:09 น."
export function formatThaiTime(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return (
    d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " น."
  );
}

// ── Relative time ("5 นาทีที่แล้ว") ─────────────────────────────────────
export function timeAgo(iso: string | Date): string {
  const now = new Date();
  const date = iso instanceof Date ? iso : new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} สัปดาห์ที่แล้ว`;
  return formatThaiDateOnly(date);
}
