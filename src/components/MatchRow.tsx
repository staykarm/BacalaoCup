"use client";

import { useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { HoleResult, Match, Player, RESULT_LABELS, Session, TeamId } from "@/lib/types";
import { courseHoleNumber, HOLES_PER_MATCH, isFrontNine, liveLeader, liveUpLabel, matchMarginLabel } from "@/lib/scoring";
import { getHoleInfo } from "@/lib/courseHoles";
import { PlayerDetailModal } from "./PlayerDetailModal";
import { ModalShell } from "./ModalShell";

const HOLE_RESULT_CYCLE: (HoleResult | null)[] = [null, "gray", "halved", "aqua"];

function nextHoleResult(current: HoleResult | null): HoleResult | null {
  const idx = HOLE_RESULT_CYCLE.indexOf(current);
  return HOLE_RESULT_CYCLE[(idx + 1) % HOLE_RESULT_CYCLE.length];
}

function sidePlayers(match: Match, team: TeamId, players: Player[]) {
  const ids = team === "gray"
    ? [match.gray_player1, match.gray_player2]
    : [match.aqua_player1, match.aqua_player2];
  return ids
    .filter((id): id is string => !!id)
    .map((id) => ({ id, name: players.find((p) => p.id === id)?.name ?? id }));
}

function fmtPts(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function MatchRow({ match, players, session }: { match: Match; players: Player[]; session: Session }) {
  const { matchHoles, sessions, days, setMatchHole } = useTournament();
  const [scoring, setScoring] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const grayPlayers = sidePlayers(match, "gray", players);
  const aquaPlayers = sidePlayers(match, "aqua", players);

  const frontNine = isFrontNine(session, sessions);
  const course = days.find((d) => d.id === session.day_id)?.course ?? null;
  const holeByNumber = new Map(
    matchHoles.filter((h) => h.match_id === match.id).map((h) => [h.hole_number, h.result])
  );

  function cycleHole(relativeHole: number) {
    const next = nextHoleResult(holeByNumber.get(relativeHole) ?? null);
    setMatchHole(match, relativeHole, { result: next });
  }

  const liveLeaderTeam = liveLeader(match.live_up);
  const liveColor =
    liveLeaderTeam === "gray"
      ? "text-gray-team-light"
      : liveLeaderTeam === "aqua"
        ? "text-aqua-team-light"
        : "text-gold";
  // Same live-leader color, but for use on the near-white editing panel below the result box.
  const liveColorOnLight =
    liveLeaderTeam === "gray"
      ? "text-ink"
      : liveLeaderTeam === "aqua"
        ? "text-aqua-team-deep"
        : "text-gold-deep";

  // This pill sits on the (now near-white) card body, so it needs readable-on-light colors,
  // even though it's still deliberately team/result-colored per side.
  const resultColor =
    match.result === "gray_won"
      ? "border-gray-team text-ink"
      : match.result === "aqua_won"
        ? "border-aqua-team text-aqua-team-deep"
        : match.result === "halved"
          ? "border-gold-deep text-gold-deep"
          : "border-card-border text-ink-light/60";

  const isLiveInProgress = match.result === "not_played" && (match.live_up !== 0 || match.live_thru !== null);

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

  function sideBg(team: TeamId) {
    const flat = team === "gray" ? "bg-gray-team-bg" : "bg-aqua-team-bg";
    const bold =
      team === "gray"
        ? "bg-gradient-to-br from-gray-team-bg to-gray-team-deep"
        : "bg-gradient-to-br from-aqua-team-bg to-aqua-team-deep";
    if (leadingSide === null) return flat;
    // The trailing/losing side fades to near-white so it blends into the card instead of competing for attention.
    return leadingSide === team ? bold : "bg-card";
  }

  function sideText(team: TeamId) {
    // Gray's fill is a light gray, so it needs dark ink text; Aqua's fill stays dark, so white gives the strongest contrast.
    const base = team === "gray" ? "text-ink" : "text-white";
    return leadingSide === null || leadingSide === team ? base : "text-ink-light/30";
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
              grayPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`truncate text-left text-xs font-bold uppercase tracking-wide hover:underline sm:text-sm ${sideText("gray")}`}
                >
                  {p.name}
                </button>
              ))
            ) : (
              <span className={`truncate text-xs font-bold uppercase tracking-wide sm:text-sm ${sideText("gray")}`}>
                Gray (Joys)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setScoring(true)}
          aria-label="Oppdater stilling"
          className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 bg-navy-deep px-1 py-3 text-center transition hover:bg-navy-lighter sm:w-24 sm:py-4"
        >
          {match.result !== "not_played" ? (
            <span className="text-sm font-extrabold text-foreground/70 sm:text-base">F</span>
          ) : isLiveInProgress ? (
            <>
              <span className={`text-xs font-extrabold sm:text-sm ${liveColor}`}>
                {liveLeaderTeam === "gray" && "GRAY "}
                {liveLeaderTeam === "aqua" && "AQUA "}
                {liveUpLabel(match.live_up)}
              </span>
              {match.live_thru !== null && (
                <span className="text-[9px] font-semibold text-foreground/50 sm:text-[10px]">
                  THRU {match.live_thru}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-bold text-foreground sm:text-sm">{match.start_time ?? "--:--"}</span>
          )}
        </button>

        <div
          className={`flex min-w-0 flex-1 items-center justify-end gap-2 px-3 py-3 text-right sm:px-4 sm:py-4 ${sideBg("aqua")}`}
        >
          <div className="flex min-w-0 flex-col items-end gap-0.5">
            {aquaPlayers.length > 0 ? (
              aquaPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`truncate text-right text-xs font-bold uppercase tracking-wide hover:underline sm:text-sm ${sideText("aqua")}`}
                >
                  {p.name}
                </button>
              ))
            ) : (
              <span className={`truncate text-xs font-bold uppercase tracking-wide sm:text-sm ${sideText("aqua")}`}>
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

      {(match.result !== "not_played" || match.note) && (
        <div className="p-3">
          {match.result !== "not_played" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${resultColor}`}>
                {RESULT_LABELS[match.result]} · Gray {fmtPts(match.points_gray)} – {fmtPts(match.points_aqua)} Aqua
              </span>
            </div>
          )}

          {match.note && (
            <p className={`text-[11px] italic text-ink-light/60 ${match.result !== "not_played" ? "mt-2" : ""}`}>
              ⚠ {match.note}
            </p>
          )}
        </div>
      )}

      {scoring && (
        <ModalShell title="Oppdater stilling" onClose={() => setScoring(false)}>
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">
                {(grayPlayers.map((p) => p.name).join(" / ") || "Gray")} vs{" "}
                {(aquaPlayers.map((p) => p.name).join(" / ") || "Aqua")}
              </p>
              <p className={`mt-1 font-display text-2xl font-bold ${match.result === "not_played" ? liveColorOnLight : "text-ink"}`}>
                {match.result !== "not_played"
                  ? RESULT_LABELS[match.result]
                  : isLiveInProgress
                    ? `${liveLeaderTeam === "gray" ? "GRAY " : liveLeaderTeam === "aqua" ? "AQUA " : ""}${liveUpLabel(match.live_up)}`
                    : "Ikke startet"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-x-0.5 border-spacing-y-1 text-center">
                <tbody>
                  <tr>
                    <td className="w-9 pr-1 text-left text-[9px] font-semibold uppercase tracking-wide text-ink-light/70">
                      Hull
                    </td>
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
                    {Array.from({ length: HOLES_PER_MATCH }, (_, i) => i + 1).map((relHole) => (
                      <td key={relHole} className="text-[10px] text-ink-light/70">
                        {getHoleInfo(course, courseHoleNumber(relHole, frontNine)).index ?? "–"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td />
                    {Array.from({ length: HOLES_PER_MATCH }, (_, i) => i + 1).map((relHole) => {
                      const result = holeByNumber.get(relHole) ?? null;
                      const label = result === "gray" ? "G" : result === "aqua" ? "A" : result === "halved" ? "½" : "–";
                      const colorClass =
                        result === "gray"
                          ? "border-gray-team bg-gray-team-bg text-ink"
                          : result === "aqua"
                            ? "border-aqua-team bg-aqua-team-deep text-white"
                            : result === "halved"
                              ? "border-gold-deep bg-gold/20 text-gold-deep"
                              : "border-card-border bg-white text-ink-light/30";
                      return (
                        <td key={relHole}>
                          <button
                            onClick={() => cycleHole(relHole)}
                            aria-label={`Hull ${courseHoleNumber(relHole, frontNine)}`}
                            className={`h-8 w-8 rounded-lg border text-xs font-bold transition ${colorClass}`}
                          >
                            {label}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-center text-xs text-ink-light/60">
              Trykk et hull for å bla mellom Gray, delt og Aqua. Stillingen regnes ut automatisk.
            </p>
          </div>
        </ModalShell>
      )}

      {selectedPlayerId && (
        <PlayerDetailModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
      )}
    </div>
  );
}
