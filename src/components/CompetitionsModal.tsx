"use client";

import { useTournament } from "@/context/TournamentContext";
import { COMPETITIONS } from "@/lib/competitions";
import { getHoleInfo } from "@/lib/courseHoles";
import { computeCompetitionWins } from "@/lib/stats";
import { Player } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function HoleBadges({
  holes,
  course,
  winners,
  players,
}: {
  holes: number[];
  course: string;
  winners: Record<string, string>;
  players: Player[];
}) {
  return (
    <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
      {holes.map((h) => {
        const info = getHoleInfo(course, h);
        const winnerId = winners[h];
        const winnerName = winnerId ? players.find((p) => p.id === winnerId)?.name : undefined;
        return (
          <span key={h} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm">
            Hull {h}
            {info.par !== null && <span className="ml-1 font-normal text-ink-light/60">par {info.par}</span>}
            {winnerName && <span className="ml-1 font-normal text-gold-deep">&middot; {winnerName}</span>}
          </span>
        );
      })}
    </div>
  );
}

export function CompetitionsModal({ onClose }: { onClose: () => void }) {
  const { days, players } = useTournament();
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
              {playersWithWins.map(({ player, wins }) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg bg-card-deep px-2.5 py-1 text-xs"
                >
                  <span className="font-semibold text-ink">{player.name}</span>
                  <span className="text-ink-light">{wins}</span>
                </div>
              ))}
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
    </ModalShell>
  );
}
