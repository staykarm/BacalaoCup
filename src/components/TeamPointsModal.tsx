"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { totalPoints } from "@/lib/scoring";
import { computePlayerStats } from "@/lib/stats";
import { TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function TeamPointsModal({ team, onClose }: { team: TeamId; onClose: () => void }) {
  const { matches, players } = useTournament();
  const { gray, aqua } = totalPoints(matches);
  const teamTotal = team === "gray" ? gray : aqua;
  const teamName = team === "gray" ? "Gray (Joys)" : "Aquarellos";

  const stats = computePlayerStats(matches, players)
    .filter((s) => s.player.team_id === team)
    .sort((a, b) => b.pointsContributed - a.pointsContributed);

  const bannerClass =
    team === "gray"
      ? "bg-gradient-to-br from-gray-team-bg to-gray-team-deep"
      : "bg-gradient-to-br from-aqua-team-bg to-aqua-team-deep";
  const accentText = team === "gray" ? "text-gray-team-light" : "text-aqua-team-light";

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
          <div className="font-display text-4xl font-bold text-white">{fmt(teamTotal)}</div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">poeng tatt</div>
        </div>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground/50">
            Poeng per spiller
          </h3>
          <div className="space-y-2">
            {stats.map((s, i) => (
              <div
                key={s.player.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-navy-lighter/40 bg-navy-lighter/20 px-3 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-xs font-bold text-foreground/40">{i + 1}</span>
                  <span className="truncate font-semibold text-foreground/90">{s.player.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-foreground/50">
                    {s.wins}V {s.halved}D {s.losses}T
                  </span>
                  <span className={`font-bold ${accentText}`}>{fmt(s.pointsContributed)} p</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
