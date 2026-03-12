"use client";

import { ErrorState, getErrorType } from "@/components/ErrorState";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState type={getErrorType(error)} onRetry={reset} />;
}
