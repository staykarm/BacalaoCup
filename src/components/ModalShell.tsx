"use client";

import { ReactNode, useEffect } from "react";

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-card-border bg-card shadow-2xl sm:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-gold-deep sm:text-xl">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Lukk"
            className="rounded-full border border-card-border px-3 py-1 text-sm text-ink-light hover:bg-card-deep"
          >
            Lukk ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
