"use client";

import { useMemo, useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { useWeather } from "@/hooks/useWeather";
import { SessionSection } from "@/components/SessionSection";

export default function Home() {
  const { days, sessions, matches, players, loading, error, activeSessionIds } = useTournament();
  const { data: weather } = useWeather();
  const [activeDay, setActiveDay] = useState<string | null>(null);

  // Only days with golf on them belong on the main page — a travel-only day (e.g. Sunday) has nothing to show here.
  const sortedDays = useMemo(
    () =>
      [...days]
        .filter((day) => sessions.some((s) => s.day_id === day.id))
        .sort((a, b) => a.sort_order - b.sort_order),
    [days, sessions]
  );
  const activeRoundDayId = sessions.find((s) => activeSessionIds.includes(s.id))?.day_id ?? null;
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
  const dayYrForecast = weather?.yr?.find((f) => f.date === currentDay?.date) ?? null;

  return (
    <div>
      <div className="mb-4 flex gap-1.5 sm:gap-2">
        {sortedDays.map((day) => (
          <button
            key={day.id}
            onClick={() => setActiveDay(day.id)}
            className={`min-w-0 flex-1 truncate rounded-full border px-1 py-2 text-center text-xs font-semibold transition sm:flex-initial sm:px-4 sm:text-sm ${
              day.id === currentDayId
                ? "border-gold bg-gold/15 text-gold-deep"
                : "border-card-border bg-card text-ink-light hover:border-gold-deep/30 hover:text-ink"
            }`}
          >
            {/* Just the weekday — the date suffix ("Onsdag 07.10") is dropped here so all
                days fit on one line without scrolling on a narrow phone screen. */}
            {day.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {currentDay && (
        <p className="mb-4 text-xs uppercase tracking-wide text-ink-light/80">
          {currentDay.course ? `Bane: ${currentDay.course}` : "Bane ikke oppgitt"}
        </p>
      )}

      <div className="space-y-3">
        {daySessions.map((session) => (
          <SessionSection
            key={session.id}
            session={session}
            matches={matches
              .filter((m) => m.session_id === session.id)
              .sort((a, b) => a.sort_order - b.sort_order)}
            players={players}
            defaultOpen
            hideNames={currentDay?.hide_names ?? false}
            yrForecast={dayYrForecast}
          />
        ))}
      </div>
    </div>
  );
}
