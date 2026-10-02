"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ScoreBar } from "@/components/ScoreBar";
import { SessionSection } from "@/components/SessionSection";
import { hasLiveMatches, pointsToClinch, projectedPoints, totalPoints } from "@/lib/scoring";
import { computePlayerStats } from "@/lib/stats";
import { Day, Match, Player, Session, TeamId } from "@/lib/types";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** `YYYY-MM-DD` in the viewer's own local time, to match against `day.date`. */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Reuses the exact same SessionSection/MatchRow/ScrambleFlights components the main
// page uses — same team logos, player photos, format labels and result colors, kept
// in sync automatically rather than as a second, hand-copied design to maintain.
function DayColumn({
  title,
  day,
  sessions,
  matches,
  players,
}: {
  title: string;
  day: Day | undefined;
  sessions: Session[];
  matches: Match[];
  players: Player[];
}) {
  const daySessions = day
    ? sessions.filter((s) => s.day_id === day.id).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-card-border bg-card p-4">
      <div className="mb-2 flex shrink-0 items-baseline justify-between gap-2">
        <h2 className="text-base font-bold uppercase tracking-[0.2em] text-gold-deep">
          {title}
          {day && <span className="ml-2 font-normal normal-case text-ink-light">{day.label}</span>}
        </h2>
        {day?.course && (
          <span className="text-xs uppercase tracking-wide text-ink-light/70">{day.course}</span>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {!day ? (
          <p className="text-ink-light/60">Ingen runde.</p>
        ) : daySessions.length === 0 ? (
          <p className="text-ink-light/60">Ingen kamper registrert.</p>
        ) : (
          daySessions.map((session) => (
            <SessionSection
              key={session.id}
              session={session}
              matches={matches
                .filter((m) => m.session_id === session.id)
                .sort((a, b) => a.sort_order - b.sort_order)}
              players={players}
              defaultOpen
              hideNames={day.hide_names}
            />
          ))
        )}
      </div>
    </div>
  );
}

// How often the unattended TV screen reloads itself, so a frozen tab or a dropped
// connection doesn't sit stale for the rest of the day with nobody there to refresh it.
const AUTO_RELOAD_MS = 2 * 60 * 60 * 1000;

export default function TvScoreboardPage() {
  const { players, days, sessions, matches, loading, error, tvOverrideDayId } = useTournament();

  // Ticks every second purely so a frozen screen is visible at a glance — if the clock
  // stops moving, the page has stopped updating.
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => window.location.reload(), AUTO_RELOAD_MS);
    return () => clearTimeout(id);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-ink-light">
        Laster turneringsdata…
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-10 text-center text-red-700">
        Kunne ikke laste data fra Supabase: {error}
      </div>
    );
  }

  // Admin override pins the scoreboard to a specific day (e.g. to test the layout before
  // play starts, or to hold a day on screen past midnight) — otherwise it follows whatever
  // date the screen itself thinks it is.
  let todayDay: Day | undefined;
  let tomorrowDay: Day | undefined;
  if (tvOverrideDayId) {
    const playableDaysSorted = [...days]
      .filter((d) => sessions.some((s) => s.day_id === d.id))
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = playableDaysSorted.findIndex((d) => d.id === tvOverrideDayId);
    todayDay = idx >= 0 ? playableDaysSorted[idx] : undefined;
    tomorrowDay = idx >= 0 ? playableDaysSorted[idx + 1] : undefined;
  } else {
    const now = new Date();
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    todayDay = days.find((d) => d.date === toDateKey(now));
    tomorrowDay = days.find((d) => d.date === toDateKey(tomorrowDate));
  }

  const { gray, aqua, possible } = projectedPoints(matches, sessions);
  const settled = totalPoints(matches, sessions);
  const grayLive = Math.max(0, gray - settled.gray);
  const aquaLive = Math.max(0, aqua - settled.aqua);
  const isLive = hasLiveMatches(matches);
  const clinch = pointsToClinch(settled.gray, settled.aqua, settled.possible);
  const winner: TeamId | null = clinch.gray === 0 ? "gray" : clinch.aqua === 0 ? "aqua" : null;

  const playerStats = computePlayerStats(matches, players);
  const rankedPlayers = players
    .map((p) => ({ player: p, stat: playerStats.find((s) => s.player.id === p.id)! }))
    .sort(
      (a, b) =>
        b.stat.pointsContributed + b.stat.projectedExtra - (a.stat.pointsContributed + a.stat.projectedExtra)
    );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-ink">
      {/* Same dark header treatment as the main app's sticky ScoreHeader, so the TV
          scoreboard reads as the same product — light content below a navy top bar. */}
      <header className="shrink-0 border-b border-navy-lighter/60 bg-navy-deep px-6 py-3 text-center text-foreground">
        <div className="flex items-center justify-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-red-500" : "bg-gold"}`} />
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">
            Bacalao Cup MMXXVI &middot; Marbella
            {isLive && <span className="ml-2 text-red-400">&middot; LIVE</span>}
          </p>
          <span className={`h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-red-500" : "bg-gold"}`} />
        </div>
        {winner && (
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide">
            <span className={winner === "gray" ? "text-gray-team-light" : "text-aqua-team-light"}>
              🏆 {winner === "gray" ? "Gray (Joys)" : "Aquarellos"} har vunnet cupen!
            </span>
          </p>
        )}

        <div className="mt-2 grid grid-cols-3 items-center gap-4">
          <div className="flex items-center justify-end gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold uppercase tracking-wider text-gray-team-light">
                Gray (Joys)
              </div>
              <div className="font-display text-5xl font-bold text-gray-team-light drop-shadow">{fmt(gray)}</div>
            </div>
            <Image
              src="/logos/gray.png"
              alt=""
              width={64}
              height={64}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          </div>
          <div className="text-center text-2xl font-bold text-foreground/30">–</div>
          <div className="flex items-center gap-3">
            <Image
              src="/logos/aquarellos.png"
              alt=""
              width={64}
              height={64}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-aqua-team-light">
                Aquarellos
              </div>
              <div className="font-display text-5xl font-bold text-aqua-team-light drop-shadow">{fmt(aqua)}</div>
            </div>
          </div>
        </div>
        <ScoreBar
          graySettled={settled.gray}
          grayLive={grayLive}
          aquaSettled={settled.aqua}
          aquaLive={aquaLive}
          possible={possible}
          clinchGray={winner ? null : clinch.gray}
          clinchAqua={winner ? null : clinch.aqua}
          className="mt-2 w-full"
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 gap-4 p-4">
          <DayColumn title="I dag" day={todayDay} sessions={sessions} matches={matches} players={players} />
          <DayColumn title="I morgen" day={tomorrowDay} sessions={sessions} matches={matches} players={players} />
        </div>

        <aside className="flex w-80 shrink-0 flex-col border-l border-card-border bg-card p-3">
          <h2 className="mb-2 shrink-0 text-center text-sm font-bold uppercase tracking-[0.3em] text-gold-deep">
            MVP
          </h2>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            {rankedPlayers.map(({ player, stat }, i) => {
              const isGray = player.team_id === "gray";
              const borderClass = isGray ? "border-l-gray-team-deep" : "border-l-aqua-team";
              const tintClass = isGray ? "bg-gray-team-bg/25" : "bg-aqua-team-bg/10";
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 rounded-lg border-l-4 px-2 py-0.5 ${borderClass} ${tintClass}`}
                >
                  <span className="w-5 shrink-0 text-xs font-bold text-ink-light/50">{i + 1}</span>
                  <PlayerAvatar playerId={player.id} fallbackTeamId={player.team_id} size={24} className="h-6 w-6" alwaysOn />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {player.name}
                    {player.is_captain && <span className="text-gold-deep"> (C)</span>}
                  </span>
                  <span
                    className={`w-12 shrink-0 text-right text-base font-bold tabular-nums ${
                      stat.projectedExtra > 0 ? "italic text-ink-light" : "text-ink"
                    }`}
                  >
                    {stat.projectedExtra > 0 && "≈"}
                    {(stat.pointsContributed + stat.projectedExtra).toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 shrink-0 text-center text-[11px] text-ink-light/50">
            Oppdatert {clock.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </aside>
      </div>
    </div>
  );
}
