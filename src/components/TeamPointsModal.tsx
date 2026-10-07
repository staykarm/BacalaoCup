"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { usePlayerModal } from "@/context/PlayerModalContext";
import { totalPoints } from "@/lib/scoring";
import { computeCompetitionWins, computePlayerStats } from "@/lib/stats";
import { TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function TeamPointsModal({ team, onClose }: { team: TeamId; onClose: () => void }) {
  const { matches, players, matchHoles, sessions, days } = useTournament();
  const { gray, aqua } = totalPoints(matches, sessions);
  const teamTotal = team === "gray" ? gray : aqua;
  const teamName = team === "gray" ? "Gray (Joys)" : "Aquarellos";

  const stats = computePlayerStats(matches, matchHoles, players)
    .filter((s) => s.player.team_id === team)
    .sort((a, b) => b.pointsContributed + b.projectedExtra - (a.pointsContributed + a.projectedExtra));

  const competitionWins = computeCompetitionWins(days, players);
  const winsById = new Map(competitionWins.perPlayer.map((p) => [p.player.id, p.wins]));
  const teamCompetitionWins = competitionWins.perTeam[team];

  const bannerClass = team === "gray" ? "bg-gray-team-deep" : "bg-aqua-team-deep";
  // The gray fill is light, so its banner needs dark ink text; the list rows sit on
  // the app's regular dark chrome regardless of team, so that accent stays light.
  const bannerText = team === "gray" ? "text-ink" : "text-white";
  const bannerSubtext = team === "gray" ? "text-ink/60" : "text-white/70";
  const listAccentText = team === "gray" ? "text-ink" : "text-aqua-team-deep";
  const { openPlayer } = usePlayerModal();

  return (
    <ModalShell title={teamName} onClose={onClose}>
      <div className="space-y-5">
        <div className={`flex flex-col items-center gap-2 rounded-2xl p-5 text-center ${bannerClass}`}>
          <Image
            src={team === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className={`font-display text-4xl font-bold ${bannerText}`}>{fmt(teamTotal)}</div>
          <div className={`text-xs font-semibold uppercase tracking-wide ${bannerSubtext}`}>poeng tatt</div>
          {teamCompetitionWins > 0 && (
            <div className={`text-[11px] font-semibold ${bannerSubtext}`}>
              🏆 {teamCompetitionWins} konkurranse{teamCompetitionWins === 1 ? "" : "r"} vunnet
            </div>
          )}
        </div>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">
            Poeng per spiller
          </h3>
          <div className="space-y-2">
            {stats.map((s, i) => (
              <button
                key={s.player.id}
                onClick={() => openPlayer(s.player.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-card-border bg-white px-3 py-2.5 text-left text-sm hover:border-gold-deep/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-xs font-bold text-ink-light/60">{i + 1}</span>
                  <span className="truncate font-semibold text-ink">{s.player.name}</span>
                  {(winsById.get(s.player.id) ?? 0) > 0 && (
                    <span className="shrink-0 text-xs text-gold-deep">🏆 {winsById.get(s.player.id)}</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-light">
                    {s.wins}-{s.halved}-{s.losses}
                  </span>
                  <span className={`font-bold ${listAccentText}`}>
                    {fmt(s.pointsContributed + s.projectedExtra)} p
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
