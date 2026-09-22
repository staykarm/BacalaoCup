import { Match, MatchHole, MatchResult, Session, TeamId } from "./types";

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

/**
 * A scramble session isn't match-play: each team fields two flights, and the whole
 * session's points go entirely to whichever team has the lower combined score-vs-par
 * across its two flights (net of an optional team handicap) — never split per row.
 * "Decided" only once every flight on both sides has a score entered.
 */
export function scrambleResult(flights: Match[], session: Session) {
  const grayFlights = flights.filter((f) => f.flight_team === "gray");
  const aquaFlights = flights.filter((f) => f.flight_team === "aqua");
  const allPlayedOut = (fs: Match[]) =>
    fs.length > 0 && fs.every((f) => f.live_thru !== null && f.live_thru >= HOLES_PER_MATCH);
  const decided = allPlayedOut(grayFlights) && allPlayedOut(aquaFlights);

  if (!decided) {
    return { decided: false, grayTotal: null, aquaTotal: null, winner: null } as const;
  }

  const grayTotal = grayFlights.reduce((a, f) => a + (f.score_vs_par ?? 0), 0);
  const aquaTotal = aquaFlights.reduce((a, f) => a + (f.score_vs_par ?? 0), 0);
  const grayNet = grayTotal - (session.handicap_team === "gray" ? (session.handicap_strokes ?? 0) : 0);
  const aquaNet = aquaTotal - (session.handicap_team === "aqua" ? (session.handicap_strokes ?? 0) : 0);
  const winner: TeamId | null = grayNet === aquaNet ? null : grayNet < aquaNet ? "gray" : "aqua";

  return { decided: true, grayTotal, aquaTotal, winner } as const;
}

function sessionPoints(sessionMatches: Match[], session: Session | undefined) {
  if (session?.format === "scramble") {
    if (!session) return { gray: 0, aqua: 0 };
    const result = scrambleResult(sessionMatches, session);
    if (!result.decided) return { gray: 0, aqua: 0 };
    if (result.winner === "gray") return { gray: session.points_per_match, aqua: 0 };
    if (result.winner === "aqua") return { gray: 0, aqua: session.points_per_match };
    return { gray: session.points_per_match / 2, aqua: session.points_per_match / 2 };
  }
  return sessionMatches.reduce(
    (acc, m) => {
      acc.gray += m.points_gray;
      acc.aqua += m.points_aqua;
      return acc;
    },
    { gray: 0, aqua: 0 }
  );
}

function groupBySession(matches: Match[]) {
  const bySession = new Map<string, Match[]>();
  for (const m of matches) {
    const list = bySession.get(m.session_id) ?? [];
    list.push(m);
    bySession.set(m.session_id, list);
  }
  return bySession;
}

/** Total points still possible for a session: 1 pool of points_per_match for a scramble session, or the sum of each match's own points otherwise. */
function sessionPossible(sessionMatches: Match[], session: Session | undefined) {
  if (session?.format === "scramble") return session.points_per_match;
  return sessionMatches.reduce((sum, m) => sum + m.points, 0);
}

export function totalPoints(matches: Match[], sessions: Session[]) {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const bySession = groupBySession(matches);
  let gray = 0;
  let aqua = 0;
  let possible = 0;
  for (const [sessionId, sessionMatches] of bySession) {
    const session = sessionById.get(sessionId);
    const points = sessionPoints(sessionMatches, session);
    gray += points.gray;
    aqua += points.aqua;
    possible += sessionPossible(sessionMatches, session);
  }
  return { gray, aqua, possible };
}

/**
 * Same as totalPoints, but a match-play match still in progress (not yet finalized)
 * counts toward whichever team currently leads it live — so the standing updates
 * hole by hole instead of waiting for the match to be locked in. Once at least one
 * hole has been played, a match that's all square splits its points evenly between
 * the teams, same as a halved final result. A match that hasn't started yet still
 * contributes nothing. A scramble session has no partial/live state — it only
 * contributes once every flight's score has been entered, same as totalPoints.
 */
