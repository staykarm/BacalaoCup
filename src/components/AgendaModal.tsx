"use client";

import { useTournament } from "@/context/TournamentContext";
import { FORMAT_LABELS } from "@/lib/types";
import { TRANSPORT_INFO } from "@/lib/transportInfo";
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

          type AgendaItem =
            | { kind: "session"; time: string; session: (typeof daySessions)[number] }
            | { kind: "transport"; time: string; from: string; to: string };

          const sessionItems: AgendaItem[] = daySessions.map((session) => {
            const sessionMatches = matches.filter((m) => m.session_id === session.id);
            const times = sessionMatches
              .map((m) => m.start_time)
              .filter((t): t is string => !!t)
              .sort();
            return { kind: "session", time: times[0] ?? "99:99", session };
          });

          const transportItems: AgendaItem[] = (TRANSPORT_INFO[day.id] ?? []).map((leg) => ({
            kind: "transport",
            time: leg.time,
            from: leg.from,
            to: leg.to,
          }));

          const items = [...sessionItems, ...transportItems].sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={day.id} className="rounded-xl border border-navy-lighter/50 bg-navy-light/40 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground/90">{day.label}</span>
                <span className="text-xs uppercase tracking-wide text-foreground/40">
                  {day.course ?? "Bane ikke oppgitt"}
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((item, i) =>
                  item.kind === "session" ? (
                    <li
                      key={`s-${item.session.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-navy-deep/40 px-3 py-2 text-sm"
                    >
                      <span className="w-14 shrink-0 font-semibold text-gold">
                        {item.time === "99:99" ? "--:--" : item.time}
                      </span>
                      <span className="flex-1 text-foreground/80">{item.session.name}</span>
                      <span className="shrink-0 text-xs uppercase tracking-wide text-foreground/40">
                        {FORMAT_LABELS[item.session.format]}
                      </span>
                    </li>
                  ) : (
                    <li
                      key={`t-${i}`}
                      className="flex items-center gap-3 rounded-lg bg-navy-deep/20 px-3 py-2 text-sm"
                    >
                      <span className="w-14 shrink-0 font-semibold text-foreground/50">{item.time}</span>
                      <span className="flex-1 text-foreground/60">
                        🚐 {item.from} → {item.to}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
