"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { COMPETITIONS } from "@/lib/competitions";
import { getHoleInfo } from "@/lib/courseHoles";
import { computeCompetitionWins } from "@/lib/stats";
import { Player } from "@/lib/types";
import { ModalShell } from "./ModalShell";
import { PlayerAvatar } from "./PlayerAvatar";
import { PlayerDetailModal } from "./PlayerDetailModal";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function HoleBadges({
  holes,
  course,
  winners,
  players,
  onSelectPlayer,
}: {
  holes: number[];
  course: string;
  winners: Record<string, string>;
  players: Player[];
  onSelectPlayer: (playerId: string) => void;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
      {holes.map((h) => {
        const info = getHoleInfo(course, h);
        const winnerId = winners[h];
        const winner = winnerId ? players.find((p) => p.id === winnerId) : undefined;

        if (winner) {
          const onGray = winner.team_id === "gray";
          return (
            <button
              key={h}
              onClick={() => onSelectPlayer(winner.id)}
              className={`flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 text-left shadow-sm hover:brightness-110 ${
                onGray ? "bg-gray-team-deep" : "bg-aqua-team-deep"
              }`}
            >
              <PlayerAvatar
                playerId={winner.id}
                fallbackTeamId={winner.team_id}
                size={36}
                className="h-9 w-9"
                alwaysOn
              />
              <div className="text-left">
                <div className={`text-[9px] font-semibold uppercase tracking-wide ${onGray ? "text-ink/70" : "text-white/70"}`}>
                  Hull {h}
                  {info.par !== null && ` · par ${info.par}`}
                </div>
                <div className={`text-xs font-bold ${onGray ? "text-ink" : "text-white"}`}>{winner.name}</div>
              </div>
            </button>
          );
        }

        return (
          <span key={h} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm">
            Hull {h}
            {info.par !== null && <span className="ml-1 font-normal text-ink-light/60">par {info.par}</span>}
          </span>
        );
      })}
    </div>
  );
}

export function CompetitionsModal({ onClose }: { onClose: () => void }) {
  const { days, players } = useTournament();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  // A day with no course (e.g. a travel-only departure day) has no competitions to show.
  const sortedDays = [...days].filter((d) => d.course).sort((a, b) => a.sort_order - b.sort_order);
  const { perTeam, perPlayer } = computeCompetitionWins(days, players);
  const playersWithWins = perPlayer.filter((p) => p.wins > 0).sort((a, b) => b.wins - a.wins);

  return (
    <ModalShell title="Konkurranser" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-xs text-ink-light">
          Longest Drive (LD) og Closest to Pin (CTP) spilles på disse hullene hver dag.
        </p>

        {(perTeam.gray > 0 || perTeam.aqua > 0) && (
          <div className="rounded-2xl border border-card-border bg-white p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">Sammenlagt</h3>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-team-bg px-3 py-2 text-center">
                <div className="font-display text-lg font-bold text-ink">{fmt(perTeam.gray)}</div>
                <div className="text-[10px] uppercase tracking-wide text-ink/60">Gray vunnet</div>
              </div>
              <div className="rounded-xl bg-aqua-team-flat px-3 py-2 text-center">
                <div className="font-display text-lg font-bold text-white">{fmt(perTeam.aqua)}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/70">Aqua vunnet</div>
              </div>
            </div>
            <div className="space-y-1">
              {playersWithWins.map(({ player, wins }) => {
                const onGray = player.team_id === "gray";
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-xs hover:brightness-110 ${
                      onGray ? "bg-gray-team-bg" : "bg-aqua-team-flat"
                    }`}
                  >
                    <PlayerAvatar
                      playerId={player.id}
                      fallbackTeamId={player.team_id}
                      size={20}
                      className="h-5 w-5"
                      alwaysOn
                    />
                    <span className={`flex-1 font-semibold ${onGray ? "text-ink" : "text-white"}`}>
                      {player.name}
                    </span>
                    <span className={onGray ? "text-ink/60" : "text-white/70"}>{wins}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sortedDays.map((day) => {
          const comp = day.course ? COMPETITIONS[day.course] : undefined;

          return (
            <div key={day.id} className="rounded-2xl border border-card-border bg-white p-4">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">{day.label}</span>
                <span className="text-xs uppercase tracking-wide text-ink-light/60">{day.course}</span>
              </div>

              {comp ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-card-deep px-3 py-2.5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gold-deep">
                      Longest Drive
                    </div>
                    <HoleBadges
                      holes={comp.longestDrive}
                      course={day.course as string}
                      winners={day.competition_winners}
                      players={players}
                      onSelectPlayer={setSelectedPlayerId}
                    />
                  </div>
                  <div className="rounded-xl bg-card-deep px-3 py-2.5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gold-deep">
                      Closest to Pin
                    </div>
                    <HoleBadges
                      holes={comp.closestToPin}
                      course={day.course as string}
                      winners={day.competition_winners}
                      players={players}
                      onSelectPlayer={setSelectedPlayerId}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm italic text-ink-light/60">
                  Ingen konkurranser registrert for «{day.course}» ennå.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {selectedPlayerId && (
        <PlayerDetailModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
      )}
    </ModalShell>
  );
}
