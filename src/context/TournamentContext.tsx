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
import { pointsForResult } from "@/lib/scoring";
import {
  Day,
  InfoPage,
  InfoPageId,
  LocationType,
  MapLocation,
  Match,
  MatchResult,
  Message,
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
  messages: Message[];
  infoPages: InfoPage[];
  locations: MapLocation[];
  playerYearStats: PlayerYearStat[];
  loading: boolean;
  error: string | null;
  /** A background save (not the initial load) failed, e.g. a dropped connection while live-scoring. */
  syncError: string | null;
  clearSyncError: () => void;
  updateMatch: (id: string, patch: Partial<Match>) => Promise<void>;
  setMatchResult: (id: string, result: MatchResult) => Promise<void>;
  postMessage: (author: string, body: string) => Promise<void>;
  updateInfoPage: (id: InfoPageId, content: string) => Promise<void>;
  addLocation: (type: LocationType, name: string, address: string | null, notes: string | null) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  updateLocationCoords: (id: string, lat: number, lng: number) => Promise<void>;
  /** Admin: resets every match back to not-played with no live score or result. */
  resetAllMatches: () => Promise<void>;
  /** Admin: which round is marked "- pågår" in the UI. Purely informational — doesn't restrict editing. */
  activeSessionId: string | null;
  setActiveSession: (sessionId: string | null) => Promise<void>;
  /** Admin: scramble-only team stroke handicap for a session. Pass team=null to clear it. */
  updateSessionHandicap: (sessionId: string, team: TeamId | null, strokes: number | null) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [infoPages, setInfoPages] = useState<InfoPage[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [playerYearStats, setPlayerYearStats] = useState<PlayerYearStat[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
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
          messagesRes,
          infoPagesRes,
          locationsRes,
          playerYearStatsRes,
          appSettingsRes,
        ] = await Promise.all([
          supabase.from("teams").select("*"),
          supabase.from("players").select("*"),
          supabase.from("days").select("*").order("sort_order"),
          supabase.from("sessions").select("*").order("sort_order"),
          supabase.from("matches").select("*").order("sort_order"),
          supabase.from("messages").select("*").order("created_at"),
          supabase.from("info_pages").select("*"),
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
          messagesRes.error ||
          infoPagesRes.error ||
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
        setMessages(messagesRes.data ?? []);
        setInfoPages(infoPagesRes.data ?? []);
        setLocations(locationsRes.data ?? []);
        setPlayerYearStats(playerYearStatsRes.data ?? []);
        setActiveSessionId(appSettingsRes.data?.active_session_id ?? null);
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
      .channel("messages-and-info-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          setMessages((current) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Message;
              if (current.some((m) => m.id === next.id)) return current;
              return [...current, next].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Message;
              return current.filter((m) => m.id !== old.id);
            }
            return current;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "info_pages" },
        (payload) => {
          const next = payload.new as InfoPage;
          setInfoPages((current) => current.map((p) => (p.id === next.id ? next : p)));
        }
      )
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
          const next = payload.new as { active_session_id: string | null };
          setActiveSessionId(next.active_session_id);
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

  const setMatchResult = useCallback(
    async (id: string, result: MatchResult) => {
      const match = matches.find((m) => m.id === id);
      if (!match) return;
      const { points_gray, points_aqua } = pointsForResult(result, match.points);
      await updateMatch(id, { result, points_gray, points_aqua });
    },
    [matches, updateMatch]
  );

  const postMessage = useCallback(async (author: string, body: string) => {
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({ author, body })
      .select()
      .single();
    if (insertError) {
      setSyncError(insertError.message);
      return;
    }
    if (data) {
      setMessages((current) => (current.some((m) => m.id === data.id) ? current : [...current, data]));
    }
  }, []);

  const updateInfoPage = useCallback(async (id: InfoPageId, content: string) => {
    setInfoPages((current) => current.map((p) => (p.id === id ? { ...p, content } : p)));

    const { error: updateError } = await supabase
      .from("info_pages")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      setSyncError(updateError.message);
    }
  }, []);

  const addLocation = useCallback(
    async (type: LocationType, name: string, address: string | null, notes: string | null) => {
      const sort_order = locations.filter((l) => l.type === type).length;
      const { data, error: insertError } = await supabase
        .from("locations")
        .insert({ type, name, address, notes, sort_order })
        .select()
        .single();
      if (insertError) {
        setSyncError(insertError.message);
        return;
      }
      if (data) {
        setLocations((current) => (current.some((l) => l.id === data.id) ? current : [...current, data]));
      }
    },
    [locations]
  );

  const deleteLocation = useCallback(async (id: string) => {
    setLocations((current) => current.filter((l) => l.id !== id));
    const { error: deleteError } = await supabase.from("locations").delete().eq("id", id);
    if (deleteError) {
      setSyncError(deleteError.message);
    }
  }, []);

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

    const { error: updateError } = await supabase.from("matches").update(reset).neq("id", "");
    if (updateError) {
      setSyncError(updateError.message);
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

  const value = useMemo(
    () => ({
      teams,
      players,
      days,
      sessions,
      matches,
      messages,
      infoPages,
      locations,
      playerYearStats,
      loading,
      error,
      syncError,
      clearSyncError,
      updateMatch,
      setMatchResult,
      postMessage,
      updateInfoPage,
      addLocation,
      deleteLocation,
      updateLocationCoords,
      resetAllMatches,
      activeSessionId,
      setActiveSession,
      updateSessionHandicap,
    }),
    [
      teams,
      players,
      days,
      sessions,
      matches,
      messages,
      infoPages,
      locations,
      playerYearStats,
      loading,
      error,
      syncError,
      clearSyncError,
      updateMatch,
      setMatchResult,
      postMessage,
      updateInfoPage,
      addLocation,
      deleteLocation,
      updateLocationCoords,
      resetAllMatches,
      activeSessionId,
      setActiveSession,
      updateSessionHandicap,
    ]
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament må brukes inne i TournamentProvider");
  return ctx;
}
