import { Match, MatchResult, TeamId } from "./types";

export function pointsForResult(
  result: MatchResult,
  points: number
): { points_gray: number; points_aqua: number } {
  switch (result) {
    case "gray_won":
      return { points_gray: points, points_aqua: 0 };
    case "aqua_won":
      return { points_gray: 0, points_aqua: points };
    case "halved":
      return { points_gray: points / 2, points_aqua: points / 2 };
    case "not_played":
    default:
      return { points_gray: 0, points_aqua: 0 };
  }
}

export function totalPoints(matches: Match[]) {
  return matches.reduce(
    (acc, m) => {
      acc.gray += m.points_gray;
      acc.aqua += m.points_aqua;
      acc.possible += m.points;
      return acc;
    },
    { gray: 0, aqua: 0, possible: 0 }
  );
}

/**
 * Same as totalPoints, but a match still in progress (not yet finalized)
 * counts toward whichever team currently leads it live — so the standing
 * updates hole by hole instead of waiting for the match to be locked in.
 * A match that's all square live contributes nothing yet, same as one that
 * hasn't started.
 */
export function projectedPoints(matches: Match[]) {
  return matches.reduce(
    (acc, m) => {
      if (m.result !== "not_played") {
        acc.gray += m.points_gray;
        acc.aqua += m.points_aqua;
      } else {
        const leader = liveLeader(m.live_up);
        if (leader === "gray") acc.gray += m.points;
        if (leader === "aqua") acc.aqua += m.points;
      }
      acc.possible += m.points;
      return acc;
    },
    { gray: 0, aqua: 0, possible: 0 }
  );
}

/** True if any not-yet-finalized match currently has a live score entered. */
export function hasLiveMatches(matches: Match[]) {
  return matches.some((m) => m.result === "not_played" && (m.live_up !== 0 || m.live_thru !== null));
}

/** Standard match-play label for the live in-progress score, e.g. "2 UP" or "A/S". */
export function liveUpLabel(liveUp: number): string {
  return liveUp === 0 ? "A/S" : `${Math.abs(liveUp)} UP`;
}

export function liveLeader(liveUp: number): TeamId | null {
  if (liveUp > 0) return "gray";
  if (liveUp < 0) return "aqua";
  return null;
}

/** Points a team still needs to mathematically clinch the cup outright. */
export function pointsToClinch(currentGray: number, currentAqua: number, totalPossible: number) {
  // Work in half-point units to avoid floating point edge cases (all points
  // are multiples of 0.5 since a halved match splits a point in two).
  const totalHalf = Math.round(totalPossible * 2);
  const majorityHalf = Math.floor(totalHalf / 2) + 1;

  const grayHalf = Math.round(currentGray * 2);
  const aquaHalf = Math.round(currentAqua * 2);

  return {
    gray: Math.max(0, majorityHalf - grayHalf) / 2,
    aqua: Math.max(0, majorityHalf - aquaHalf) / 2,
  };
}
