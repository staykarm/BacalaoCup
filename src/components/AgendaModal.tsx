"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { FORMAT_LABELS } from "@/lib/types";
import { TRANSPORT_INFO } from "@/lib/transportInfo";
import { AGENDA_EXTRAS } from "@/lib/agendaExtras";
import { RestaurantInfo } from "@/lib/restaurantInfo";
import { ModalShell } from "./ModalShell";
import { BaneinfoModal } from "./BaneinfoModal";
import { RestaurantModal } from "./RestaurantModal";
import { KartModal } from "./KartModal";
import { CourseInfoModal } from "./CourseInfoModal";
import { RestaurantInfoModal } from "./RestaurantInfoModal";

type SubModal = "baneinfo" | "restaurant" | "kart" | null;

export function AgendaModal({ onClose }: { onClose: () => void }) {
  const { days, sessions, matches } = useTournament();
  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);
  const [subModal, setSubModal] = useState<SubModal>(null);
  const [courseModal, setCourseModal] = useState<string | null>(null);
  const [restaurantModal, setRestaurantModal] = useState<RestaurantInfo | null>(null);

  return (
    <ModalShell title="Agenda" onClose={onClose}>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => setSubModal("baneinfo")}
          className="flex flex-col items-center gap-1 rounded-2xl border border-card-border bg-card-deep px-2 py-2.5 text-ink transition hover:bg-card-border/60"
        >
          <span className="text-lg leading-none" aria-hidden>
            ⛳
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide">Baneinfo</span>
        </button>
        <button
          onClick={() => setSubModal("restaurant")}
          className="flex flex-col items-center gap-1 rounded-2xl border border-card-border bg-card-deep px-2 py-2.5 text-ink transition hover:bg-card-border/60"
        >
          <span className="text-lg leading-none" aria-hidden>
            🍽️
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide">Restaurant</span>
        </button>
        <button
          onClick={() => setSubModal("kart")}
          className="flex flex-col items-center gap-1 rounded-2xl border border-card-border bg-card-deep px-2 py-2.5 text-ink transition hover:bg-card-border/60"
        >
          <span className="text-lg leading-none" aria-hidden>
            🗺️
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide">Kart</span>
        </button>
      </div>

      <div className="space-y-5">
        {sortedDays.map((day) => {
          const daySessions = sessions
            .filter((s) => s.day_id === day.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          type AgendaItem =
            | { kind: "session"; time: string; session: (typeof daySessions)[number] }
            | { kind: "transport"; time: string; from: string; to: string }
            | { kind: "event"; time: string; label: string; icon: string; address?: string; restaurant?: RestaurantInfo };

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
            restaurant: event.restaurant,
          }));

          const items = [...sessionItems, ...transportItems, ...eventItems].sort((a, b) =>
            a.time.localeCompare(b.time)
          );

          return (
            <div key={day.id} className="rounded-2xl border border-card-border bg-white p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">{day.label}</span>
                {day.course ? (
                  <button
                    onClick={() => setCourseModal(day.course!)}
                    className="text-xs uppercase tracking-wide text-gold-deep hover:underline"
                  >
                    {day.course}
                  </button>
                ) : (
                  <span className="text-xs uppercase tracking-wide text-ink-light/60">Bane ikke oppgitt</span>
                )}
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
                            {item.icon}{" "}
                            {item.restaurant ? (
                              <button
                                onClick={() => setRestaurantModal(item.restaurant!)}
                                className="text-gold-deep hover:underline"
                              >
                                {item.label}
                              </button>
                            ) : (
                              item.label
                            )}
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

      {subModal === "baneinfo" && <BaneinfoModal onClose={() => setSubModal(null)} />}
      {subModal === "restaurant" && <RestaurantModal onClose={() => setSubModal(null)} />}
      {subModal === "kart" && <KartModal onClose={() => setSubModal(null)} />}
      {courseModal && <CourseInfoModal courseName={courseModal} onClose={() => setCourseModal(null)} />}
      {restaurantModal && <RestaurantInfoModal restaurant={restaurantModal} onClose={() => setRestaurantModal(null)} />}
    </ModalShell>
  );
}
