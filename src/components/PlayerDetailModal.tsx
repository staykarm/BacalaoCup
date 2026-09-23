"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { shortCourseLabel } from "@/lib/courseHoles";
import { liveLeader } from "@/lib/scoring";
import { computeCompetitionWins, computePlayerStats } from "@/lib/stats";
import { Match, RESULT_LABELS, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function PlayerDetailModal({ playerId, onClose }: { playerId: string; onClose: () => void }) {
  const { players, matches, sessions, days, playerYearStats } = useTournament();
  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const nameOf = (id: string | null) => (id ? players.find((p) => p.id === id)?.name ?? id : null);
  const sessionOf = (id: string) => sessions.find((s) => s.id === id);
  const dayOf = (sessionId: string) => {
    const session = sessionOf(sessionId);
    return session ? days.find((d) => d.id === session.day_id) : undefined;
  };

  // A day the admin has hidden names for is hiding the pairings themselves, not just who's
  // in them — so a hidden day's matches are left out of the player's own list entirely,
  // same as they never appeared on the main schedule.
  const playedMatches = matches
    .filter(
      (m) =>
        (m.gray_player1 === playerId ||
          m.gray_player2 === playerId ||
          m.aqua_player1 === playerId ||
          m.aqua_player2 === playerId) &&
        !dayOf(m.session_id)?.hide_names
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const side: TeamId = player.team_id;
  const myResult = side === "gray" ? "gray_won" : "aqua_won";
  const wins = playedMatches.filter((m) => m.result === myResult).length;
  const losses = playedMatches.filter(
    (m) => m.result !== "not_played" && m.result !== "halved" && m.result !== myResult
  ).length;
  const halved = playedMatches.filter((m) => m.result === "halved").length;
  const pointsContributed = playedMatches.reduce(
    (sum, m) => sum + (side === "gray" ? m.points_gray : m.points_aqua),
    0
  );

  const history = playerYearStats.filter((h) => h.player_id === playerId).sort((a, b) => b.year - a.year);

  const isLive = (m: Match) => m.result === "not_played" && (m.live_up !== 0 || m.live_thru !== null);
  const relevantMatches = playedMatches.filter((m) => m.result !== "not_played" || isLive(m));
  const upcomingMatches = playedMatches.filter((m) => m.result === "not_played" && !isLive(m));

  // If a live match holds its current lead, this is what the player's side would score.
  function liveProjectedPoints(m: Match): number {
    const leader = liveLeader(m.live_up);
    if (leader === side) return m.points;
    if (leader === null) return m.points / 2;
    return 0;
  }

  const liveMatches = relevantMatches.filter(isLive);
  const projectedExtra = liveMatches.reduce((sum, m) => sum + liveProjectedPoints(m), 0);
  const projectedTotal = pointsContributed + projectedExtra;

  const rankedPlayers = computePlayerStats(matches, players);
  const overallRank = rankedPlayers.findIndex((s) => s.player.id === playerId) + 1;
  const teamRank = rankedPlayers.filter((s) => s.player.team_id === side).findIndex((s) => s.player.id === playerId) + 1;

  const competitionWins = computeCompetitionWins(days, players).perPlayer.find(
    (p) => p.player.id === playerId
  )?.wins ?? 0;

  const courses = [...days]
    .filter((d) => d.course)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => d.course as string)
    .filter((c, i, arr) => arr.indexOf(c) === i);

  return (
    <ModalShell title={player.is_captain ? `${player.name} (C)` : player.name} onClose={onClose}>
      <div className="space-y-5">
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 ${
            side === "gray" ? "bg-gray-team-deep" : "bg-aqua-team-deep"
          }`}
        >
          <Image
            src={side === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div
              className={`text-[11px] font-bold uppercase tracking-wide ${
                side === "gray" ? "text-ink" : "text-aqua-team-light"
              }`}
            >
              {side === "gray" ? "Gray (Joys)" : "Aquarellos"}
              {player.hcp !== null && (
                <span className={`ml-2 ${side === "gray" ? "text-ink/60" : "text-white/50"}`}>
                  HCP {fmt(player.hcp)}
                </span>
              )}
            </div>
            <div className={`mt-1 text-lg font-bold ${side === "gray" ? "text-ink" : "text-white"}`}>
              {wins}-{halved}-{losses}
            </div>
            <div className={`mt-0.5 text-[11px] font-semibold ${side === "gray" ? "text-ink/60" : "text-white/60"}`}>
              #{overallRank} på MVP totalt &middot; #{teamRank} i laget
              {competitionWins > 0 && <> &middot; 🏆 {competitionWins}</>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={`font-display text-4xl font-bold ${side === "gray" ? "text-ink" : "text-white"}`}>
              {projectedExtra > 0 && "≈"}
              {fmt(projectedTotal)}
            </div>
            <div className={`text-[11px] font-semibold uppercase tracking-wide ${side === "gray" ? "text-ink/60" : "text-white/60"}`}>
              poeng
            </div>
          </div>
        </div>

        {courses.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">
              Mottatte slag
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {courses.map((c) => (
                <div key={c} className="rounded-xl bg-card-deep px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-ink-light/60">
                    {shortCourseLabel(c)}
                  </div>
                  <div className="font-display text-lg font-bold text-ink">
                    {player.course_strokes[c] ?? "–"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">Kamper</h3>
          {relevantMatches.length === 0 ? (
            <p className="text-sm italic text-ink-light/60">Ingen kamper spilt ennå.</p>
          ) : (
            <div className="space-y-2">
              {relevantMatches.map((m) => {
                const session = sessionOf(m.session_id);
                const day = dayOf(m.session_id);
                const opponents = (side === "gray" ? [m.aqua_player1, m.aqua_player2] : [m.gray_player1, m.gray_player2])
                  .map(nameOf)
                  .filter((n): n is string => !!n)
                  .join(" / ");
                const live = isLive(m);
                const liveLeaderTeam = live ? liveLeader(m.live_up) : null;
                const myPoints = side === "gray" ? m.points_gray : m.points_aqua;
                const accent =
                  m.result === myResult || (live && liveLeaderTeam === side)
                    ? side === "gray"
                      ? "border-l-gray-team"
                      : "border-l-aqua-team"
                    : m.result === "halved" || (live && liveLeaderTeam === null)
                      ? "border-l-gold"
                      : "border-l-transparent";

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border-l-4 bg-white px-3 py-2.5 text-xs ${accent}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink">
                        {day?.label} &middot; {session?.name}
                      </div>
                      <div className="truncate text-ink-light/60">vs {opponents || "?"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-ink">{live ? "Pågår" : RESULT_LABELS[m.result]}</div>
                      <div className="text-gold-deep">
                        {live && "≈"}
                        {fmt(live ? liveProjectedPoints(m) : myPoints)} p
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {upcomingMatches.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">
              Kommende kamper
            </h3>
            <div className="space-y-2">
              {upcomingMatches.map((m) => {
                const session = sessionOf(m.session_id);
                const day = dayOf(m.session_id);
                const opponents = (side === "gray" ? [m.aqua_player1, m.aqua_player2] : [m.gray_player1, m.gray_player2])
                  .map(nameOf)
                  .filter((n): n is string => !!n)
                  .join(" / ");

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border-l-4 border-l-transparent bg-white px-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink">
                        {day?.label} &middot; {session?.name}
                      </div>
                      <div className="truncate text-ink-light/60">vs {opponents || "?"}</div>
                    </div>
                    <div className="shrink-0 text-right text-ink-light">{m.start_time ?? "--:--"}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">
              Historikk
            </h3>
            <div className="space-y-1">
              {history.map((h) => (
                <div
                  key={h.year}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-card-deep px-3 py-1.5 text-xs text-ink-light"
                >
                  <span className="font-semibold text-ink">{h.year}</span>
                  {h.record && <span>{h.record}</span>}
                  <span>
                    {h.individual_points !== null && `${fmt(h.individual_points)} ind.`}
                    {h.individual_points !== null && h.total_points !== null && " · "}
                    {h.total_points !== null && `${fmt(h.total_points)} p`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ModalShell>
  );
}
