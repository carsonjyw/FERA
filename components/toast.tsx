"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastInput = { message: string; href?: string; linkLabel?: string };
type Toast = ToastInput & { id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastContext);

// One lightweight confirmation at a time. The wrapper is always in the page and
// announced politely to screen readers; the message itself appears for ~6 seconds.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((input: ToastInput) => {
    clearTimeout(timer.current);
    setToast({ ...input, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-surface-2 py-2 pl-5 pr-2 text-sm shadow-xl ring-1 ring-white/20"
          >
            <span>{toast.message}</span>
            {toast.href && (
              <Link
                href={toast.href}
                onClick={() => setToast(null)}
                className="whitespace-nowrap font-semibold text-accent underline"
              >
                {toast.linkLabel ?? "View"}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>
        )}
      </div>
    </ToastContext>
  );
}
