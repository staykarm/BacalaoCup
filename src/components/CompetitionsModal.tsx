"use client";

import { useTournament } from "@/context/TournamentContext";
import { COMPETITIONS } from "@/lib/competitions";
import { getHoleInfo } from "@/lib/courseHoles";
import { ModalShell } from "./ModalShell";

function HoleBadges({ holes, course }: { holes: number[]; course: string }) {
  return (
    <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
      {holes.map((h) => {
        const info = getHoleInfo(course, h);
        return (
          <span key={h} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm">
            Hull {h}
            {info.par !== null && <span className="ml-1 font-normal text-ink-light/60">par {info.par}</span>}
          </span>
        );
      })}
    </div>
  );
}

export function CompetitionsModal({ onClose }: { onClose: () => void }) {
  const { days } = useTournament();
  // A day with no course (e.g. a travel-only departure day) has no competitions to show.
  const sortedDays = [...days].filter((d) => d.course).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ModalShell title="Konkurranser" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-xs text-ink-light">
          Longest Drive (LD) og Closest to Pin (CTP) spilles på disse hullene hver dag.
        </p>

        {sortedDays.map((day) => {
          const comp = day.course ? COMPETITIONS[day.course] : undefined;

          return (
            <div key={day.id} className="rounded-2xl border border-card-border bg-white p-4">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">{day.label}</span>
                <span className="text-xs uppercase tracking-wide text-ink-light/60">{day.course}</span>
              </div>

              {comp ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-card-deep px-3 py-2.5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gold-deep">
                      Longest Drive
                    </div>
                    <HoleBadges holes={comp.longestDrive} course={day.course as string} />
                  </div>
                  <div className="rounded-xl bg-card-deep px-3 py-2.5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gold-deep">
                      Closest to Pin
                    </div>
                    <HoleBadges holes={comp.closestToPin} course={day.course as string} />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm italic text-ink-light/60">
                  Ingen konkurranser registrert for «{day.course}» ennå.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
