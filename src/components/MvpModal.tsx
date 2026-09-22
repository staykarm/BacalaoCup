"use client";

import Image from "next/image";
import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { computePlayerStats } from "@/lib/stats";
import { Player, PlayerYearStat, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";
import { PlayerDetailModal } from "./PlayerDetailModal";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function PlayerRow({
  rank,
  player,
  stat,
  history,
  onClick,
}: {
  rank: number;
  player: Player;
  stat: ReturnType<typeof computePlayerStats>[number];
  history: PlayerYearStat[];
  onClick: () => void;
}) {
  const team: TeamId = player.team_id;
  const borderClass = team === "gray" ? "border-l-gray-team" : "border-l-aqua-team";

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border border-l-4 border-card-border bg-white p-3 text-left hover:border-gold-deep/40 ${borderClass}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-5 shrink-0 text-xs font-bold text-ink-light/50">{rank}</span>
        <Image
          src={team === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
          alt={team === "gray" ? "Gray (Joys)" : "Aquarellos"}
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
        <span className="flex-1 truncate font-semibold text-ink hover:underline">{player.name}</span>
        {player.hcp !== null && (
          <span className="shrink-0 rounded-full border border-card-border px-2 py-0.5 text-[11px] text-ink-light">
            HCP {fmt(player.hcp)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 pl-7 text-xs text-ink-light">
        <span>
          {stat.wins}-{stat.halved}-{stat.losses}
        </span>
        <span className="font-bold text-ink">{fmt(stat.pointsContributed)} p</span>
      </div>

      {history.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-card-border pl-7 pt-2 text-[11px] text-ink-light/70">
          {history.map((h) => (
            <div key={h.year} className="flex items-center justify-between gap-2">
              <span>{h.year}</span>
              {h.record && <span>{h.record}</span>}
              <span>
                {h.individual_points !== null && `${fmt(h.individual_points)} ind.`}
                {h.individual_points !== null && h.total_points !== null && " · "}
                {h.total_points !== null && `${fmt(h.total_points)} p`}
              </span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

export function MvpModal({ onClose }: { onClose: () => void }) {
  const { players, matches, playerYearStats } = useTournament();
  const playerStats = computePlayerStats(matches, players);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const rows = players
    .map((p) => ({ player: p, stat: playerStats.find((s) => s.player.id === p.id)! }))
    .sort((a, b) => b.stat.pointsContributed - a.stat.pointsContributed);

  return (
    <ModalShell title="MVP" onClose={onClose}>
      <div className="space-y-2">
        {rows.map(({ player, stat }, i) => (
          <PlayerRow
            key={player.id}
            rank={i + 1}
            player={player}
            stat={stat}
            history={playerYearStats
              .filter((h) => h.player_id === player.id)
              .sort((a, b) => b.year - a.year)}
            onClick={() => setSelectedPlayerId(player.id)}
          />
        ))}
      </div>

      {selectedPlayerId && (
        <PlayerDetailModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
      )}
    </ModalShell>
  );
}
