"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ScoreBar } from "@/components/ScoreBar";
import {
  hasLiveMatches,
  liveLeader,
  liveUpLabel,
  pointsToClinch,
  projectedPoints,
  totalPoints,
} from "@/lib/scoring";
import { computePlayerStats } from "@/lib/stats";
import { Day, Match, Player, RESULT_LABELS, Session, TeamId } from "@/lib/types";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function fmtVsPar(n: number | null) {
  if (n === null) return "–";
  if (n === 0) return "PAR";
  return n > 0 ? `+${n}` : `${n}`;
}

/** `YYYY-MM-DD` in the viewer's own local time, to match against `day.date`. */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sideNames(ids: (string | null)[], players: Player[], hideNames: boolean): string[] {
  if (hideNames) return [];
  return ids.filter((id): id is string => !!id).map((id) => players.find((p) => p.id === id)?.name ?? id);
}

function MatchLine({
  session,
  match,
  players,
  hideNames,
}: {
  session: Session;
  match: Match;
  players: Player[];
  hideNames: boolean;
}) {
  if (session.format === "scramble") {
    const team = match.flight_team as TeamId;
    const names = sideNames(match.flight_players, players, hideNames);
    const label = names.length > 0 ? names.join(" / ") : team === "gray" ? "Gray (Joys)" : "Aquarellos";
    const bg = team === "gray" ? "bg-gray-team-bg" : "bg-aqua-team-flat";
    const text = team === "gray" ? "text-ink" : "text-white";

    return (
      <div className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-3 ${bg}`}>
        <span className={`truncate text-lg font-bold uppercase tracking-wide ${text}`}>{label}</span>
        <span className={`shrink-0 font-display text-2xl font-bold ${text}`}>
          {match.score_vs_par !== null ? fmtVsPar(match.score_vs_par) : (match.start_time ?? "--:--")}
        </span>
      </div>
    );
  }

  const grayNames = sideNames([match.gray_player1, match.gray_player2], players, hideNames);
  const aquaNames = sideNames([match.aqua_player1, match.aqua_player2], players, hideNames);
  const isLive = match.result === "not_played" && (match.live_up !== 0 || match.live_thru !== null);
  const liveTeam = isLive ? liveLeader(match.live_up) : null;
  const leadingSide: TeamId | null =
    match.result === "gray_won" ? "gray" : match.result === "aqua_won" ? "aqua" : isLive ? liveTeam : null;

  function bg(team: TeamId) {
    const flat = team === "gray" ? "bg-gray-team-bg" : "bg-aqua-team-flat";
    const bold = team === "gray" ? "bg-gray-team-won" : "bg-aqua-team-won";
    if (leadingSide === null) return flat;
    return leadingSide === team ? bold : "bg-navy-light";
  }

  function text(team: TeamId) {
    if (leadingSide !== null && leadingSide !== team) return "text-foreground/30";
    return team === "aqua" ? "text-white" : "text-ink";
  }

  const centerText =
    match.result !== "not_played"
      ? RESULT_LABELS[match.result]
      : isLive
        ? `${liveTeam === "gray" ? "GRAY " : liveTeam === "aqua" ? "AQUA " : ""}${liveUpLabel(match.live_up)}`
        : (match.start_time ?? "--:--");

  return (
    <div className="flex items-stretch overflow-hidden rounded-2xl">
      <div className={`flex min-w-0 flex-1 items-center px-5 py-3 ${bg("gray")}`}>
        <span className={`truncate text-lg font-bold uppercase tracking-wide ${text("gray")}`}>
          {grayNames.length > 0 ? grayNames.join(" / ") : "Gray (Joys)"}
        </span>
      </div>
      <div className="flex w-36 shrink-0 items-center justify-center bg-navy-deep px-2 py-3 text-center">
        <span className="font-display text-base font-bold leading-tight text-gold">{centerText}</span>
      </div>
      <div className={`flex min-w-0 flex-1 items-center justify-end px-5 py-3 text-right ${bg("aqua")}`}>
        <span className={`truncate text-lg font-bold uppercase tracking-wide ${text("aqua")}`}>
          {aquaNames.length > 0 ? aquaNames.join(" / ") : "Aquarellos"}
        </span>
      </div>
    </div>
  );
}

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
  const items = daySessions.flatMap((session) =>
    matches
      .filter((m) => m.session_id === session.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((match) => ({ session, match }))
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-navy-lighter/60 bg-navy-light/40 p-5">
      <div className="mb-3 flex shrink-0 items-baseline justify-between gap-2">
        <h2 className="text-base font-bold uppercase tracking-[0.2em] text-gold">
          {title}
          {day && <span className="ml-2 font-normal normal-case text-foreground/50">{day.label}</span>}
        </h2>
        {day?.course && (
          <span className="text-xs uppercase tracking-wide text-foreground/40">{day.course}</span>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {!day ? (
          <p className="text-foreground/40">Ingen runde.</p>
        ) : items.length === 0 ? (
          <p className="text-foreground/40">Ingen kamper registrert.</p>
        ) : (
          items.map(({ session, match }) => (
            <MatchLine key={match.id} session={session} match={match} players={players} hideNames={day.hide_names} />
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
      <div className="fixed inset-0 flex items-center justify-center bg-navy-deep text-foreground/60">
        Laster turneringsdata…
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy-deep p-10 text-center text-red-300">
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
    <div className="fixed inset-0 flex overflow-hidden bg-navy-deep text-foreground">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-6">
        <header className="shrink-0 text-center">
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
        </header>

        <section className="shrink-0 rounded-3xl border border-navy-lighter/60 bg-navy-light/40 p-6">
          <h2 className="mb-3 text-center text-xs font-bold uppercase tracking-[0.3em] text-foreground/50">
            Stilling totalt
          </h2>
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex items-center justify-end gap-4">
              <div className="text-right">
                <div className="text-base font-semibold uppercase tracking-wider text-gray-team-light">
                  Gray (Joys)
                </div>
                <div className="font-display text-6xl font-bold text-gray-team-light drop-shadow">{fmt(gray)}</div>
              </div>
              <Image
                src="/logos/gray.png"
                alt=""
                width={64}
                height={64}
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
            </div>
            <div className="text-center text-3xl font-bold text-foreground/30">–</div>
            <div className="flex items-center gap-4">
              <Image
                src="/logos/aquarellos.png"
                alt=""
                width={64}
                height={64}
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
              <div>
                <div className="text-base font-semibold uppercase tracking-wider text-aqua-team-light">
                  Aquarellos
                </div>
                <div className="font-display text-6xl font-bold text-aqua-team-light drop-shadow">{fmt(aqua)}</div>
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
            className="mt-4 w-full"
          />
        </section>

        <div className="flex min-h-0 flex-1 gap-4">
          <DayColumn title="I dag" day={todayDay} sessions={sessions} matches={matches} players={players} />
          <DayColumn title="I morgen" day={tomorrowDay} sessions={sessions} matches={matches} players={players} />
        </div>
      </div>

      <aside className="flex w-80 shrink-0 flex-col border-l border-navy-lighter/60 bg-navy-light/60 p-3">
        <h2 className="mb-2 shrink-0 text-center text-sm font-bold uppercase tracking-[0.3em] text-gold">MVP</h2>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {rankedPlayers.map(({ player, stat }, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 rounded-lg border-l-4 bg-navy-deep/60 px-2 py-0.5 ${
                player.team_id === "gray" ? "border-l-gray-team" : "border-l-aqua-team"
              }`}
            >
              <span className="w-5 shrink-0 text-xs font-bold text-foreground/40">{i + 1}</span>
              <PlayerAvatar playerId={player.id} fallbackTeamId={player.team_id} size={24} className="h-6 w-6" alwaysOn />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {player.name}
                {player.is_captain && <span className="text-gold-deep"> (C)</span>}
              </span>
              <span className={`shrink-0 text-base font-bold ${stat.projectedExtra > 0 ? "italic text-red-400" : "text-gold"}`}>
                {stat.projectedExtra > 0 && "≈"}
                {fmt(stat.pointsContributed + stat.projectedExtra)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 shrink-0 text-center text-[11px] text-foreground/30">
          Oppdatert {clock.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </aside>
    </div>
  );
}
