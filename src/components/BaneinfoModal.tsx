"use client";

import { useTournament } from "@/context/TournamentContext";
import { COURSE_INFO } from "@/lib/courseInfo";
import { ModalShell } from "./ModalShell";

export function BaneinfoModal({ onClose }: { onClose: () => void }) {
  const { days } = useTournament();
  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ModalShell title="Baneinfo" onClose={onClose}>
      <div className="space-y-5">
        {sortedDays.map((day) => {
          const info = day.course ? COURSE_INFO[day.course] : undefined;

          return (
            <div key={day.id} className="rounded-2xl border border-card-border bg-white p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gold-deep">{day.label}</div>

              {info ? (
                <>
                  <div className="mb-1 font-display text-lg font-bold text-ink">{info.name}</div>
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
                <p className="text-sm italic text-ink-light/60">
                  {day.course ? `Ingen info lagret for «${day.course}» ennå.` : "Bane ikke oppgitt ennå."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
