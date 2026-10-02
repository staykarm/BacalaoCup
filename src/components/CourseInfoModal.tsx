"use client";

import { COURSE_INFO } from "@/lib/courseInfo";
import { ModalShell } from "./ModalShell";

/** A single course's info, e.g. linked from the agenda — unlike BaneinfoModal, which lists every day's course. */
export function CourseInfoModal({ courseName, onClose }: { courseName: string; onClose: () => void }) {
  const info = COURSE_INFO[courseName];

  return (
    <ModalShell title={info?.name ?? courseName} onClose={onClose}>
      {info ? (
        <>
          <div className="mb-3 text-xs uppercase tracking-wide text-ink-light/60">{info.location}</div>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-card-deep px-2 py-1.5">
              <div className="font-bold text-gold-deep">Par {info.par}</div>
              <div className="text-ink-light/60">par</div>
            </div>
            <div className="rounded-xl bg-card-deep px-2 py-1.5">
              <div className="font-bold text-gold-deep">{info.length}</div>
              <div className="text-ink-light/60">lengde</div>
            </div>
            <div className="rounded-xl bg-card-deep px-2 py-1.5">
              <div className="font-bold text-gold-deep">{info.year}</div>
              <div className="text-ink-light/60">åpnet</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-ink-light">{info.description}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-ink-light/60">Designer: {info.designer}</p>
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-gold-deep/50 bg-gold/10 px-2 py-1 text-[11px] font-semibold text-gold-deep hover:bg-gold/20"
            >
              Nettside ↗
            </a>
          </div>
        </>
      ) : (
        <p className="text-sm italic text-ink-light/60">Ingen info lagret for «{courseName}» ennå.</p>
      )}
    </ModalShell>
  );
}
