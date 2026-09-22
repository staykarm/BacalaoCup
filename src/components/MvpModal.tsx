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

  const historyText = history
    .map((h) => {
      const bits = [h.record, h.total_points !== null ? `${fmt(h.total_points)}p` : null].filter(Boolean);
      return `${h.year}${bits.length > 0 ? ` (${bits.join(" · ")})` : ""}`;
    })
    .join("  ·  ");

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 border-b border-l-4 border-card-border bg-white px-2 py-1.5 text-left hover:bg-card-deep/50 ${borderClass}`}
    >
      <span className="w-4 shrink-0 text-[10px] font-bold text-ink-light/50">{rank}</span>
      <Image
        src={team === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 shrink-0 rounded-full object-cover"
      />
      <span className="min-w-0 flex-1 truncate">
        <span className="font-semibold text-ink">{player.name}</span>
        {player.hcp !== null && <span className="ml-1.5 text-[10px] text-ink-light/40">hcp {fmt(player.hcp)}</span>}
        {historyText && (
          <span className="ml-1.5 truncate text-[10px] text-ink-light/40">&middot; {historyText}</span>
        )}
      </span>
      <span className="shrink-0 text-[11px] text-ink-light">
        {stat.wins}-{stat.halved}-{stat.losses}
      </span>
      <span className="w-11 shrink-0 text-right text-sm font-bold text-ink">
        {stat.projectedExtra > 0 && "≈"}
        {fmt(stat.pointsContributed + stat.projectedExtra)}p
      </span>
    </button>
  );
}

export function MvpModal({ onClose }: { onClose: () => void }) {
  const { players, matches, playerYearStats } = useTournament();
  const playerStats = computePlayerStats(matches, players);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const rows = players
    .map((p) => ({ player: p, stat: playerStats.find((s) => s.player.id === p.id)! }))
    .sort(
      (a, b) =>
        b.stat.pointsContributed + b.stat.projectedExtra - (a.stat.pointsContributed + a.stat.projectedExtra)
    );

  return (
    <ModalShell title="MVP" onClose={onClose}>
      <div className="overflow-hidden rounded-2xl border border-card-border">
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
