"use client";

import { useTournament } from "@/context/TournamentContext";
import { usePlayerModal } from "@/context/PlayerModalContext";
import { computeCompetitionWins, computePlayerStats, rankByValue } from "@/lib/stats";
import { Player, PlayerYearStat, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";
import { PlayerAvatar } from "./PlayerAvatar";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function PlayerRow({
  rank,
  player,
  stat,
  history,
  competitionWins,
  onClick,
}: {
  rank: number;
  player: Player;
  stat: ReturnType<typeof computePlayerStats>[number];
  history: PlayerYearStat[];
  competitionWins: number;
  onClick: () => void;
}) {
  const team: TeamId = player.team_id;
  // A thin border alone reads too faint once real player photos replace the team-logo
  // fallback (the usual, more obvious team cue) — a tinted row background makes the
  // team unmistakable either way.
  const borderClass = team === "gray" ? "border-l-gray-team-deep" : "border-l-aqua-team";
  const tintClass = team === "gray" ? "bg-gray-team-bg/25" : "bg-aqua-team-bg/35";

  const historyText = history
    .map((h) => {
      const bits = [h.record, h.total_points !== null ? `${fmt(h.total_points)}p` : null].filter(Boolean);
      return `${h.year}${bits.length > 0 ? ` (${bits.join(" · ")})` : ""}`;
    })
    .join("  ·  ");

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 border-b border-l-4 border-card-border px-2 py-1.5 text-left hover:brightness-95 ${borderClass} ${tintClass}`}
    >
      <span className="w-4 shrink-0 text-[10px] font-bold text-ink-light/50">{rank}</span>
      <PlayerAvatar playerId={player.id} fallbackTeamId={team} size={16} className="h-4 w-4" alwaysOn />
      <span className="min-w-0 flex-1 truncate">
        <span className="font-semibold text-ink">
          {player.name}
          {player.is_captain && <span className="text-gold-deep"> (C)</span>}
        </span>
        {competitionWins > 0 && <span className="ml-1.5 text-[10px] text-gold-deep">🏆 {competitionWins}</span>}
        {player.hcp !== null && <span className="ml-1.5 text-[10px] text-ink-light/40">hcp {fmt(player.hcp)}</span>}
        {historyText && (
          <span className="ml-1.5 truncate text-[10px] text-ink-light/40">&middot; {historyText}</span>
        )}
      </span>
      <span className="shrink-0 text-[11px] text-ink-light">
        {stat.wins}-{stat.halved}-{stat.losses}
      </span>
      <span
        className={`w-12 shrink-0 text-right text-sm font-bold tabular-nums ${
          stat.projectedExtra > 0 ? "italic text-ink-light" : "text-ink"
        }`}
        title={stat.projectedExtra > 0 ? "Inkluderer anslått poeng fra kamp som pågår" : undefined}
      >
        {stat.projectedExtra > 0 && "≈"}
        {(stat.pointsContributed + stat.projectedExtra).toFixed(1)}p
      </span>
    </button>
  );
}

export function MvpModal({ onClose }: { onClose: () => void }) {
  const { players, matches, playerYearStats, days } = useTournament();
  const playerStats = computePlayerStats(matches, players);
  const competitionWins = computeCompetitionWins(days, players);
  const winsById = new Map(competitionWins.perPlayer.map((p) => [p.player.id, p.wins]));
  const { openPlayer } = usePlayerModal();

  const rows = players
    .map((p) => ({ player: p, stat: playerStats.find((s) => s.player.id === p.id)! }))
    .sort(
      (a, b) =>
        b.stat.pointsContributed + b.stat.projectedExtra - (a.stat.pointsContributed + a.stat.projectedExtra)
    );
  const ranks = rankByValue(rows, (r) => r.stat.pointsContributed + r.stat.projectedExtra);

  return (
    <ModalShell title="MVP" onClose={onClose}>
      <div className="overflow-hidden rounded-2xl border border-card-border">
        {rows.map(({ player, stat }, i) => (
          <PlayerRow
            key={player.id}
            rank={ranks[i]}
            player={player}
            stat={stat}
            history={playerYearStats
              .filter((h) => h.player_id === player.id)
              .sort((a, b) => b.year - a.year)}
            competitionWins={winsById.get(player.id) ?? 0}
            onClick={() => openPlayer(player.id)}
          />
        ))}
      </div>
    </ModalShell>
  );
}
