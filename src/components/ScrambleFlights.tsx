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

const HOLE_BUTTONS: { label: string; value: number }[] = [
  { label: "Eagle", value: -2 },
  { label: "Birdie", value: -1 },
  { label: "Par", value: 0 },
  { label: "Bogey", value: 1 },
  { label: "Dobbel Bogey", value: 2 },
];

function FlightRow({ flight, onClick }: { flight: Match; onClick: () => void }) {
  const team = flight.flight_team as TeamId;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-card-border bg-white px-3 py-2.5 text-left hover:border-gold-deep/40"
    >
      <Image
        src={team === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px] shrink-0 rounded-full object-cover"
      />
      <span className="flex-1 text-sm text-ink-light">{flight.start_time ?? "--:--"}</span>
      <span className="text-[11px] text-ink-light/60">
        {flight.live_thru !== null ? `Hull ${flight.live_thru}/${HOLES_PER_MATCH}` : ""}
      </span>
      <span
        className={`font-display text-lg font-bold ${flight.score_vs_par === null ? "text-ink-light/40" : "text-ink"}`}
      >
        {fmtVsPar(flight.score_vs_par)}
      </span>
    </button>
  );
}

export function ScrambleFlights({ session, matches }: { session: Session; matches: Match[] }) {
  const { matchHoles, sessions, days, setMatchHole } = useTournament();
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [editingHole, setEditingHole] = useState<number | null>(null);
  // Re-derived from the live `matches` prop every render, not a captured snapshot, so the
  // modal's totals stay in sync as holes are entered instead of freezing at open-time.
  const editingFlight = matches.find((m) => m.id === editingFlightId) ?? null;

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
    ? new Map(
        matchHoles.filter((h) => h.match_id === editingFlight.id).map((h) => [h.hole_number, h.score_vs_par])
      )
    : new Map<number, number | null>();

  function setHoleScore(value: number | null) {
    if (!editingFlight || editingHole === null) return;
    setMatchHole(editingFlight, editingHole, { score_vs_par: value });
    setEditingHole(null);
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
          <FlightRow key={f.id} flight={f} onClick={() => setEditingFlightId(f.id)} />
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
                      const value = holesForFlight.get(relHole) ?? null;
                      const label = value === null ? "–" : value > 0 ? `+${value}` : String(value);
                      const colorClass =
                        value === null
                          ? "border-card-border bg-white text-ink-light/30"
                          : value < 0
                            ? "border-gold-deep bg-gold/15 text-gold-deep"
                            : value === 0
                              ? "border-card-border bg-card-deep text-ink"
                              : "border-aqua-team-deep/40 bg-aqua-team-bg/40 text-aqua-team-deep";
                      return (
                        <td key={relHole}>
                          <button
                            onClick={() => setEditingHole(relHole)}
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

            <p className="text-center text-xs text-ink-light/60">Trykk et hull for å registrere slag mot par.</p>
          </div>
        </ModalShell>
      )}

      {editingFlight && editingHole !== null && (
        <ModalShell title={`Hull ${courseHoleNumber(editingHole, frontNine)}`} onClose={() => setEditingHole(null)}>
          <div className="space-y-5 text-center">
            {(() => {
              const info = getHoleInfo(course, courseHoleNumber(editingHole, frontNine));
              return (
                <p className="text-xs text-ink-light">
                  {info.par !== null ? `Par ${info.par}` : "Par –"}
                  {info.meters !== null && <> &middot; {info.meters} m</>}
                  {info.index !== null && <> &middot; Idx {info.index}</>}
                </p>
              );
            })()}
            <div className="grid grid-cols-1 gap-2">
              {HOLE_BUTTONS.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setHoleScore(b.value)}
                  className="flex items-center justify-between rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-ink hover:border-gold-deep/40 hover:bg-card-deep"
                >
                  <span>{b.label}</span>
                  <span className="text-ink-light">{b.value > 0 ? `+${b.value}` : b.value}</span>
                </button>
              ))}
            </div>
            {holesForFlight.get(editingHole) !== undefined && holesForFlight.get(editingHole) !== null && (
              <button onClick={() => setHoleScore(null)} className="text-xs text-ink-light hover:text-ink">
                Nullstill
              </button>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
