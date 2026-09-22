"use client";

import { useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { courseHoleNumber, HOLES_PER_MATCH, isFrontNine, scrambleResult } from "@/lib/scoring";
import { getHoleInfo } from "@/lib/courseHoles";
import { Match, Session, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmtVsPar(n: number | null) {
  if (n === null) return "–";
  if (n === 0) return "PAR";
  return n > 0 ? `+${n}` : `${n}`;
}

/** Eagle-or-better: yellow/white. Birdie: red/white. Par: black on white. Bogey: white on blue. Double-or-worse: white on black. */
function scoreCellClass(relative: number | null): string {
  if (relative === null) return "border-card-border bg-white text-ink-light/30";
  if (relative <= -2) return "border-transparent bg-yellow-500 text-white";
  if (relative === -1) return "border-transparent bg-red-600 text-white";
  if (relative === 0) return "border-card-border bg-white text-ink";
  if (relative === 1) return "border-transparent bg-blue-700 text-white";
  return "border-transparent bg-black text-white";
}

function FlightRow({ flight, active, onClick }: { flight: Match; active: boolean; onClick: () => void }) {
  const team = flight.flight_team as TeamId;
  return (
    <button
      onClick={() => active && onClick()}
      disabled={!active}
      className={`flex w-full items-center gap-3 rounded-xl border border-card-border bg-white px-3 py-2.5 text-left ${
        active ? "hover:border-gold-deep/40" : "cursor-default opacity-60"
      }`}
    >
      <Image
        src={team === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px] shrink-0 rounded-full object-cover"
      />
      <span className="flex-1 text-sm text-ink-light">{flight.start_time ?? "--:--"}</span>
      <span
        className={`font-display text-lg font-bold ${flight.score_vs_par === null ? "text-ink-light/40" : "text-ink"}`}
      >
        {fmtVsPar(flight.score_vs_par)}
      </span>
      <span className="text-[11px] text-ink-light/60">{flight.live_thru !== null ? `Hull ${flight.live_thru}` : ""}</span>
    </button>
  );
}

export function ScrambleFlights({ session, matches }: { session: Session; matches: Match[] }) {
  const { matchHoles, sessions, days, activeSessionId, setMatchHole } = useTournament();
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const isActiveSession = session.id === activeSessionId;
  // Re-derived from the live `matches` prop every render, not a captured snapshot, so the
  // modal's totals stay in sync as holes are entered instead of freezing at open-time.
  const editingFlight = isActiveSession ? matches.find((m) => m.id === editingFlightId) ?? null : null;

  const flights = [...matches].sort((a, b) => a.sort_order - b.sort_order);
  const grayFlights = matches.filter((m) => m.flight_team === "gray");
  const aquaFlights = matches.filter((m) => m.flight_team === "aqua");
  const result = scrambleResult(matches, session);

  const grayHasScore = grayFlights.some((f) => f.score_vs_par !== null);
  const aquaHasScore = aquaFlights.some((f) => f.score_vs_par !== null);
  const grayRunningTotal = grayFlights.reduce((a, f) => a + (f.score_vs_par ?? 0), 0);
  const aquaRunningTotal = aquaFlights.reduce((a, f) => a + (f.score_vs_par ?? 0), 0);

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
        <div
          className={`rounded-xl border px-3 py-2 text-center ${
            result.decided && result.winner === "gray" ? "border-gold bg-gold/10" : "border-card-border bg-card-deep"
          }`}
        >
          <p className="text-[11px] uppercase tracking-wide text-ink-light">Gray</p>
          <p className={`font-display text-lg font-bold ${grayHasScore ? "text-ink" : "text-ink-light/40"}`}>
            {fmtVsPar(grayHasScore ? grayRunningTotal : null)}
          </p>
        </div>
        <div
          className={`rounded-xl border px-3 py-2 text-center ${
            result.decided && result.winner === "aqua" ? "border-gold bg-gold/10" : "border-card-border bg-card-deep"
          }`}
        >
          <p className="text-[11px] uppercase tracking-wide text-ink-light">Aqua</p>
          <p className={`font-display text-lg font-bold ${aquaHasScore ? "text-ink" : "text-ink-light/40"}`}>
            {fmtVsPar(aquaHasScore ? aquaRunningTotal : null)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {flights.map((f) => (
          <FlightRow key={f.id} flight={f} active={isActiveSession} onClick={() => setEditingFlightId(f.id)} />
        ))}
      </div>

      <div className="rounded-xl border border-card-border bg-card-deep px-3 py-2 text-center text-xs text-ink-light">
        {result.decided ? (
          result.winner ? (
            <span className="font-semibold text-ink">
              Sammenlagt {fmtVsPar(result.grayTotal)} – {fmtVsPar(result.aquaTotal)} &middot;{" "}
              {result.winner === "gray" ? "Gray" : "Aqua"} tar {session.points_per_match}p
            </span>
          ) : (
            <span className="font-semibold text-ink">
              Sammenlagt {fmtVsPar(result.grayTotal)} – {fmtVsPar(result.aquaTotal)} &middot; Delt,{" "}
              {session.points_per_match / 2}p hver
            </span>
          )
        ) : (
          <span>Venter på alle fire scorene før poengene fordeles</span>
        )}
      </div>

      {editingFlight && (
        <ModalShell title="Scramble-score" onClose={() => setEditingFlightId(null)}>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">
                {editingFlight.flight_team === "gray" ? "Gray (Joys)" : "Aquarellos"} &middot;{" "}
                {editingFlight.start_time ?? "--:--"}
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
                            disabled={par === null}
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
              Skriv inn antall slag for hvert hull — over/under par regnes ut automatisk.
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
