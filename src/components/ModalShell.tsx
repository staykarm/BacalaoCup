"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

const DISMISS_THRESHOLD_PX = 100;

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    setDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  }

  function handleTouchEnd() {
    if (dragY > DISMISS_THRESHOLD_PX) onClose();
    else setDragY(0);
    setDragging(false);
    touchStartY.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: dragging ? "none" : "transform 0.2s ease-out" } : undefined}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-card-border bg-card shadow-2xl sm:rounded-[2rem]"
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex shrink-0 justify-center py-2.5 sm:hidden"
        >
          <div className="h-1.5 w-12 rounded-full bg-card-border" aria-hidden />
        </div>

        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-gold-deep sm:text-xl">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Lukk"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-card-border text-base text-ink-light transition hover:bg-card-deep active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
