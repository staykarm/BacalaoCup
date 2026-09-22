"use client";

import { useTournament } from "@/context/TournamentContext";
import { FORMAT_LABELS } from "@/lib/types";
import { TRANSPORT_INFO } from "@/lib/transportInfo";
import { AGENDA_EXTRAS } from "@/lib/agendaExtras";
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
            | { kind: "transport"; time: string; from: string; to: string }
            | { kind: "event"; time: string; label: string; icon: string; address?: string };

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

          const eventItems: AgendaItem[] = (AGENDA_EXTRAS[day.id] ?? []).map((event) => ({
            kind: "event",
            time: event.time,
            label: event.label,
            icon: event.icon,
            address: event.address,
          }));

          const items = [...sessionItems, ...transportItems, ...eventItems].sort((a, b) =>
            a.time.localeCompare(b.time)
          );

          return (
            <div key={day.id} className="rounded-2xl border border-card-border bg-white p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">{day.label}</span>
                <span className="text-xs uppercase tracking-wide text-ink-light/60">
                  {day.course ?? "Bane ikke oppgitt"}
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((item, i) => {
                  if (item.kind === "session") {
                    return (
                      <li
                        key={`s-${item.session.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-card-deep px-3 py-2 text-sm"
                      >
                        <span className="w-14 shrink-0 font-semibold text-gold-deep">
                          {item.time === "99:99" ? "--:--" : item.time}
                        </span>
                        <span className="flex-1 text-ink">{item.session.name}</span>
                        <span className="shrink-0 text-xs uppercase tracking-wide text-ink-light/60">
                          {FORMAT_LABELS[item.session.format]}
                        </span>
                      </li>
                    );
                  }
                  if (item.kind === "event") {
                    return (
                      <li
                        key={`e-${i}`}
                        className="flex items-start gap-3 rounded-xl bg-card-deep px-3 py-2 text-sm"
                      >
                        <span className="w-14 shrink-0 pt-0.5 font-semibold text-gold-deep">{item.time}</span>
                        <span className="flex-1">
                          <span className="font-medium text-ink">
                            {item.icon} {item.label}
                          </span>
                          {item.address && <span className="block text-xs text-ink-light/60">{item.address}</span>}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={`t-${i}`}
                      className="flex items-center gap-3 rounded-xl bg-card-deep px-3 py-2 text-sm"
                    >
                      <span className="w-14 shrink-0 font-semibold text-ink-light">{item.time}</span>
                      <span className="flex-1 text-ink-light">
                        🚐 {item.from} → {item.to}
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
