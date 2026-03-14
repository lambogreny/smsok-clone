import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  iconBorder?: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  ctaSecondaryLabel?: string;
  ctaSecondaryAction?: () => void;
  helpLabel?: string;
  helpAction?: () => void;
  children?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  iconColor,
  iconBg,
  iconBorder,
  title,
  description,
  ctaLabel,
  ctaAction,
  ctaSecondaryLabel,
  ctaSecondaryAction,
  helpLabel,
  helpAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[400px] px-6 py-12 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg animate-in fade-in duration-300">
      {/* Icon */}
      <div
        className="flex items-center justify-center w-[72px] h-[72px] rounded-lg border mb-5"
        style={{ backgroundColor: iconBg, borderColor: iconBorder ?? "transparent" }}
      >
        <Icon size={32} strokeWidth={1.5} style={{ color: iconColor }} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 max-w-[360px]">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 max-w-[420px] whitespace-pre-line">
        {description}
      </p>

      {/* CTAs */}
      {(ctaLabel && ctaAction) && (
        <div className="flex items-center gap-3">
          <Button
            onClick={ctaAction}
            className="h-10 px-5 rounded-lg font-semibold bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90"
          >
            {ctaLabel}
          </Button>
          {ctaSecondaryLabel && ctaSecondaryAction && (
            <Button
              variant="outline"
              onClick={ctaSecondaryAction}
              className="h-10 px-5 rounded-lg font-semibold"
            >
              {ctaSecondaryLabel}
            </Button>
          )}
        </div>
      )}

      {/* Help link */}
      {helpLabel && helpAction && (
        <button
          type="button"
          onClick={helpAction}
          className="text-[13px] text-[var(--accent)] mt-3 hover:underline cursor-pointer"
        >
          {helpLabel}
        </button>
      )}

      {/* Extra content (e.g. trial badge) */}
      {children}
    </div>
  );
}
