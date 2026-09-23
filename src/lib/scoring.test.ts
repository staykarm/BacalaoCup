import { describe, expect, it } from "vitest";
import {
  autoResultFromLive,
  courseHoleNumber,
  deriveMatchPlayFromHoles,
  deriveScrambleFromHoles,
  hasLiveMatches,
  isFrontNine,
  isMatchDecided,
  liveLeader,
  liveUpLabel,
  matchMarginLabel,
  pointsForResult,
  pointsToClinch,
  projectedPoints,
  scrambleResult,
  startingUpFor,
  totalPoints,
} from "./scoring";
import { Match, MatchHole, Session } from "./types";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "m1",
    session_id: "s1",
    start_time: "10:00",
    points: 2,
    gray_player1: "g1",
    gray_player2: "g2",
    aqua_player1: "a1",
    aqua_player2: "a2",
    result: "not_played",
    points_gray: 0,
    points_aqua: 0,
    note: null,
    sort_order: 1,
    live_up: 0,
    live_thru: null,
    flight_team: null,
    score_vs_par: null,
    flight_players: [],
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    day_id: "d1",
    name: "Session",
    format: "fourball",
    points_per_match: 2,
    sort_order: 1,
    handicap_team: null,
    handicap_strokes: null,
    ...overrides,
  };
}

function hole(hole_number: number, overrides: Partial<MatchHole> = {}): MatchHole {
  return { match_id: "m1", hole_number, result: null, score_vs_par: null, ...overrides };
}

describe("pointsForResult", () => {
  it("gives all points to the winning side", () => {
    expect(pointsForResult("gray_won", 2)).toEqual({ points_gray: 2, points_aqua: 0 });
    expect(pointsForResult("aqua_won", 2)).toEqual({ points_gray: 0, points_aqua: 2 });
  });

  it("splits evenly on a halve", () => {
    expect(pointsForResult("halved", 3)).toEqual({ points_gray: 1.5, points_aqua: 1.5 });
  });

  it("gives nothing while not played", () => {
    expect(pointsForResult("not_played", 2)).toEqual({ points_gray: 0, points_aqua: 0 });
  });
});

describe("isMatchDecided / autoResultFromLive / matchMarginLabel", () => {
  it("is undecided before any hole is played", () => {
    expect(isMatchDecided(0, null)).toBe(false);
    expect(autoResultFromLive(0, null)).toBe("not_played");
    expect(matchMarginLabel(0, null)).toBeNull();
  });

  it("stays undecided while the lead doesn't exceed the holes remaining", () => {
    // 3 up with 3 to play (thru 6 of 9) — still catchable, not decided.
    expect(isMatchDecided(3, 6)).toBe(false);
    expect(autoResultFromLive(3, 6)).toBe("not_played");
  });

  it("closes out once the lead exceeds the holes remaining", () => {
    // 4 up with 3 to play — can't be caught.
    expect(isMatchDecided(4, 6)).toBe(true);
    expect(autoResultFromLive(4, 6)).toBe("gray_won");
    expect(matchMarginLabel(4, 6)).toBe("4/3");

    expect(isMatchDecided(-3, 7)).toBe(true);
    expect(autoResultFromLive(-3, 7)).toBe("aqua_won");
    expect(matchMarginLabel(-3, 7)).toBe("3/2");
  });

  it("is decided once all 9 holes are played, win or halve", () => {
    expect(isMatchDecided(1, 9)).toBe(true);
    expect(autoResultFromLive(1, 9)).toBe("gray_won");
    expect(matchMarginLabel(1, 9)).toBe("1 UP");

    expect(isMatchDecided(0, 9)).toBe(true);
    expect(autoResultFromLive(0, 9)).toBe("halved");
    expect(matchMarginLabel(0, 9)).toBeNull();
  });
});

describe("liveLeader / liveUpLabel", () => {
  it("reads the sign of live_up", () => {
    expect(liveLeader(2)).toBe("gray");
    expect(liveLeader(-2)).toBe("aqua");
    expect(liveLeader(0)).toBeNull();
  });

  it("labels an all-square match as A/S", () => {
    expect(liveUpLabel(0)).toBe("A/S");
    expect(liveUpLabel(3)).toBe("3 UP");
    expect(liveUpLabel(-3)).toBe("3 UP");
  });
});

