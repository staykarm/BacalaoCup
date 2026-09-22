export type TeamId = "gray" | "aqua";

export interface Team {
  id: TeamId;
  name: string;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  team_id: TeamId;
  hcp: number | null;
}

/** A past season's record for a player, e.g. from 2024 or 2023. */
export interface PlayerYearStat {
  id: string;
  player_id: string;
  year: number;
  /** Free-form record string as kept on the source sheet, e.g. "6-2" or "2-1-3". */
  record: string | null;
  individual_points: number | null;
  total_points: number | null;
}

export interface Day {
  id: string;
  label: string;
  date: string;
  course: string | null;
  sort_order: number;
  /** Admin: keep player names off this day's matches, e.g. for a surprise-pairings day. */
  hide_names: boolean;
}

export type SessionFormat = "fourball" | "greensome" | "singles" | "scramble" | "mixed";

export interface Session {
  id: string;
  day_id: string;
  name: string;
  format: SessionFormat;
  points_per_match: number;
  sort_order: number;
  /** Scramble only: a team-wide stroke allowance, subtracted from that team's combined flight score. */
  handicap_team: TeamId | null;
  handicap_strokes: number | null;
}

export type MatchResult = "not_played" | "gray_won" | "aqua_won" | "halved";

export interface Match {
  id: string;
  session_id: string;
  start_time: string | null;
  points: number;
  gray_player1: string | null;
  gray_player2: string | null;
  aqua_player1: string | null;
  aqua_player2: string | null;
  result: MatchResult;
  points_gray: number;
  points_aqua: number;
  note: string | null;
  sort_order: number;
  /** Positive: Gray leads by this many holes. Negative: Aqua leads. 0: All square. */
  live_up: number;
  /** Which hole the match has reached, 1–18. Null if not started. */
  live_thru: number | null;
  /** Scramble only: which team this flight belongs to. */
  flight_team: TeamId | null;
  /** Scramble only: this flight's score relative to par, e.g. -3, 0, 2. Null until entered. */
  score_vs_par: number | null;
  /** Scramble only: the 3-4 players (from flight_team's roster) making up this flight. */
  flight_players: string[];
}

export type HoleResult = "gray" | "aqua" | "halved";

/**
 * One hole's registered outcome for a match, keyed by (match_id, hole_number).
 * hole_number is 1-9, relative to whichever nine the session plays — see
 * `isFrontNine` in scoring.ts for the mapping to the course's real hole number.
 * `result` is used for match-play matches, `score_vs_par` for scramble flights;
 * a given match only ever uses one of the two, depending on its session format.
 */
export interface MatchHole {
  match_id: string;
  hole_number: number;
  result: HoleResult | null;
  score_vs_par: number | null;
}

export type LocationType = "course" | "house" | "restaurant";

export interface MapLocation {
  id: string;
  type: LocationType;
  name: string;
  address: string | null;
  notes: string | null;
  sort_order: number;
  lat: number | null;
  lng: number | null;
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  course: "Bane",
  house: "Hus",
  restaurant: "Restaurant",
};

export const FORMAT_LABELS: Record<SessionFormat, string> = {
  fourball: "Fourball",
  greensome: "Greensome",
  singles: "Singles",
  scramble: "Scramble",
  mixed: "Fourball + Singles",
};

export const RESULT_LABELS: Record<MatchResult, string> = {
  not_played: "Ikke spilt",
  gray_won: "Gray vant",
  aqua_won: "Aqua vant",
  halved: "Delt",
};
