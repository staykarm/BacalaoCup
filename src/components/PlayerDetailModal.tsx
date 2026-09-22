"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { RESULT_LABELS, TeamId } from "@/lib/types";
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

  const playedMatches = matches
    .filter(
      (m) =>
        m.gray_player1 === playerId ||
        m.gray_player2 === playerId ||
        m.aqua_player1 === playerId ||
        m.aqua_player2 === playerId
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

  return (
    <ModalShell title={player.name} onClose={onClose}>
      <div className="space-y-5">
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 ${
            side === "gray"
              ? "bg-gradient-to-br from-gray-team-bg to-gray-team-deep"
              : "bg-gradient-to-br from-aqua-team-bg to-aqua-team-deep"
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
                side === "gray" ? "text-gray-team-light" : "text-aqua-team-light"
              }`}
            >
              {side === "gray" ? "Gray (Joys)" : "Aquarellos"}
              {player.hcp !== null && <span className="ml-2 text-white/50">HCP {fmt(player.hcp)}</span>}
            </div>
            <div className="mt-0.5 text-sm font-bold text-white">
              {wins}V {halved}D {losses}T &middot; {fmt(pointsContributed)} p denne turneringen
            </div>
          </div>
        </div>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground/50">Kamper</h3>
          {playedMatches.length === 0 ? (
            <p className="text-sm italic text-foreground/40">Ingen kamper satt opp ennå.</p>
          ) : (
            <div className="space-y-2">
              {playedMatches.map((m) => {
                const session = sessionOf(m.session_id);
                const day = dayOf(m.session_id);
                const opponents = (side === "gray" ? [m.aqua_player1, m.aqua_player2] : [m.gray_player1, m.gray_player2])
                  .map(nameOf)
                  .filter((n): n is string => !!n)
                  .join(" / ");
                const myPoints = side === "gray" ? m.points_gray : m.points_aqua;
                const accent =
                  m.result === myResult
                    ? side === "gray"
                      ? "border-l-gray-team"
                      : "border-l-aqua-team"
                    : m.result === "halved"
                      ? "border-l-gold"
                      : m.result === "not_played"
                        ? "border-l-navy-lighter"
                        : "border-l-transparent";

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border-l-4 bg-navy-light/50 px-3 py-2.5 text-xs ${accent}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground/80">
                        {day?.label} &middot; {session?.name}
                      </div>
                      <div className="truncate text-foreground/40">vs {opponents || "?"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-foreground/80">{RESULT_LABELS[m.result]}</div>
                      {m.result !== "not_played" && <div className="text-gold">{fmt(myPoints)} p</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {history.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground/50">
              Historikk
            </h3>
            <div className="space-y-1">
              {history.map((h) => (
                <div
                  key={h.year}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-navy-light/30 px-3 py-1.5 text-xs text-foreground/60"
                >
                  <span className="font-semibold text-foreground/80">{h.year}</span>
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
