"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] rounded-t-2xl max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-white">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-[var(--text-muted)]">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
          <div className="px-4 pb-6 pt-2">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-[var(--text-muted)]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
