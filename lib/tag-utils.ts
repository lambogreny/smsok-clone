/**
 * Shared tag color utilities — Nansen-aligned color system
 * Used by: ContactsClient, GroupDetailClient, TagsPanel, and any future tag UI
 *
 * Color mapping (UXUI spec):
 *   emerald #10B981, cyan #00E2B5, blue #4779FF, amber #F59E0B,
 *   red #EF4444, slate #6B7075, sky #00E2B5, teal #14B8A6
 *
 * ❌ NO violet, NO pink — replaced with cyan/red
 */

export type TagColor = {
  name: string;
  hex: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
  activeBg: string;
};

export const TAG_COLORS: TagColor[] = [
  { name: "emerald", hex: "#10B981", dot: "bg-emerald-500", bg: "bg-emerald-500/8",  text: "text-emerald-400", border: "border-emerald-500/20", activeBg: "bg-emerald-500/20" },
  { name: "cyan",    hex: "#00E2B5", dot: "bg-[var(--accent)]",   bg: "bg-[rgba(var(--accent-rgb),0.08)]", text: "text-[var(--accent)]", border: "border-[rgba(var(--accent-rgb),0.2)]", activeBg: "bg-[rgba(var(--accent-rgb),0.2)]" },
  { name: "blue",    hex: "#4779FF", dot: "bg-[var(--accent-secondary)]",   bg: "bg-[rgba(71,121,255,0.08)]", text: "text-[var(--accent-secondary)]", border: "border-[rgba(71,121,255,0.2)]", activeBg: "bg-[rgba(71,121,255,0.2)]" },
  { name: "amber",   hex: "#F59E0B", dot: "bg-amber-500",   bg: "bg-amber-500/8",  text: "text-amber-400",  border: "border-amber-500/20",  activeBg: "bg-amber-500/20" },
  { name: "red",     hex: "#EF4444", dot: "bg-red-500",     bg: "bg-red-500/8",    text: "text-red-400",    border: "border-red-500/20",    activeBg: "bg-red-500/20" },
  { name: "slate",   hex: "#6B7075", dot: "bg-[#6B7075]",   bg: "bg-[rgba(107,112,117,0.08)]", text: "text-[#6B7075]", border: "border-[rgba(107,112,117,0.2)]", activeBg: "bg-[rgba(107,112,117,0.2)]" },
  { name: "sky",     hex: "#00E2B5", dot: "bg-[#00E2B5]",   bg: "bg-[rgba(var(--accent-rgb),0.08)]",  text: "text-[#00E2B5]", border: "border-[rgba(var(--accent-rgb),0.2)]",  activeBg: "bg-[rgba(var(--accent-rgb),0.2)]" },
  { name: "teal",    hex: "#14B8A6", dot: "bg-teal-500",   bg: "bg-teal-500/8", text: "text-teal-400", border: "border-teal-500/20", activeBg: "bg-teal-500/20" },
];

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
export function getTagColor(tag: string): TagColor {
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