export function projectedPoints(matches: Match[], sessions: Session[]) {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const bySession = groupBySession(matches);
  let gray = 0;
  let aqua = 0;
  let possible = 0;
  for (const [sessionId, sessionMatches] of bySession) {
    const session = sessionById.get(sessionId);
    if (session?.format === "scramble") {
      const points = sessionPoints(sessionMatches, session);
      gray += points.gray;
      aqua += points.aqua;
    } else {
      for (const m of sessionMatches) {
        if (m.result !== "not_played") {
          gray += m.points_gray;
          aqua += m.points_aqua;
        } else if (m.live_thru !== null || m.live_up !== 0) {
          const leader = liveLeader(m.live_up);
          if (leader === "gray") gray += m.points;
          else if (leader === "aqua") aqua += m.points;
          else {
            gray += m.points / 2;
            aqua += m.points / 2;
          }
        }
      }
    }
    possible += sessionPossible(sessionMatches, session);
  }
  return { gray, aqua, possible };
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

/** These are 9-hole matches, not the usual 18. */
export const HOLES_PER_MATCH = 9;

/**
 * A match-play match is decided once a team is up by more holes than remain to play
 * (e.g. 3 up with 2 to play), or once the last hole has been reached at all — a match
 * still all square after the last hole is a halve, which is also "decided".
 */
export function isMatchDecided(liveUp: number, liveThru: number | null): boolean {
  if (liveThru === null) return false;
  if (liveThru >= HOLES_PER_MATCH) return true;
  const remaining = HOLES_PER_MATCH - liveThru;
  return Math.abs(liveUp) > remaining;
}

/** The result the app should record automatically, based only on the live hole-by-hole score. */
export function autoResultFromLive(liveUp: number, liveThru: number | null): MatchResult {
  if (!isMatchDecided(liveUp, liveThru)) return "not_played";
  if (liveUp > 0) return "gray_won";
  if (liveUp < 0) return "aqua_won";
  return "halved";
}

/** Standard match-play margin label once decided, e.g. "3/2" (closed out early) or "1 UP" (won on the last hole). Null while undecided. */
export function matchMarginLabel(liveUp: number, liveThru: number | null): string | null {
  if (!isMatchDecided(liveUp, liveThru) || liveThru === null) return null;
  const upBy = Math.abs(liveUp);
  if (upBy === 0) return null;
  const remaining = HOLES_PER_MATCH - liveThru;
  return remaining > 0 ? `${upBy}/${remaining}` : `${upBy} UP`;
}

/**
 * True if this session plays the front nine (holes 1-9) — the first session of its
 * day, by sort_order. Every other session that day plays the back nine (10-18),
 * since the whole field moves to the back nine together once the first group is off.
 */
export function isFrontNine(session: Session, sessions: Session[]): boolean {
  const daySessions = sessions.filter((s) => s.day_id === session.day_id);
  const minSortOrder = Math.min(...daySessions.map((s) => s.sort_order));
  return session.sort_order === minSortOrder;
}

/** Maps a match's relative hole number (1-9) to the course's actual hole number (1-9 or 10-18). */
export function courseHoleNumber(relativeHole: number, frontNine: boolean): number {
  return frontNine ? relativeHole : relativeHole + 9;
}

/**
 * Derives a match-play match's live_up/live_thru/result/points from its per-hole
 * results. Order-independent — a hole can be entered or corrected out of sequence
 * and the totals stay correct, since every match has exactly HOLES_PER_MATCH holes
 * regardless of which ones are filled in so far.
 */
export function deriveMatchPlayFromHoles(holes: MatchHole[], points: number) {
  const played = holes.filter((h) => h.result !== null);
  const live_up = played.reduce((sum, h) => {
    if (h.result === "gray") return sum + 1;
    if (h.result === "aqua") return sum - 1;
    return sum;
  }, 0);
  const live_thru = played.length > 0 ? played.length : null;
  const result = autoResultFromLive(live_up, live_thru);
  const { points_gray, points_aqua } = pointsForResult(result, points);
  return { live_up, live_thru, result, points_gray, points_aqua };
}

/**
 * Derives a scramble flight's score_vs_par/live_thru from its per-hole scores
 * (each already relative to that hole's own par). Same order-independence as above.
 */
export function deriveScrambleFromHoles(holes: MatchHole[]) {
  const played = holes.filter((h) => h.score_vs_par !== null);
  const score_vs_par = played.length > 0 ? played.reduce((sum, h) => sum + (h.score_vs_par ?? 0), 0) : null;
  const live_thru = played.length > 0 ? played.length : null;
  return { score_vs_par, live_thru };
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
