"use client";

import { useMemo, useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { SessionSection } from "@/components/SessionSection";

export default function Home() {
  const { days, sessions, matches, players, loading, error, activeSessionId } = useTournament();
  const [activeDay, setActiveDay] = useState<string | null>(null);

  // Only days with golf on them belong on the main page — a travel-only day (e.g. Sunday) has nothing to show here.
  const sortedDays = useMemo(
    () =>
      [...days]
        .filter((day) => sessions.some((s) => s.day_id === day.id))
        .sort((a, b) => a.sort_order - b.sort_order),
    [days, sessions]
  );
  const activeRoundDayId = sessions.find((s) => s.id === activeSessionId)?.day_id ?? null;
  // Default to whichever day holds the active round, so opening the app lands on it directly.
  const currentDayId = activeDay ?? activeRoundDayId ?? sortedDays[0]?.id ?? null;

  if (loading) {
    return <div className="flex justify-center py-20 text-ink-light">Laster turneringsdata…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Kunne ikke laste data fra Supabase</p>
        <p className="mt-1 text-red-700/80">{error}</p>
        <p className="mt-2 text-red-700/60">
          Sjekk at .env.local har riktig NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, og at
          migrasjonene i supabase/migrations er kjørt.
        </p>
      </div>
    );
  }

  const daySessions = sessions
    .filter((s) => s.day_id === currentDayId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const currentDay = sortedDays.find((d) => d.id === currentDayId);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {sortedDays.map((day) => (
          <button
            key={day.id}
            onClick={() => setActiveDay(day.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              day.id === currentDayId
                ? "border-gold bg-gold/15 text-gold-deep"
                : "border-card-border bg-card text-ink-light hover:border-gold-deep/30 hover:text-ink"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {currentDay && (
        <p className="mb-4 text-xs uppercase tracking-wide text-ink-light/80">
          {currentDay.course ? `Bane: ${currentDay.course}` : "Bane ikke oppgitt"}
        </p>
      )}

      <div className="space-y-3">
        {daySessions.map((session, i) => {
          // Open the active round by default; if it's not on this day (or none is set), fall back to the first.
          const dayHasActiveSession = daySessions.some((s) => s.id === activeSessionId);
          const defaultOpen = dayHasActiveSession ? session.id === activeSessionId : i === 0;
          return (
            <SessionSection
              key={session.id}
              session={session}
              matches={matches
                .filter((m) => m.session_id === session.id)
                .sort((a, b) => a.sort_order - b.sort_order)}
              players={players}
              defaultOpen={defaultOpen}
            />
          );
        })}
      </div>
    </div>
  );
}
