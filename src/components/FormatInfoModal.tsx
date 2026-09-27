"use client";

import { FORMAT_LABELS, SessionFormat } from "@/lib/types";
import { FORMAT_INFO } from "@/lib/formatInfo";
import { ModalShell } from "./ModalShell";

export function FormatInfoModal({ format, onClose }: { format: SessionFormat; onClose: () => void }) {
  return (
    <ModalShell title={FORMAT_LABELS[format]} onClose={onClose}>
      <p className="text-sm leading-relaxed text-ink">{FORMAT_INFO[format]}</p>
    </ModalShell>
  );
}
