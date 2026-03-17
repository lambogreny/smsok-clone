"use client";

import { Loader2 } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import type { Button as ButtonPrimitive } from "@base-ui/react/button";

interface LoadingButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Button with built-in loading state.
 * When `loading` is true: shows spinner, disables clicks, optional loadingText.
 *
 * Usage:
 * ```tsx
 * <LoadingButton loading={isPending} loadingText="กำลังบันทึก...">
 *   บันทึก
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