describe("startingUpFor", () => {
  it("gives the lone player's side a 1-hole head start when a side is down a player", () => {
    expect(startingUpFor(makeMatch({ gray_player1: "g1", gray_player2: "g2", aqua_player1: "a1", aqua_player2: null }))).toBe(-1);
    expect(startingUpFor(makeMatch({ gray_player1: "g1", gray_player2: null, aqua_player1: "a1", aqua_player2: "a2" }))).toBe(1);
  });

  it("gives no head start when both sides field the same number of players", () => {
    expect(startingUpFor(makeMatch())).toBe(0);
    expect(startingUpFor(makeMatch({ gray_player2: null, aqua_player2: null }))).toBe(0);
  });
});

describe("deriveMatchPlayFromHoles", () => {
  it("is blank before any hole is entered", () => {
    const result = deriveMatchPlayFromHoles([], 2);
    expect(result).toEqual({ live_up: 0, live_thru: null, result: "not_played", points_gray: 0, points_aqua: 0 });
  });

  it("is order-independent", () => {
    const inOrder = [hole(1, { result: "gray" }), hole(2, { result: "aqua" }), hole(3, { result: "halved" })];
    const outOfOrder = [hole(3, { result: "halved" }), hole(1, { result: "gray" }), hole(2, { result: "aqua" })];
    expect(deriveMatchPlayFromHoles(inOrder, 2)).toEqual(deriveMatchPlayFromHoles(outOfOrder, 2));
  });

  it("only counts played holes toward live_thru, and folds a head start in once started", () => {
    const holes = [hole(1, { result: "gray" }), hole(2, { result: "gray" })];
    // Aqua's side is down a player, so gray's opponents start 1 up (startingUp = -1).
    const result = deriveMatchPlayFromHoles(holes, 2, -1);
    // 2 holes won by gray (+2) plus the -1 head start against gray = net +1.
    expect(result.live_up).toBe(1);
    expect(result.live_thru).toBe(2);
    expect(result.result).toBe("not_played");
  });

  it("auto-finalizes and assigns points once the match is decided", () => {
    const holes = [1, 2, 3, 4, 5].map((n) => hole(n, { result: "gray" }));
    const result = deriveMatchPlayFromHoles(holes, 2);
    // 5 up with 4 to play (thru 5 of 9) — can't be caught, decided early.
    expect(result.result).toBe("gray_won");
    expect(result.points_gray).toBe(2);
    expect(result.points_aqua).toBe(0);
  });

  it("halves once all 9 holes are in and still square", () => {
    const holes = [
      ...[1, 2, 3, 4].map((n) => hole(n, { result: "gray" })),
      ...[5, 6, 7, 8].map((n) => hole(n, { result: "aqua" })),
      hole(9, { result: "halved" }),
    ];
    const result = deriveMatchPlayFromHoles(holes, 2);
    expect(result.live_up).toBe(0);
    expect(result.live_thru).toBe(9);
    expect(result.result).toBe("halved");
    expect(result.points_gray).toBe(1);
    expect(result.points_aqua).toBe(1);
  });
});

describe("deriveScrambleFromHoles", () => {
  it("is blank before any hole is entered", () => {
    expect(deriveScrambleFromHoles([])).toEqual({ score_vs_par: null, live_thru: null });
  });

  it("sums only the entered holes' relative scores, order-independently", () => {
    const inOrder = [hole(1, { score_vs_par: -1 }), hole(2, { score_vs_par: 0 }), hole(3, { score_vs_par: 1 })];
    const outOfOrder = [hole(3, { score_vs_par: 1 }), hole(1, { score_vs_par: -1 }), hole(2, { score_vs_par: 0 })];
    expect(deriveScrambleFromHoles(inOrder)).toEqual({ score_vs_par: 0, live_thru: 3 });
    expect(deriveScrambleFromHoles(inOrder)).toEqual(deriveScrambleFromHoles(outOfOrder));
  });
});

