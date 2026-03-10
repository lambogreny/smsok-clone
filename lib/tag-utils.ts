/**
 * Shared tag color utilities
 * Used by: ContactsClient, GroupDetailClient, and any future tag UI
 */

export const TAG_COLORS = [
  { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/20", activeBg: "bg-violet-500/25" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/20", activeBg: "bg-cyan-500/25" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20", activeBg: "bg-emerald-500/25" },
  { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20", activeBg: "bg-amber-500/25" },
  { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20", activeBg: "bg-rose-500/25" },
  { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20", activeBg: "bg-blue-500/25" },
  { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/20", activeBg: "bg-orange-500/25" },
] as const;

export const TAG_PRESETS = ["VIP", "ลูกค้าใหม่", "พนักงาน", "Supplier", "Partner"];

export const MAX_VISIBLE_TAGS = 3;

/**
 * Hash function — converts string to number for color selection
 * Deterministic: same tag always gets same color
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get consistent color for a tag
 */
export function getTagColor(tag: string) {
  return TAG_COLORS[hashString(tag) % TAG_COLORS.length];
}

/**
 * Parse comma-separated tags from contact.tags field
 */
export function parseTags(tagsStr: string | null): string[] {
  if (!tagsStr) return [];
  return tagsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
