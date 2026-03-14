"use client";

import { useState, useEffect } from "react";
import { useLocale } from "./use-locale";
import { getDictionary } from "./dictionaries";

type Dictionary = Record<string, unknown>;

function getNestedValue(obj: Dictionary, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Dictionary)[key];
  }
  return typeof current === "string" ? current : path;
}

export function useTranslation() {
  const { locale, setLocale } = useLocale();
  const [dict, setDict] = useState<Dictionary>({});

  useEffect(() => {
    getDictionary(locale).then(setDict);
  }, [locale]);

  const t = (key: string): string => getNestedValue(dict, key);

  return { t, locale, setLocale };
}
