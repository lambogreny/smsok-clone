"use client";

import { useEffect } from "react";

const AUTH_CHANNEL = "auth";
const LOGOUT_KEY = "logout";

/**
 * AuthGuard — Cross-tab logout detection + global 401 handler
 *
 * Handles:
 * 1. BroadcastChannel + localStorage for cross-tab logout notification
 * 2. visibilitychange → GET /api/auth/me to detect revoked sessions
 * 3. Global 401 handler via fetch wrapper
 */
export default function AuthGuard() {
  useEffect(() => {
    // Guard flag to prevent double-redirect race condition
    let isRedirecting = false;

    function redirectToLogin() {
      if (isRedirecting) return;
      isRedirecting = true;
      window.location.href = "/login";
    }

    // ── 1. BroadcastChannel listener ──
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage = (e) => {
        if (e.data?.type === "logout") {
          redirectToLogin();
        }
      };
    } catch {
      // BroadcastChannel not supported — fallback to localStorage only
    }

    // ── 2. localStorage listener (cross-tab fallback) ──
    function onStorage(e: StorageEvent) {
      if (e.key === LOGOUT_KEY) {
        redirectToLogin();
      }
    }
    window.addEventListener("storage", onStorage);

    // ── 3. Tab focus check — verify session on return (debounced 30s) ──
    let lastVerifiedAt = 0;
    const VERIFY_DEBOUNCE_MS = 30_000;

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastVerifiedAt < VERIFY_DEBOUNCE_MS) return;
      lastVerifiedAt = now;

      fetch("/api/auth/me", { credentials: "same-origin" })
        .then((res) => {
          if (res.status === 401) {
            redirectToLogin();
          }
        })
        .catch(() => {
          // Network error — don't redirect, user might be offline
        });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ── 4. Global 401 handler — intercept fetch responses ──
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);

      // Only handle 401 for same-origin API calls
      const url = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : "";
      const isSameOrigin = url.startsWith("/") || url.startsWith(window.location.origin);
      const isApiCall = url.includes("/api/");

      if (response.status === 401 && isSameOrigin && isApiCall) {
        // Don't redirect for auth endpoints or silent session checks
        const isExcluded =
          url.includes("/api/auth/login") ||
          url.includes("/api/auth/register") ||
          url.includes("/api/auth/me");
        if (!isExcluded) {
          redirectToLogin();
        }
      }

      return response;
    };

    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

/**
 * Call this after a successful logout API call to notify other tabs.
 */
export function broadcastLogout() {
  localStorage.setItem(LOGOUT_KEY, Date.now().toString());
  try {
    const ch = new BroadcastChannel(AUTH_CHANNEL);
    ch.postMessage({ type: "logout" });
    ch.close();
  } catch {
    // BroadcastChannel not supported
  }
}

/**
 * Call on login to clean up stale logout markers from previous sessions.
 */
export function clearLogoutMarker() {
  localStorage.removeItem(LOGOUT_KEY);
}
