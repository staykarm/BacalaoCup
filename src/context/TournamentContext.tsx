"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { deriveMatchPlayFromHoles, deriveScrambleFromHoles, startingUpFor } from "@/lib/scoring";
import {
  Day,
  HoleResult,
  MapLocation,
  Match,
  MatchHole,
  MatchResult,
  Player,
  PlayerYearStat,
  Session,
  Team,
  TeamId,
} from "@/lib/types";

interface TournamentContextValue {
  teams: Team[];
  players: Player[];
  days: Day[];
  sessions: Session[];
  matches: Match[];
  matchHoles: MatchHole[];
  locations: MapLocation[];
  playerYearStats: PlayerYearStat[];
  loading: boolean;
  error: string | null;
  /** A background save (not the initial load) failed, e.g. a dropped connection while live-scoring. */
  syncError: string | null;
  clearSyncError: () => void;
  updateMatch: (id: string, patch: Partial<Match>) => Promise<void>;
  updateLocationCoords: (id: string, lat: number, lng: number) => Promise<void>;
  /** Admin: resets every match back to not-played with no live score or result. */
  resetAllMatches: () => Promise<void>;
  /** Admin: which round is marked "- pågår" in the UI. Purely informational — doesn't restrict editing. */
  activeSessionId: string | null;
  setActiveSession: (sessionId: string | null) => Promise<void>;
  /** Admin: scramble-only team stroke handicap for a session. Pass team=null to clear it. */
  updateSessionHandicap: (sessionId: string, team: TeamId | null, strokes: number | null) => Promise<void>;
  /** Admin: hide/show player names for every match on a day. */
  updateDayHideNames: (dayId: string, hide: boolean) => Promise<void>;
  /** Admin: set (or clear, with an empty string) who won a Longest Drive / Closest to Pin hole. */
  updateCompetitionWinner: (dayId: string, hole: number, winner: string) => Promise<void>;
  /** The PIN required to unlock the admin panel — a soft deterrent, not real auth. */
  adminPin: string;
  updateAdminPin: (pin: string) => Promise<void>;
  /**
   * Registers (or clears, when both are null) one hole's result for a match-play
   * match or score for a scramble flight, then derives and writes back that
   * match's aggregate live_up/live_thru/result/points (or score_vs_par/live_thru).
   */
  setMatchHole: (
    match: Match,
    holeNumber: number,
    patch: { result?: HoleResult | null; score_vs_par?: number | null }
  ) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchHoles, setMatchHoles] = useState<MatchHole[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [playerYearStats, setPlayerYearStats] = useState<PlayerYearStat[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [adminPin, setAdminPin] = useState<string>("2026");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const clearSyncError = useCallback(() => setSyncError(null), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [
          teamsRes,
          playersRes,
          daysRes,
          sessionsRes,
          matchesRes,
          matchHolesRes,
          locationsRes,
          playerYearStatsRes,
          appSettingsRes,
        ] = await Promise.all([
          supabase.from("teams").select("*"),
          supabase.from("players").select("*"),
          supabase.from("days").select("*").order("sort_order"),
          supabase.from("sessions").select("*").order("sort_order"),
          supabase.from("matches").select("*").order("sort_order"),
          supabase.from("match_holes").select("*"),
          supabase.from("locations").select("*").order("sort_order"),
          supabase.from("player_year_stats").select("*").order("year", { ascending: false }),
          supabase.from("app_settings").select("*").eq("id", "singleton").maybeSingle(),
        ]);

        if (cancelled) return;

        const firstError =
          teamsRes.error ||
          playersRes.error ||
          daysRes.error ||
          sessionsRes.error ||
          matchesRes.error ||
          matchHolesRes.error ||
          locationsRes.error ||
          playerYearStatsRes.error ||
          appSettingsRes.error;

        if (firstError) {
          setError(firstError.message);
          setLoading(false);
          return;
        }

        setTeams(teamsRes.data ?? []);
        setPlayers(playersRes.data ?? []);
        setDays(daysRes.data ?? []);
        setSessions(sessionsRes.data ?? []);
        setMatches(matchesRes.data ?? []);
        setMatchHoles(matchHolesRes.data ?? []);
        setLocations(locationsRes.data ?? []);
        setPlayerYearStats(playerYearStatsRes.data ?? []);
        setActiveSessionId(appSettingsRes.data?.active_session_id ?? null);
        setAdminPin(appSettingsRes.data?.admin_pin ?? "2026");
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Klarte ikke å koble til Supabase");
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("matches-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          setMatches((current) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Match;
              if (current.some((m) => m.id === next.id)) return current;
              return [...current, next].sort((a, b) => a.sort_order - b.sort_order);
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Match;
              return current.map((m) => (m.id === next.id ? next : m));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Match;
              return current.filter((m) => m.id !== old.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("match-holes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_holes" },
        (payload) => {
          setMatchHoles((current) => {
            if (payload.eventType === "DELETE") {
              const old = payload.old as MatchHole;
              return current.filter((h) => !(h.match_id === old.match_id && h.hole_number === old.hole_number));
            }
            const next = payload.new as MatchHole;
            const exists = current.some((h) => h.match_id === next.match_id && h.hole_number === next.hole_number);
            if (exists) {
              return current.map((h) =>
                h.match_id === next.match_id && h.hole_number === next.hole_number ? next : h
              );
            }
            return [...current, next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("info-and-locations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        (payload) => {
          setLocations((current) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as MapLocation;
              if (current.some((l) => l.id === next.id)) return current;
              return [...current, next].sort((a, b) => a.sort_order - b.sort_order);
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as MapLocation;
              return current.map((l) => (l.id === next.id ? next : l));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as MapLocation;
              return current.filter((l) => l.id !== old.id);
            }
            return current;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => {
          const next = payload.new as { active_session_id: string | null; admin_pin: string };
          setActiveSessionId(next.active_session_id);
          setAdminPin(next.admin_pin);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "days" },
        (payload) => {
          const next = payload.new as Day;
          setDays((current) => current.map((d) => (d.id === next.id ? next : d)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateMatch = useCallback(async (id: string, patch: Partial<Match>) => {
    setMatches((current) => current.map((m) => (m.id === id ? { ...m, ...patch } : m)));

    const { error: updateError } = await supabase.from("matches").update(patch).eq("id", id);
    if (updateError) {
      setSyncError(updateError.message);
    }
  }, []);

  const setMatchHole = useCallback(
    async (
      match: Match,
      holeNumber: number,
      patch: { result?: HoleResult | null; score_vs_par?: number | null }
    ) => {
      const isMatchPlay = "result" in patch;
      const cleared = isMatchPlay ? patch.result == null : patch.score_vs_par == null;

      const filtered = matchHoles.filter((h) => !(h.match_id === match.id && h.hole_number === holeNumber));
      const row: MatchHole = {
        match_id: match.id,
        hole_number: holeNumber,
        result: patch.result ?? null,
        score_vs_par: patch.score_vs_par ?? null,
      };
      const nextHoles = cleared ? filtered : [...filtered, row];
      setMatchHoles(nextHoles);

      if (cleared) {
        const { error: deleteError } = await supabase
          .from("match_holes")
          .delete()
          .eq("match_id", match.id)
          .eq("hole_number", holeNumber);
        if (deleteError) setSyncError(deleteError.message);
      } else {
        const { error: upsertError } = await supabase
          .from("match_holes")
          .upsert(row, { onConflict: "match_id,hole_number" });
        if (upsertError) setSyncError(upsertError.message);
      }

      const holesForMatch = nextHoles.filter((h) => h.match_id === match.id);
      const derived = isMatchPlay
        ? deriveMatchPlayFromHoles(
            holesForMatch,
            match.points,
            // A match's starting head start only ever takes effect once its session is
            // the active one — otherwise a stray/early hole entry would prematurely
            // shift the season's projected score before the round has really begun.
            match.session_id === activeSessionId ? startingUpFor(match) : 0
          )
        : deriveScrambleFromHoles(holesForMatch);
      await updateMatch(match.id, derived);
    },
    [matchHoles, updateMatch, activeSessionId]
  );

  const updateLocationCoords = useCallback(async (id: string, lat: number, lng: number) => {
    setLocations((current) => current.map((l) => (l.id === id ? { ...l, lat, lng } : l)));
    const { error: updateError } = await supabase.from("locations").update({ lat, lng }).eq("id", id);
    if (updateError) {
      setSyncError(updateError.message);
    }
  }, []);

  const setActiveSession = useCallback(async (sessionId: string | null) => {
    setActiveSessionId(sessionId);
    const { error: updateError } = await supabase
      .from("app_settings")
      .update({ active_session_id: sessionId })
      .eq("id", "singleton");
    if (updateError) {
      setSyncError(updateError.message);
    }
  }, []);

  const updateAdminPin = useCallback(async (pin: string) => {
    setAdminPin(pin);
    const { error: updateError } = await supabase
      .from("app_settings")
      .update({ admin_pin: pin })
      .eq("id", "singleton");
    if (updateError) {
      setSyncError(updateError.message);
    }
  }, []);

  const resetAllMatches = useCallback(async () => {
    const reset = {
      result: "not_played" as MatchResult,
      points_gray: 0,
      points_aqua: 0,
      live_up: 0,
      live_thru: null,
      score_vs_par: null,
    };
    setMatches((current) => current.map((m) => ({ ...m, ...reset })));
    setMatchHoles([]);

    // matches.id is a uuid column, so a `!= ''` filter fails to cast and the update never
    // runs server-side (it looked like it worked locally, but nothing was actually reset).
    // `id IS NOT NULL` is always true for real rows without attempting any uuid cast.
    const { error: updateError } = await supabase.from("matches").update(reset).not("id", "is", null);
    if (updateError) {
      setSyncError(updateError.message);
    }
    const { error: holesError } = await supabase.from("match_holes").delete().not("match_id", "is", null);
    if (holesError) {
      setSyncError(holesError.message);
    }
  }, []);

  const updateSessionHandicap = useCallback(
    async (sessionId: string, team: TeamId | null, strokes: number | null) => {
      const patch = { handicap_team: team, handicap_strokes: team ? strokes : null };
      setSessions((current) => current.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)));

      const { error: updateError } = await supabase.from("sessions").update(patch).eq("id", sessionId);
      if (updateError) {
        setSyncError(updateError.message);
      }
    },
    []
  );

  const updateDayHideNames = useCallback(async (dayId: string, hide: boolean) => {
    setDays((current) => current.map((d) => (d.id === dayId ? { ...d, hide_names: hide } : d)));

    const { error: updateError } = await supabase.from("days").update({ hide_names: hide }).eq("id", dayId);
    if (updateError) {
      setSyncError(updateError.message);
    }
  }, []);

  const updateCompetitionWinner = useCallback(
    async (dayId: string, hole: number, winner: string) => {
      const day = days.find((d) => d.id === dayId);
      if (!day) return;

      const trimmed = winner.trim();
      const nextWinners: Record<string, string> = trimmed
        ? { ...day.competition_winners, [hole]: trimmed }
        : Object.fromEntries(Object.entries(day.competition_winners).filter(([h]) => h !== String(hole)));

      setDays((current) => current.map((d) => (d.id === dayId ? { ...d, competition_winners: nextWinners } : d)));

      const { error: updateError } = await supabase
        .from("days")
        .update({ competition_winners: nextWinners })
        .eq("id", dayId);
      if (updateError) {
        setSyncError(updateError.message);
      }
    },
    [days]
  );

  const value = useMemo(
    () => ({
      teams,
      players,
      days,
      sessions,
      matches,
      matchHoles,
      locations,
      playerYearStats,
      loading,
      error,
      syncError,
      clearSyncError,
      updateMatch,
      updateLocationCoords,
      resetAllMatches,
      activeSessionId,
      setActiveSession,
      updateSessionHandicap,
      updateDayHideNames,
      updateCompetitionWinner,
      adminPin,
      updateAdminPin,
      setMatchHole,
    }),
    [
      teams,
      players,
      days,
      sessions,
      matches,
      matchHoles,
      locations,
      playerYearStats,
      loading,
      error,
      syncError,
      clearSyncError,
      updateMatch,
      updateLocationCoords,
      resetAllMatches,
      activeSessionId,
      setActiveSession,
      updateSessionHandicap,
      updateDayHideNames,
      updateCompetitionWinner,
      adminPin,
      updateAdminPin,
      setMatchHole,
    ]
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament må brukes inne i TournamentProvider");
  return ctx;
}
