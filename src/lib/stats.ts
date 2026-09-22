import { liveLeader } from "./scoring";
import { Day, Match, Player, Session, TeamId } from "./types";

export interface PlayerStat {
  player: Player;
  played: number;
  wins: number;
  losses: number;
  halved: number;
  /** Points from finalized matches only. */
  pointsContributed: number;
  /** Extra points projected from a live in-progress match, if its current lead holds. */
  projectedExtra: number;
}

export interface PairStat {
  team: TeamId;
  playerIds: [string, string];
  names: string;
  wins: number;
  halved: number;
  played: number;
  winScore: number;
}

export interface SessionBreakdown {
  session: Session;
  gray: number;
  aqua: number;
}

export interface DayBreakdown {
  day: Day;
  gray: number;
  aqua: number;
  sessions: SessionBreakdown[];
}

function opposingTeamWon(match: Match, side: TeamId): boolean {
  if (side === "gray") return match.result === "aqua_won";
  return match.result === "gray_won";
}

function sideWon(match: Match, side: TeamId): boolean {
  if (side === "gray") return match.result === "gray_won";
  return match.result === "aqua_won";
}

export function computePlayerStats(matches: Match[], players: Player[]): PlayerStat[] {
  const byId = new Map(players.map((p) => [p.id, p]));
  const stats = new Map<string, PlayerStat>();

  for (const p of players) {
    stats.set(p.id, { player: p, played: 0, wins: 0, losses: 0, halved: 0, pointsContributed: 0, projectedExtra: 0 });
  }

  for (const match of matches) {
    const grayIds = [match.gray_player1, match.gray_player2].filter((id): id is string => !!id);
    const aquaIds = [match.aqua_player1, match.aqua_player2].filter((id): id is string => !!id);

    if (match.result === "not_played") {
      // Not finalized — only worth anything once it's actually under way, and then only
      // as a projection (win/halve/loss records stay settled-only, same as `played`).
      if (match.live_up === 0 && match.live_thru === null) continue;
      const leader = liveLeader(match.live_up);
      const grayPoints = leader === "gray" ? match.points : leader === null ? match.points / 2 : 0;
      const aquaPoints = leader === "aqua" ? match.points : leader === null ? match.points / 2 : 0;
      for (const id of grayIds) {
        const s = stats.get(id);
        if (s && byId.has(id)) s.projectedExtra += grayPoints;
      }
      for (const id of aquaIds) {
        const s = stats.get(id);
        if (s && byId.has(id)) s.projectedExtra += aquaPoints;
      }
      continue;
    }

    for (const id of grayIds) {
      const s = stats.get(id);
      if (!s || !byId.has(id)) continue;
      s.played += 1;
      s.pointsContributed += match.points_gray;
      if (sideWon(match, "gray")) s.wins += 1;
      else if (opposingTeamWon(match, "gray")) s.losses += 1;
      else if (match.result === "halved") s.halved += 1;
    }

    for (const id of aquaIds) {
      const s = stats.get(id);
      if (!s || !byId.has(id)) continue;
      s.played += 1;
      s.pointsContributed += match.points_aqua;
      if (sideWon(match, "aqua")) s.wins += 1;
      else if (opposingTeamWon(match, "aqua")) s.losses += 1;
      else if (match.result === "halved") s.halved += 1;
    }
  }

  return Array.from(stats.values()).sort(
    (a, b) => b.pointsContributed + b.projectedExtra - (a.pointsContributed + a.projectedExtra)
  );
}

export function computePairStats(matches: Match[], players: Player[]): PairStat[] {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? id;
  const pairs = new Map<string, PairStat>();

  for (const match of matches) {
    if (match.result === "not_played") continue;

    const sides: { team: TeamId; ids: (string | null)[] }[] = [
      { team: "gray", ids: [match.gray_player1, match.gray_player2] },
      { team: "aqua", ids: [match.aqua_player1, match.aqua_player2] },
    ];

    for (const side of sides) {
      const ids = side.ids.filter((id): id is string => !!id);
      if (ids.length !== 2) continue;

      const sorted = [...ids].sort();
      const key = `${side.team}:${sorted[0]}:${sorted[1]}`;
      const existing = pairs.get(key) ?? {
        team: side.team,
        playerIds: sorted as [string, string],
        names: sorted.map(nameOf).join(" / "),
        wins: 0,
        halved: 0,
        played: 0,
        winScore: 0,
      };

      existing.played += 1;
      if (sideWon(match, side.team)) {
        existing.wins += 1;
        existing.winScore += 1;
      } else if (match.result === "halved") {
        existing.halved += 1;
        existing.winScore += 0.5;
      }

      pairs.set(key, existing);
    }
  }

  return Array.from(pairs.values()).sort((a, b) => b.winScore - a.winScore);
}

export function computeDayBreakdown(
  days: Day[],
  sessions: Session[],
  matches: Match[]
): DayBreakdown[] {
  return [...days]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((day) => {
      const daySessions = sessions
        .filter((s) => s.day_id === day.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const sessionBreakdowns: SessionBreakdown[] = daySessions.map((session) => {
        const sessionMatches = matches.filter((m) => m.session_id === session.id);
        return {
          session,
          gray: sessionMatches.reduce((sum, m) => sum + m.points_gray, 0),
          aqua: sessionMatches.reduce((sum, m) => sum + m.points_aqua, 0),
        };
      });

      return {
        day,
        gray: sessionBreakdowns.reduce((sum, s) => sum + s.gray, 0),
        aqua: sessionBreakdowns.reduce((sum, s) => sum + s.aqua, 0),
        sessions: sessionBreakdowns,
      };
    });
}
