"use client";

import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  /** The trigger element (button, link, etc.) */
  trigger: React.ReactNode;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm button variant */
  variant?: "default" | "destructive";
  /** Called when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Open state (controlled mode) */
  open?: boolean;
  /** On open change (controlled mode) */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Reusable confirmation dialog built on shadcn AlertDialog.
 *
 * Usage:
 * ```tsx
 * <ConfirmDialog
 *   trigger={<Button variant="destructive">ลบ</Button>}
 *   title="ยืนยันการลบ"
 *   description="คุณต้องการลบรายการนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
 *   confirmLabel="ลบ"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "default",
  onConfirm,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger render={trigger as React.ReactElement} />
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          {variant === "destructive" && (
            <AlertDialogMedia className="bg-[var(--danger-bg)]">
              <TriangleAlert className="size-5 text-[var(--error)]" />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            onClick={async () => {
              await onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
