"use client";

import { useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { HoleResult, Match, Player, RESULT_LABELS, Session, TeamId } from "@/lib/types";
import {
  courseHoleNumber,
  greensomeTeamHandicap,
  HOLES_PER_MATCH,
  isFrontNine,
  liveLeader,
  liveUpLabel,
  matchMarginLabel,
  startingUpFor,
} from "@/lib/scoring";
import { getHoleInfo } from "@/lib/courseHoles";
import { computePlayerStats } from "@/lib/stats";
import { PlayerAvatar } from "./PlayerAvatar";
import { PlayerDetailModal } from "./PlayerDetailModal";
import { ModalShell } from "./ModalShell";

const HOLE_OPTIONS: { key: HoleResult; label: string }[] = [
  { key: "gray", label: "Grå" },
  { key: "halved", label: "Delt" },
  { key: "aqua", label: "Blå" },
];

function sidePlayers(match: Match, team: TeamId, players: Player[]) {
  const ids = team === "gray"
    ? [match.gray_player1, match.gray_player2]
    : [match.aqua_player1, match.aqua_player2];
  return ids
    .filter((id): id is string => !!id)
    .map((id) => {
      const player = players.find((p) => p.id === id);
      return { id, name: player?.name ?? id, course_strokes: player?.course_strokes ?? {} };
    });
}

function fmtPts(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** A pair's combined Greensome playing handicap, or null if either slot is empty or missing an hcp. */
function pairHandicap(id1: string | null, id2: string | null, players: Player[]): number | null {
  if (!id1 || !id2) return null;
  const hcp1 = players.find((p) => p.id === id1)?.hcp;
  const hcp2 = players.find((p) => p.id === id2)?.hcp;
  if (hcp1 == null || hcp2 == null) return null;
  return greensomeTeamHandicap(hcp1, hcp2);
}

export function MatchRow({
  match,
  players,
  session,
  hideNames = false,
}: {
  match: Match;
  players: Player[];
  session: Session;
  hideNames?: boolean;
}) {
  const { matchHoles, sessions, days, matches, activeSessionIds, setMatchHole } = useTournament();
  const [scoring, setScoring] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const isActiveSession = activeSessionIds.includes(session.id);

  // Each player's win-halved-loss record across the whole tournament so far, shown
  // next to their name/photo — recomputed here from all matches, not just this one.
  const playerStats = computePlayerStats(matches, players);
  function recordFor(playerId: string) {
    const s = playerStats.find((s) => s.player.id === playerId);
    return s && s.played > 0 ? `${s.wins}-${s.halved}-${s.losses}` : null;
  }

  // Genuinely blank (not just anonymized) so this falls back to the same generic
  // team-name display already used when a match has no named players at all.
  const grayPlayers = hideNames ? [] : sidePlayers(match, "gray", players);
  const aquaPlayers = hideNames ? [] : sidePlayers(match, "aqua", players);

  const frontNine = isFrontNine(session, sessions);
  const course = days.find((d) => d.id === session.day_id)?.course ?? null;
  const holeByNumber = new Map(
    matchHoles.filter((h) => h.match_id === match.id).map((h) => [h.hole_number, h.result])
  );
  // An uneven side (2 players vs 1) gets a 1-hole head start — shown as a fixed "Hull 0".
  const headStart = startingUpFor(match);

  // Greensome strokes received: only meaningful with a full pair on both sides, and only
  // ever shown alongside real names (see grayPlayers/aquaPlayers above) — so this stays
  // invisible on a hide_names day exactly like the pairings it would otherwise reveal.
  const grayPairHcp = session.format === "greensome" ? pairHandicap(match.gray_player1, match.gray_player2, players) : null;
  const aquaPairHcp = session.format === "greensome" ? pairHandicap(match.aqua_player1, match.aqua_player2, players) : null;
  const pairStrokeDiff =
    grayPairHcp !== null && aquaPairHcp !== null ? Math.round(grayPairHcp) - Math.round(aquaPairHcp) : null;
  const grayStrokesReceived = pairStrokeDiff !== null && pairStrokeDiff > 0 ? pairStrokeDiff : null;
  const aquaStrokesReceived = pairStrokeDiff !== null && pairStrokeDiff < 0 ? -pairStrokeDiff : null;

  const liveLeaderTeam = liveLeader(match.live_up);
  // Same live-leader color, but for use on the near-white editing panel below the result box.
  const liveColorOnLight =
    liveLeaderTeam === "gray"
      ? "text-ink"
      : liveLeaderTeam === "aqua"
        ? "text-aqua-team-deep"
        : "text-gold-deep";

  const isLiveInProgress = match.result === "not_played" && (match.live_up !== 0 || match.live_thru !== null);

  // A not-yet-started match in a round that isn't active has no hole results to show and no
  // way to enter any — the hole-by-hole grid would just be a wall of dashes, so skip it.
  const showHoleGrid = isActiveSession || match.result !== "not_played" || isLiveInProgress;

  const leadingSide: TeamId | null =
    match.result === "gray_won"
      ? "gray"
      : match.result === "aqua_won"
        ? "aqua"
        : match.result === "not_played"
          ? liveLeaderTeam
          : null;

  const marginBadgeText = match.result === "not_played"
    ? (isLiveInProgress ? liveUpLabel(match.live_up) : null)
    : matchMarginLabel(match.live_up, match.live_thru);

  // A halved match gets "A/S" beside both team names, same spot a win's margin goes beside the winner.
  function sideBadgeText(team: TeamId) {
    if (match.result === "halved") return "A/S";
    return leadingSide === team ? marginBadgeText : null;
  }

  // A match that hasn't started yet (no hole played) always shows its flat team colors —
  // the same as a not-played match in a non-active round — so a day's match list reads the
  // same regardless of which round happens to be active. Only a genuinely live-but-tied
  // match, or a halved one, goes neutral white/black instead: there, flat colors would
  // wrongly suggest a leader exists. Outside the active session, flat colors always win —
  // that's what keeps a day's full match list scannable at a glance.
  const isNotStarted = match.result === "not_played" && !isLiveInProgress;
  const isNeutral = isActiveSession && leadingSide === null && !isNotStarted;

  function sideBg(team: TeamId) {
    if (isNeutral) return "bg-white";
    // Deliberately far apart from the "won" fill below, so a decided/leading match reads
    // clearly different at a glance from one that's still all square. Only reached outside
    // the active session now (see isNeutral above), for a day's other, non-active rounds.
    const flat = team === "gray" ? "bg-gray-team-bg" : "bg-aqua-team-flat";
    const bold = team === "gray" ? "bg-gray-team-won" : "bg-aqua-team-won";
    if (leadingSide === null) return flat;
    // The trailing/losing side goes plain white — only the leading/winning team should show
    // any color at all, so the card doesn't compete for attention with a faint team tint.
    return leadingSide === team ? bold : "bg-white";
  }

  function sideText(team: TeamId) {
    if (isNeutral) return "text-ink";
    // Aqua's fill is always fairly saturated, so white text always wins there. Gray's flat
    // fill is light (needs dark ink), but its "won" fill is now dark enough to need white too.
    if (leadingSide !== null && leadingSide !== team) return "text-ink-light/30";
    if (team === "aqua") return "text-white";
    return leadingSide === team ? "text-white" : "text-ink";
  }

  return (
    <div
      className={`relative rounded-2xl border-2 bg-card shadow-sm transition hover:border-gold-deep/40 ${
        leadingSide === "gray"
          ? "border-gray-team"
          : leadingSide === "aqua"
            ? "border-aqua-team"
            : "border-card-border"
      }`}
    >
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/50 bg-navy-deep px-2 py-0.5 text-[10px] font-bold text-gold shadow">
        {fmtPts(match.points)}p
      </div>

      <div className="flex items-stretch overflow-hidden rounded-t-2xl">
        <div className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-3 sm:px-4 sm:py-4 ${sideBg("gray")}`}>
          {sideBadgeText("gray") && (
            <span className="shrink-0 rounded-full bg-navy-deep/60 px-2 py-1 text-sm font-extrabold text-white shadow-sm sm:text-base">
              {sideBadgeText("gray")}
            </span>
          )}
          <Image
            src="/logos/gray.png"
            alt=""
            width={24}
            height={24}
            className="hidden h-5 w-5 shrink-0 rounded-full object-cover opacity-80 sm:block sm:h-6 sm:w-6"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            {grayPlayers.length > 0 ? (
              <>
                {grayPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`flex w-full items-center gap-1 text-left text-[11px] font-bold uppercase leading-tight tracking-normal hover:underline sm:text-sm sm:tracking-wide ${sideText("gray")}`}
                  >
                    <PlayerAvatar playerId={p.id} size={16} className="h-4 w-4" />
                    <span className="min-w-0 truncate">
                      {p.name}
                      {/* Only before the match starts — once it's live or done, the scoring
                          modal below is the place to see strokes received. */}
                      {isNotStarted && grayStrokesReceived !== null && (
                        <span className="normal-case text-gold-deep"> (+{grayStrokesReceived})</span>
                      )}
                    </span>
                    {recordFor(p.id) && (
                      <span className="shrink-0 text-[9px] font-semibold normal-case tracking-normal opacity-60">
                        {recordFor(p.id)}
                      </span>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <span className={`text-xs font-bold uppercase tracking-wide sm:text-sm ${sideText("gray")}`}>
                Gray (Joys)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setScoring(true)}
          aria-label="Oppdater stilling"
          className={`flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-3 text-center transition hover:bg-navy-lighter sm:w-24 sm:py-4 ${
            match.result !== "not_played" || isLiveInProgress ? "bg-black" : "bg-navy-deep"
          }`}
        >
          {match.result !== "not_played" || isLiveInProgress ? (
            <span className="text-sm font-extrabold text-white sm:text-base">{match.live_thru}</span>
          ) : (
            <span className="text-xs font-bold text-foreground sm:text-sm">{match.start_time ?? "--:--"}</span>
          )}
        </button>

        <div
          className={`flex min-w-0 flex-1 items-center justify-end gap-2 px-3 py-3 text-right sm:px-4 sm:py-4 ${sideBg("aqua")}`}
        >
          <div className="flex min-w-0 flex-col items-end gap-0.5">
            {aquaPlayers.length > 0 ? (
              <>
                {aquaPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`flex w-full items-center justify-end gap-1 text-right text-[11px] font-bold uppercase leading-tight tracking-normal hover:underline sm:text-sm sm:tracking-wide ${sideText("aqua")}`}
                  >
                    {recordFor(p.id) && (
                      <span className="shrink-0 text-[9px] font-semibold normal-case tracking-normal opacity-60">
                        {recordFor(p.id)}
                      </span>
                    )}
                    <span className="min-w-0 truncate">
                      {p.name}
                      {isNotStarted && aquaStrokesReceived !== null && (
                        <span className="normal-case text-gold-deep"> (+{aquaStrokesReceived})</span>
                      )}
                    </span>
                    <PlayerAvatar playerId={p.id} size={16} className="h-4 w-4" />
                  </button>
                ))}
              </>
            ) : (
              <span className={`text-xs font-bold uppercase tracking-wide sm:text-sm ${sideText("aqua")}`}>
                Aquarellos
              </span>
            )}
          </div>
          <Image
            src="/logos/aquarellos.png"
            alt=""
            width={24}
            height={24}
            className="hidden h-5 w-5 shrink-0 rounded-full object-cover opacity-80 sm:block sm:h-6 sm:w-6"
          />
          {sideBadgeText("aqua") && (
            <span className="shrink-0 rounded-full bg-navy-deep/60 px-2 py-1 text-sm font-extrabold text-white shadow-sm sm:text-base">
              {sideBadgeText("aqua")}
            </span>
          )}
        </div>
      </div>

      {match.note && (
        <div className="p-3">
          <p className="text-[11px] italic text-ink-light/60">⚠ {match.note}</p>
        </div>
      )}

      {scoring && (
        <ModalShell
          title={isActiveSession && match.result === "not_played" ? "Oppdater stilling" : "Stilling"}
          onClose={() => setScoring(false)}
        >
          <div className="space-y-5">
            <div className="text-center">
              {grayPlayers.length > 0 || aquaPlayers.length > 0 ? (
                <div className="mb-3 flex items-start justify-center gap-3">
                  <div className="flex gap-2">
                    {grayPlayers.map((p) => (
                      <div key={p.id} className="flex flex-col items-center gap-1">
                        <PlayerAvatar playerId={p.id} size={64} className="h-16 w-16" alwaysOn />
                        <span className="max-w-[68px] truncate text-[10px] font-bold uppercase text-ink">
                          {p.name}
                        </span>
                        {course && p.course_strokes[course] !== undefined && (
                          <span className="text-[9px] font-semibold text-gold-deep">
                            HCP: {p.course_strokes[course]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {grayPlayers.length > 0 && aquaPlayers.length > 0 && (
                    <span className="mt-6 shrink-0 text-[10px] font-bold text-ink-light/40">VS</span>
                  )}
                  <div className="flex gap-2">
                    {aquaPlayers.map((p) => (
                      <div key={p.id} className="flex flex-col items-center gap-1">
                        <PlayerAvatar playerId={p.id} size={64} className="h-16 w-16" alwaysOn />
                        <span className="max-w-[68px] truncate text-[10px] font-bold uppercase text-ink">
                          {p.name}
                        </span>
                        {course && p.course_strokes[course] !== undefined && (
                          <span className="text-[9px] font-semibold text-gold-deep">
                            HCP: {p.course_strokes[course]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-light">
                  Gray vs Aqua
                </p>
              )}
              {(grayStrokesReceived !== null || aquaStrokesReceived !== null) && (
                <p className="mb-2 text-xs font-semibold text-gold-deep">
                  {grayStrokesReceived !== null
                    ? `Gray mottar ${grayStrokesReceived} slag`
                    : `Aqua mottar ${aquaStrokesReceived} slag`}
                </p>
              )}
              <p className={`mt-1 font-display text-2xl font-bold ${match.result === "not_played" ? liveColorOnLight : "text-ink"}`}>
                {match.result !== "not_played"
                  ? RESULT_LABELS[match.result]
                  : isLiveInProgress
                    ? `${liveLeaderTeam === "gray" ? "GRAY " : liveLeaderTeam === "aqua" ? "AQUA " : ""}${liveUpLabel(match.live_up)}`
                    : "Ikke startet"}
              </p>
            </div>

            {showHoleGrid && (
              <>
                <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-x-0.5 border-spacing-y-1 text-center">
                <tbody>
                  <tr>
                    <td className="w-9 pr-1 text-left text-[9px] font-semibold uppercase tracking-wide text-ink-light/70">
                      Hull
                    </td>
                    {headStart !== 0 && <td className="text-[11px] font-bold text-ink-light/70">0</td>}
                    {Array.from({ length: HOLES_PER_MATCH }, (_, i) => i + 1).map((relHole) => (
                      <td key={relHole} className="text-[11px] font-bold text-ink">
                        {courseHoleNumber(relHole, frontNine)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="pr-1 text-left text-[9px] font-semibold uppercase tracking-wide text-ink-light/70">
                      Par
                    </td>
                    {headStart !== 0 && <td className="text-[10px] text-ink-light/40">–</td>}
                    {Array.from({ length: HOLES_PER_MATCH }, (_, i) => i + 1).map((relHole) => (
                      <td key={relHole} className="text-[10px] text-ink-light">
                        {getHoleInfo(course, courseHoleNumber(relHole, frontNine)).par ?? "–"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="pr-1 text-left text-[9px] font-semibold uppercase tracking-wide text-ink-light/70">
                      Idx
                    </td>
                    {headStart !== 0 && <td className="text-[10px] text-ink-light/40">–</td>}
                    {Array.from({ length: HOLES_PER_MATCH }, (_, i) => i + 1).map((relHole) => (
                      <td key={relHole} className="text-[10px] text-ink-light/70">
                        {getHoleInfo(course, courseHoleNumber(relHole, frontNine)).index ?? "–"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td />
                    {headStart !== 0 && (
                      <td>
                        <div
                          title={
                            headStart > 0
                              ? "Gray starter 1 opp (ujevnt lag)"
                              : "Aqua starter 1 opp (ujevnt lag)"
                          }
                          className={`flex h-16 w-8 items-center justify-center rounded border text-[8px] font-bold uppercase leading-none ${
                            headStart > 0
                              ? "border-gray-team bg-gray-team-bg text-ink"
                              : "border-aqua-team bg-aqua-team-deep text-white"
                          }`}
                        >
                          {headStart > 0 ? "Grå" : "Blå"}
                        </div>
                      </td>
                    )}
                    {Array.from({ length: HOLES_PER_MATCH }, (_, i) => i + 1).map((relHole) => {
                      const result = holeByNumber.get(relHole) ?? null;
                      return (
                        <td key={relHole}>
                          <div className="flex flex-col gap-0.5">
                            {HOLE_OPTIONS.map((opt) => {
                              const active = result === opt.key;
                              const activeClass =
                                opt.key === "gray"
                                  ? "border-gray-team bg-gray-team-bg text-ink"
                                  : opt.key === "aqua"
                                    ? "border-aqua-team bg-aqua-team-deep text-white"
                                    : "border-gold-deep bg-gold/20 text-gold-deep";
                              // Even unpressed, each button carries a faint tint of its own color
                              // so the three options stay visually distinct before you pick one.
                              const inactiveClass =
                                opt.key === "gray"
                                  ? "border-card-border bg-gray-team-bg/30 text-ink-light/50 hover:bg-gray-team-bg/50"
                                  : opt.key === "aqua"
                                    ? "border-card-border bg-aqua-team-light/25 text-ink-light/50 hover:bg-aqua-team-light/40"
                                    : "border-card-border bg-gold/15 text-ink-light/50 hover:bg-gold/25";
                              return (
                                <button
                                  key={opt.key}
                                  disabled={!isActiveSession}
                                  onClick={() => setMatchHole(match, relHole, { result: active ? null : opt.key })}
                                  aria-label={`Hull ${courseHoleNumber(relHole, frontNine)} ${opt.label}`}
                                  className={`h-5 w-8 rounded border text-[8px] font-bold uppercase leading-none transition ${
                                    active ? activeClass : inactiveClass
                                  } ${isActiveSession ? "" : "cursor-default"}`}
                                >
                                  {opt.label[0]}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
                </div>

                <p className="text-center text-xs text-ink-light/60">
                  {isActiveSession
                    ? "Velg Grå, Delt eller Blå for hvert hull. Stillingen regnes ut automatisk."
                    : "Kun visning – denne runden er ikke aktiv."}
                  {headStart !== 0 && (
                    <>
                      {" "}
                      Hull 0 er forspranget {headStart > 0 ? "Gray" : "Aqua"} får for å spille én spiller kort.
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </ModalShell>
      )}

      {selectedPlayerId && (
        <PlayerDetailModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
      )}
    </div>
  );
}
