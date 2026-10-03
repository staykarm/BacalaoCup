"use client";

import { useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { usePlayerModal } from "@/context/PlayerModalContext";
import { courseHoleNumber, HOLES_PER_MATCH, isFrontNine, scrambleProjectedResult } from "@/lib/scoring";
import { getHoleInfo } from "@/lib/courseHoles";
import { Match, Player, Session, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmtVsPar(n: number | null) {
  if (n === null) return "–";
  if (n === 0) return "PAR";
  return n > 0 ? `+${n}` : `${n}`;
}

/** Eagle-or-better: yellow/white. Birdie: red/white. Par: black on white. Bogey: white on black. Double-or-worse: white on purple. */
function scoreCellClass(relative: number | null): string {
  if (relative === null) return "border-card-border bg-white text-ink-light/30";
  if (relative <= -2) return "border-transparent bg-yellow-500 text-white";
  if (relative === -1) return "border-transparent bg-red-600 text-white";
  if (relative === 0) return "border-card-border bg-white text-ink";
  if (relative === 1) return "border-transparent bg-black text-white";
  return "border-transparent bg-purple-700 text-white";
}

/** A running (or final) vs-par total: under par is white on red, par is black on white, over par is white on black. */
function vsParTotalClass(n: number | null): string {
  if (n === null) return "border border-card-border bg-white text-ink-light/40";
  if (n < 0) return "border-transparent bg-red-600 text-white";
  if (n === 0) return "border border-card-border bg-white text-ink";
  return "border-transparent bg-black text-white";
}

/**
 * Same leading/trailing treatment as a regular match card: flat team colors before
 * anyone's ahead, the leader gets its bold "won" fill, the trailing side goes plain
 * white, and a genuine live tie goes neutral white on both sides.
 */
function totalBg(team: TeamId, leadingSide: TeamId | null, isNeutral: boolean): string {
  if (isNeutral) return "bg-white";
  const flat = team === "gray" ? "bg-gray-team-bg" : "bg-aqua-team-flat";
  const bold = team === "gray" ? "bg-gray-team-won" : "bg-aqua-team-won";
  if (leadingSide === null) return flat;
  return leadingSide === team ? bold : "bg-white";
}

function totalText(team: TeamId, leadingSide: TeamId | null, isNeutral: boolean): string {
  if (isNeutral) return "text-ink";
  if (leadingSide !== null && leadingSide !== team) return "text-ink-light/40";
  if (team === "aqua") return "text-white";
  return leadingSide === team ? "text-white" : "text-ink";
}

function FlightRow({
  flight,
  players,
  hideNames,
  onClick,
  onSelectPlayer,
}: {
  flight: Match;
  players: Player[];
  hideNames: boolean;
  onClick: () => void;
  onSelectPlayer: (playerId: string) => void;
}) {
  const team = flight.flight_team as TeamId;
  // Same flat team fills MatchRow uses for its "not yet decided" state, so a scramble
  // flight reads as clearly gray/blue as any other day's match card.
  const bg = team === "gray" ? "bg-gray-team-bg" : "bg-aqua-team-flat";
  const text = team === "gray" ? "text-ink" : "text-white";
  const flightPlayers = hideNames
    ? []
    : flight.flight_players.map((id) => ({ id, name: players.find((p) => p.id === id)?.name ?? id }));
  const started = flight.live_thru !== null;

  return (
    <div className="flex w-full items-stretch overflow-hidden rounded-2xl border-2 border-card-border bg-card shadow-sm transition hover:border-gold-deep/40">
      <div className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-3 sm:px-4 sm:py-4 ${bg}`}>
        <Image
          src={team === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
          alt=""
          width={24}
          height={24}
          className="h-5 w-5 shrink-0 rounded-full object-cover opacity-80 sm:h-6 sm:w-6"
        />
        <div className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase leading-tight tracking-normal sm:text-sm sm:tracking-wide">
          {flightPlayers.length > 0 ? (
            flightPlayers.map((p, i) => (
              <span key={p.id}>
                {i > 0 && " / "}
                <button onClick={() => onSelectPlayer(p.id)} className={`hover:underline ${text}`}>
                  {p.name}
                </button>
              </span>
            ))
          ) : (
            <span className={text}>{team === "gray" ? "Gray (Joys)" : "Aquarellos"}</span>
          )}
        </div>
      </div>

      {/* Same dark time/hole box as a regular match-play card: tee time until the flight
          tees off, then the hole it's reached once a score starts coming in. */}
      <button
        onClick={onClick}
        aria-label="Oppdater scramble-score"
        className={`flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-3 text-center transition hover:brightness-110 sm:w-24 sm:py-4 ${
          started ? "bg-black" : "bg-navy-deep"
        }`}
      >
        {started ? (
          <span className="text-sm font-extrabold text-white sm:text-base">{flight.live_thru}</span>
        ) : (
          <span className="text-xs font-bold text-foreground sm:text-sm">{flight.start_time ?? "--:--"}</span>
        )}
      </button>

      <div className="flex shrink-0 items-center justify-center bg-card px-2 sm:px-3">
        <span
          className={`inline-flex min-w-[2.75rem] items-center justify-center rounded-lg px-2 py-1 font-display text-sm font-bold sm:text-base ${vsParTotalClass(
            flight.score_vs_par
          )}`}
        >
          {fmtVsPar(flight.score_vs_par)}
        </span>
      </div>
    </div>
  );
}

export function ScrambleFlights({
  session,
  matches,
  players,
  hideNames = false,
}: {
  session: Session;
  matches: Match[];
  players: Player[];
  hideNames?: boolean;
}) {
  const { matchHoles, sessions, days, activeSessionIds, setMatchHole } = useTournament();
  const { openPlayer } = usePlayerModal();
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const isActiveSession = activeSessionIds.includes(session.id);
  // Re-derived from the live `matches` prop every render, not a captured snapshot, so the
  // modal's totals stay in sync as holes are entered instead of freezing at open-time.
  // Not gated by isActiveSession — a finished or live flight can still be opened read-only.
  const editingFlight = matches.find((m) => m.id === editingFlightId) ?? null;

  const flights = [...matches].sort((a, b) => a.sort_order - b.sort_order);
  // Live combined score, usable as soon as any flight has teed off — once every flight
  // is finished this agrees exactly with scrambleResult's own totals.
  const live = scrambleProjectedResult(matches, session);
  const leadingSide: TeamId | null = live.started ? live.winner : null;
  // A genuine live tie goes neutral white on both sides, same as a tied match-play match —
  // distinct from "not started yet", which keeps each side's own flat team color instead.
  const isNeutral = live.started && live.winner === null;

  const frontNine = isFrontNine(session, sessions);
  const course = days.find((d) => d.id === session.day_id)?.course ?? null;
  const holesForFlight = editingFlight
    ? new Map(matchHoles.filter((h) => h.match_id === editingFlight.id).map((h) => [h.hole_number, h.score_vs_par]))
    : new Map<number, number | null>();

  function onStrokesChange(relHole: number, raw: string) {
    if (!editingFlight) return;
    const info = getHoleInfo(course, courseHoleNumber(relHole, frontNine));
    if (raw === "") {
      setMatchHole(editingFlight, relHole, { score_vs_par: null });
      return;
    }
    if (info.par === null || !/^\d+$/.test(raw)) return;
    setMatchHole(editingFlight, relHole, { score_vs_par: Number(raw) - info.par });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl px-3 py-2 text-center ${totalBg("gray", leadingSide, isNeutral)}`}>
          <p
            className={`flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide ${totalText("gray", leadingSide, isNeutral)}`}
          >
            <Image src="/logos/gray.png" alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded-full object-cover" />
            Gray (Joys)
          </p>
          <p className={`mt-1 inline-flex min-w-[3rem] items-center justify-center rounded-lg px-2 py-1 font-display text-lg font-bold ${vsParTotalClass(live.started ? live.grayTotal : null)}`}>
            {fmtVsPar(live.started ? live.grayTotal : null)}
          </p>
        </div>
        <div className={`rounded-xl px-3 py-2 text-center ${totalBg("aqua", leadingSide, isNeutral)}`}>
          <p
            className={`flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide ${totalText("aqua", leadingSide, isNeutral)}`}
          >
            <Image src="/logos/aquarellos.png" alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded-full object-cover" />
            Aquarellos
          </p>
          <p className={`mt-1 inline-flex min-w-[3rem] items-center justify-center rounded-lg px-2 py-1 font-display text-lg font-bold ${vsParTotalClass(live.started ? live.aquaTotal : null)}`}>
            {fmtVsPar(live.started ? live.aquaTotal : null)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {flights.map((f) => (
          <FlightRow
            key={f.id}
            flight={f}
            players={players}
            hideNames={hideNames}
            onClick={() => setEditingFlightId(f.id)}
            onSelectPlayer={openPlayer}
          />
        ))}
      </div>

      {editingFlight && (
        <ModalShell title="Scramble-score" onClose={() => setEditingFlightId(null)}>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">
                {!hideNames && editingFlight.flight_players.length > 0 ? (
                  editingFlight.flight_players.map((id, i) => {
                    const p = players.find((pp) => pp.id === id);
                    return (
                      <span key={id}>
                        {i > 0 && " / "}
                        <button onClick={() => openPlayer(id)} className="hover:underline">
                          {p?.name ?? id}
                        </button>
                      </span>
                    );
                  })
                ) : editingFlight.flight_team === "gray" ? (
                  "Gray (Joys)"
                ) : (
                  "Aquarellos"
                )}{" "}
                &middot; {editingFlight.start_time ?? "--:--"}
              </p>
              <p className="font-display text-3xl font-bold text-ink">{fmtVsPar(editingFlight.score_vs_par)}</p>
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
                    <td />
                    {Array.from({ length: HOLES_PER_MATCH }, (_, i) => i + 1).map((relHole) => {
                      const par = getHoleInfo(course, courseHoleNumber(relHole, frontNine)).par;
                      const relative = holesForFlight.get(relHole) ?? null;
                      const strokes = par !== null && relative !== null ? par + relative : null;
                      return (
                        <td key={relHole}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            disabled={par === null || !isActiveSession}
                            value={strokes ?? ""}
                            onChange={(e) => onStrokesChange(relHole, e.target.value.replace(/[^0-9]/g, ""))}
                            aria-label={`Hull ${courseHoleNumber(relHole, frontNine)} slag`}
                            className={`h-8 w-8 rounded-lg border text-center text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-gold-deep/60 disabled:opacity-40 ${scoreCellClass(relative)}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-center text-xs text-ink-light/60">
              {isActiveSession
                ? "Skriv inn antall slag for hvert hull — over/under par regnes ut automatisk."
                : "Kun visning – denne runden er ikke aktiv."}
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
