"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = "ค้นหา...",
  className,
}: DataTableSearchProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const debouncedChange = useCallback(
    (v: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(v), 300);
    },
    [onChange],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(v: string) {
    setLocal(v);
    debouncedChange(v);
  }

  function handleClear() {
    setLocal("");
    onChange("");
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
      />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--accent-rgb),0.4)] transition-colors"
      />
      {local && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