describe("scrambleResult", () => {
  const session = makeSession({ format: "scramble", points_per_match: 8 });

  it("is undecided until every flight on both sides has played all 9 holes", () => {
    const flights = [
      makeMatch({ id: "gf1", flight_team: "gray", live_thru: 9, score_vs_par: -2 }),
      makeMatch({ id: "af1", flight_team: "aqua", live_thru: 7, score_vs_par: -1 }),
    ];
    expect(scrambleResult(flights, session)).toEqual({ decided: false, grayTotal: null, aquaTotal: null, winner: null });
  });

  it("gives the win to the lower combined score-vs-par", () => {
    const flights = [
      makeMatch({ id: "gf1", flight_team: "gray", live_thru: 9, score_vs_par: -2 }),
      makeMatch({ id: "gf2", flight_team: "gray", live_thru: 9, score_vs_par: -1 }),
      makeMatch({ id: "af1", flight_team: "aqua", live_thru: 9, score_vs_par: -3 }),
      makeMatch({ id: "af2", flight_team: "aqua", live_thru: 9, score_vs_par: 1 }),
    ];
    // Gray: -3 total. Aqua: -2 total. Gray wins (lower is better).
    const result = scrambleResult(flights, session);
    expect(result).toEqual({ decided: true, grayTotal: -3, aquaTotal: -2, winner: "gray" });
  });

  it("splits on an exact tie", () => {
    const flights = [
      makeMatch({ id: "gf1", flight_team: "gray", live_thru: 9, score_vs_par: -1 }),
      makeMatch({ id: "af1", flight_team: "aqua", live_thru: 9, score_vs_par: -1 }),
    ];
    expect(scrambleResult(flights, session).winner).toBeNull();
  });

  it("nets out a team handicap before deciding the winner", () => {
    const handicapped = makeSession({ ...session, handicap_team: "aqua", handicap_strokes: 2 });
    const flights = [
      makeMatch({ id: "gf1", flight_team: "gray", live_thru: 9, score_vs_par: -2 }),
      makeMatch({ id: "af1", flight_team: "aqua", live_thru: 9, score_vs_par: -1 }),
    ];
    // Gray wins raw (-2 vs -1), but aqua's 2-stroke allowance nets it to -3, flipping the winner.
    expect(scrambleResult(flights, session).winner).toBe("gray");
    expect(scrambleResult(flights, handicapped).winner).toBe("aqua");
  });
});

describe("isFrontNine / courseHoleNumber", () => {
  const sessions = [
    makeSession({ id: "morning", day_id: "d1", sort_order: 1 }),
    makeSession({ id: "afternoon", day_id: "d1", sort_order: 2 }),
  ];

  it("only the day's first session plays the front nine", () => {
    expect(isFrontNine(sessions[0], sessions)).toBe(true);
    expect(isFrontNine(sessions[1], sessions)).toBe(false);
  });

  it("maps relative holes onto the back nine for a later session", () => {
    expect(courseHoleNumber(1, true)).toBe(1);
    expect(courseHoleNumber(9, true)).toBe(9);
    expect(courseHoleNumber(1, false)).toBe(10);
    expect(courseHoleNumber(9, false)).toBe(18);
  });
});

describe("pointsToClinch", () => {
  it("needs strictly more than half the total to clinch outright", () => {
    // 10 possible points — 5.5 clinches it outright.
    expect(pointsToClinch(5, 3, 10)).toEqual({ gray: 0.5, aqua: 2.5 });
  });

  it("needs nothing more once a side has already clinched", () => {
    expect(pointsToClinch(6, 2, 10).gray).toBe(0);
  });
});

describe("hasLiveMatches", () => {
  it("is true only when an unfinished match has live progress", () => {
    expect(hasLiveMatches([makeMatch({ result: "not_played", live_up: 0, live_thru: null })])).toBe(false);
    expect(hasLiveMatches([makeMatch({ result: "not_played", live_up: 1, live_thru: 3 })])).toBe(true);
    expect(hasLiveMatches([makeMatch({ result: "gray_won", live_up: 3, live_thru: 9 })])).toBe(false);
  });
});

describe("totalPoints / projectedPoints", () => {
  const session = makeSession();

  it("totalPoints only counts finalized matches", () => {
    const matches = [
      makeMatch({ id: "m1", result: "gray_won", points_gray: 2, points_aqua: 0 }),
      makeMatch({ id: "m2", result: "not_played", live_up: 1, live_thru: 3 }),
    ];
    expect(totalPoints(matches, [session])).toEqual({ gray: 2, aqua: 0, possible: 4 });
  });

  it("projectedPoints also counts a live match toward whoever currently leads it", () => {
    const matches = [
      makeMatch({ id: "m1", result: "gray_won", points_gray: 2, points_aqua: 0 }),
      makeMatch({ id: "m2", result: "not_played", live_up: -1, live_thru: 3 }),
    ];
    expect(projectedPoints(matches, [session])).toEqual({ gray: 2, aqua: 2, possible: 4 });
  });

  it("splits a projected all-square live match evenly", () => {
    const matches = [makeMatch({ id: "m1", result: "not_played", live_up: 0, live_thru: 2 })];
    expect(projectedPoints(matches, [session])).toEqual({ gray: 1, aqua: 1, possible: 2 });
  });
});
