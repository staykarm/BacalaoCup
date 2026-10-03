"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { usePlayerModal } from "@/context/PlayerModalContext";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { ScoreBar } from "@/components/ScoreBar";
import { SessionSection } from "@/components/SessionSection";
import { hasLiveMatches, pointsToClinch, projectedPoints, totalPoints } from "@/lib/scoring";
import { computePlayerStats, rankByValue } from "@/lib/stats";
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
  const { players, days, sessions, matches, loading, error, tvOverrideDayId, tvOverrideDayId2 } = useTournament();
  const { playerId, closePlayerModal } = usePlayerModal();

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

  // Admin overrides pin each column to a specific day independently (e.g. to test the layout
  // before play starts, or to show yesterday's results alongside today's matches during the
  // morning before play resumes) — otherwise both columns follow whatever date the screen
  // itself thinks it is.
  let todayDay: Day | undefined;
  let tomorrowDay: Day | undefined;
  const isManualDaySelection = !!tvOverrideDayId || !!tvOverrideDayId2;
  if (isManualDaySelection) {
    const playableDaysSorted = [...days]
      .filter((d) => sessions.some((s) => s.day_id === d.id))
      .sort((a, b) => a.sort_order - b.sort_order);
    todayDay = tvOverrideDayId ? playableDaysSorted.find((d) => d.id === tvOverrideDayId) : undefined;
    if (tvOverrideDayId2) {
      tomorrowDay = playableDaysSorted.find((d) => d.id === tvOverrideDayId2);
    } else if (todayDay) {
      // Right column left on "Automatisk" falls back to the day after the left column's
      // pin, matching the old single-override behavior.
      const idx = playableDaysSorted.findIndex((d) => d.id === todayDay!.id);
      tomorrowDay = playableDaysSorted[idx + 1];
    }
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
  // How much each team would still need if every live lead held — shown alongside the
  // secure figure above, never in place of it (a live lead can still flip).
  const clinchProjected = pointsToClinch(gray, aqua, possible);

  const playerStats = computePlayerStats(matches, players);
  const rankedPlayers = players
    .map((p) => ({ player: p, stat: playerStats.find((s) => s.player.id === p.id)! }))
    .sort(
      (a, b) =>
        b.stat.pointsContributed + b.stat.projectedExtra - (a.stat.pointsContributed + a.stat.projectedExtra)
    );
  const mvpRanks = rankByValue(rankedPlayers, (r) => r.stat.pointsContributed + r.stat.projectedExtra);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-ink">
      {/* Same dark header treatment as the main app's sticky ScoreHeader, so the TV
          scoreboard reads as the same product — light content below a navy top bar. */}
      <header className="shrink-0 border-b border-navy-lighter/60 bg-navy-light px-6 py-3 text-center text-foreground">
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
          <div className="flex items-center justify-end gap-4 rounded-2xl bg-gray-team-light px-5 py-1.5">
            <div className="flex items-center gap-2">
              <Image
                src="/logos/gray.png"
                alt=""
                width={48}
                height={48}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
              <span className="text-sm font-semibold uppercase tracking-wider text-ink">
                Gray (Joys)
              </span>
            </div>
            {/* Projected total sits inline, right after the secure number, so the row's own
                height never depends on whether there's a live match adding to it. */}
            <div className="whitespace-nowrap text-right font-display text-6xl font-bold text-ink">
              {fmt(settled.gray)}
              {grayLive > 0 && <span className="ml-1 text-3xl text-ink/60">({fmt(gray)})</span>}
            </div>
          </div>
          <div className="text-center text-2xl font-bold text-foreground/30">–</div>
          <div className="flex items-center gap-4 rounded-2xl bg-aqua-team px-5 py-1.5">
            <div className="whitespace-nowrap text-left font-display text-6xl font-bold text-white">
              {fmt(settled.aqua)}
              {aquaLive > 0 && <span className="ml-1 text-3xl text-white/70">({fmt(aqua)})</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-white">
                Aquarellos
              </span>
              <Image
                src="/logos/aquarellos.png"
                alt=""
                width={48}
                height={48}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
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
          clinchGrayProjected={winner ? null : clinchProjected.gray}
          clinchAquaProjected={winner ? null : clinchProjected.aqua}
          className="mt-2 w-full"
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 gap-4 p-4">
          <DayColumn
            title={isManualDaySelection ? "Dag 1" : "I dag"}
            day={todayDay}
            sessions={sessions}
            matches={matches}
            players={players}
          />
          <DayColumn
            title={isManualDaySelection ? "Dag 2" : "I morgen"}
            day={tomorrowDay}
            sessions={sessions}
            matches={matches}
            players={players}
          />
        </div>

        <aside className="flex w-80 shrink-0 flex-col border-l border-card-border bg-card p-3">
          <h2 className="mb-2 shrink-0 text-center text-sm font-bold uppercase tracking-[0.3em] text-gold-deep">
            MVP
          </h2>
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-1 overflow-y-auto">
            {rankedPlayers.map(({ player, stat }, i) => {
              const isGray = player.team_id === "gray";
              const borderClass = isGray ? "border-l-gray-team-deep" : "border-l-aqua-team";
              const tintClass = isGray ? "bg-gray-team-bg/25" : "bg-aqua-team-bg/35";
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2.5 rounded-lg border-l-4 px-2.5 py-2 ${borderClass} ${tintClass}`}
                >
                  <span className="w-6 shrink-0 text-sm font-bold text-ink-light/50">{mvpRanks[i]}</span>
                  <PlayerAvatar playerId={player.id} fallbackTeamId={player.team_id} size={32} className="h-8 w-8" alwaysOn />
                  <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">
                    {player.name}
                    {player.is_captain && <span className="text-gold-deep"> (C)</span>}
                  </span>
                  {/* A dark pill (same treatment as a match's points badge) keeps the number
                      readable regardless of how saturated the row's own team tint is. */}
                  <span
                    className={`shrink-0 rounded-full bg-navy-deep px-2.5 py-1 text-sm font-extrabold tabular-nums ${
                      stat.projectedExtra > 0 ? "italic text-gold/70" : "text-gold"
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

      {playerId && <PlayerDetailModal playerId={playerId} onClose={closePlayerModal} />}
    </div>
  );
}
