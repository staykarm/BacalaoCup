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
            <div key={day.id} className="rounded-2xl border border-navy-lighter/50 bg-navy-lighter/30 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">{day.label}</div>

              {info ? (
                <>
                  <div className="mb-1 font-display text-lg font-bold text-foreground/90">{info.name}</div>
                  <div className="mb-3 text-xs uppercase tracking-wide text-foreground/40">{info.location}</div>
                  <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-navy-light/40 px-2 py-1.5">
                      <div className="font-bold text-gold">Par {info.par}</div>
                      <div className="text-foreground/40">par</div>
                    </div>
                    <div className="rounded-xl bg-navy-light/40 px-2 py-1.5">
                      <div className="font-bold text-gold">{info.length}</div>
                      <div className="text-foreground/40">lengde</div>
                    </div>
                    <div className="rounded-xl bg-navy-light/40 px-2 py-1.5">
                      <div className="font-bold text-gold">{info.year}</div>
                      <div className="text-foreground/40">åpnet</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/70">{info.description}</p>
                  <p className="mt-2 text-xs text-foreground/40">Designer: {info.designer}</p>
                </>
              ) : (
                <p className="text-sm italic text-foreground/40">
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
