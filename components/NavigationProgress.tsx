"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top progress bar during route transitions.
 * Starts on internal link click, completes when pathname changes.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const prevPathRef = useRef<string>(pathname);

  const complete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    const timeout = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Detect route change
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      complete();
    }
  }, [pathname, complete]);

  // Listen for click on internal links to start progress
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (anchor.target === "_blank") return;
      if (href === pathname) return;

      // Start progress
      setVisible(true);
      setProgress(15);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          return p + (90 - p) * 0.1;
        });
      }, 200);
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }}
    >
      <div
        className="h-full bg-[var(--accent)]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 200ms ease",
          boxShadow: "0 0 8px rgba(0,255,167,0.4)",
        }}
      />
    </div>
  );
}
