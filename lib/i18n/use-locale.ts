"use client";

import { useCallback, useSyncExternalStore } from "react";
import { type Locale, defaultLocale, isValidLocale } from "./config";

const STORAGE_KEY = "smsok-locale";

function getSnapshot(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isValidLocale(stored) ? stored : defaultLocale;
}

function getServerSnapshot(): Locale {
  return defaultLocale;
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    for (const cb of listeners) cb();
  }, []);

  return { locale, setLocale };
}
