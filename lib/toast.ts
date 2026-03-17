import { toast } from "sonner";

/**
 * Toast helpers — Nansen DNA colors
 *
 * Colors from CSS vars:
 * success: var(--success) #089981
 * error: var(--error) #F23645
 * warning: var(--warning) #FACD63
 * info: var(--info) #4779FF
 * accent: var(--accent) #00E2B5
 */

export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    style: {
      background: "var(--bg-elevated)",
      border: "1px solid rgba(var(--success-rgb), 0.3)",
      color: "var(--text-primary)",
    },
  });
}

export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 6000,
    style: {
      background: "var(--bg-elevated)",
      border: "1px solid rgba(var(--error-rgb), 0.3)",
      color: "var(--text-primary)",
    },
  });
}

export function showWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 5000,
    style: {
      background: "var(--bg-elevated)",
      border: "1px solid rgba(var(--warning-rgb), 0.3)",
      color: "var(--text-primary)",
    },
  });
}

export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    style: {
      background: "var(--bg-elevated)",
      border: "1px solid rgba(var(--info-rgb), 0.3)",
      color: "var(--text-primary)",
    },
  });
}

export function showLoading(message: string) {
  return toast.loading(message, {
    style: {
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      color: "var(--text-primary)",
    },
  });
}

export function dismissToast(id: string | number) {
  toast.dismiss(id);
}

export { toast };
