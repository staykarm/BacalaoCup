"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { computePlayerStats } from "@/lib/stats";
import { Player, PlayerYearStat, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";
import { PlayerDetailModal } from "./PlayerDetailModal";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function PlayerCard({
  player,
  stat,
  history,
  onClick,
}: {
  player: Player;
  stat: ReturnType<typeof computePlayerStats>[number];
  history: PlayerYearStat[];
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full rounded-2xl border border-card-border bg-white p-3 text-left hover:border-gold-deep/40">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-ink hover:underline">{player.name}</span>
        {player.hcp !== null && (
          <span className="shrink-0 rounded-full border border-card-border px-2 py-0.5 text-[11px] text-ink-light">
            HCP {fmt(player.hcp)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-ink-light">
        <span>
          {stat.wins}-{stat.halved}-{stat.losses}
        </span>
        <span className="font-bold text-ink">{fmt(stat.pointsContributed)} p</span>
      </div>

      {history.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-card-border pt-2 text-[11px] text-ink-light/70">
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

function TeamGroup({
  team,
  title,
  players,
  playerStats,
  playerYearStats,
  lighter,
  onSelectPlayer,
}: {
  team: TeamId;
  title: string;
  players: Player[];
  playerStats: ReturnType<typeof computePlayerStats>;
  playerYearStats: PlayerYearStat[];
  lighter?: boolean;
  onSelectPlayer: (id: string) => void;
}) {
  const rows = players
    .map((p) => ({ player: p, stat: playerStats.find((s) => s.player.id === p.id)! }))
    .sort((a, b) => b.stat.pointsContributed - a.stat.pointsContributed);

  const headerClass = lighter
    ? "bg-gray-team-light text-navy-deep"
    : team === "gray"
      ? "bg-gray-team-bg/50 text-foreground/90"
      : "bg-aqua-team-bg/50 text-foreground/90";

  return (
    <section>
      <h3 className={`mb-3 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${headerClass}`}>
        {title}
      </h3>
      <div className="space-y-2">
        {rows.map(({ player, stat }) => (
          <PlayerCard
            key={player.id}
            player={player}
            stat={stat}
            history={playerYearStats
              .filter((h) => h.player_id === player.id)
              .sort((a, b) => b.year - a.year)}
            onClick={() => onSelectPlayer(player.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function MvpModal({ onClose }: { onClose: () => void }) {
  const { players, matches, playerYearStats } = useTournament();
  const playerStats = computePlayerStats(matches, players);
  const grayPlayers = players.filter((p) => p.team_id === "gray");
  const aquaPlayers = players.filter((p) => p.team_id === "aqua");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  return (
    <ModalShell title="MVP" onClose={onClose}>
      <div className="grid gap-6 sm:grid-cols-2">
        <TeamGroup
          team="gray"
          title="Gray (Joys)"
          players={grayPlayers}
          playerStats={playerStats}
          playerYearStats={playerYearStats}
          lighter
          onSelectPlayer={setSelectedPlayerId}
        />
        <TeamGroup
          team="aqua"
          title="Aquarellos"
          players={aquaPlayers}
          playerStats={playerStats}
          playerYearStats={playerYearStats}
          onSelectPlayer={setSelectedPlayerId}
        />
      </div>

      {selectedPlayerId && (
        <PlayerDetailModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
      )}
    </ModalShell>
  );
}
