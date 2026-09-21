"use client";

import { useTournament } from "@/context/TournamentContext";
import { FORMAT_LABELS } from "@/lib/types";
import { ModalShell } from "./ModalShell";

export function AgendaModal({ onClose }: { onClose: () => void }) {
  const { days, sessions, matches } = useTournament();
  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ModalShell title="Agenda" onClose={onClose}>
      <div className="space-y-5">
        {sortedDays.map((day) => {
          const daySessions = sessions
            .filter((s) => s.day_id === day.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <div key={day.id} className="rounded-xl border border-navy-lighter/50 bg-navy-light/40 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground/90">{day.label}</span>
                <span className="text-xs uppercase tracking-wide text-foreground/40">
                  {day.course ?? "Bane ikke oppgitt"}
                </span>
              </div>
              <ul className="space-y-1.5">
                {daySessions.map((session) => {
                  const sessionMatches = matches.filter((m) => m.session_id === session.id);
                  const times = sessionMatches
                    .map((m) => m.start_time)
                    .filter((t): t is string => !!t)
                    .sort();
                  const firstTime = times[0];

                  return (
                    <li
                      key={session.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-navy-deep/40 px-3 py-2 text-sm"
                    >
                      <span className="w-14 shrink-0 font-semibold text-gold">{firstTime ?? "--:--"}</span>
                      <span className="flex-1 text-foreground/80">{session.name}</span>
                      <span className="shrink-0 text-xs uppercase tracking-wide text-foreground/40">
                        {FORMAT_LABELS[session.format]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
