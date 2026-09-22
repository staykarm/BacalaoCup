"use client";

import { useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { HOLES_PER_MATCH, scrambleResult } from "@/lib/scoring";
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
  const { updateMatch } = useTournament();
  const [editingFlight, setEditingFlight] = useState<Match | null>(null);

  const flights = [...matches].sort((a, b) => a.sort_order - b.sort_order);
  const grayFlights = matches.filter((m) => m.flight_team === "gray");
  const aquaFlights = matches.filter((m) => m.flight_team === "aqua");
  const result = scrambleResult(matches, session);

  const grayHasScore = grayFlights.some((f) => f.score_vs_par !== null);
  const aquaHasScore = aquaFlights.some((f) => f.score_vs_par !== null);
  const grayRunningTotal = grayFlights.reduce((a, f) => a + (f.score_vs_par ?? 0), 0);
  const aquaRunningTotal = aquaFlights.reduce((a, f) => a + (f.score_vs_par ?? 0), 0);

  function recordHole(value: number) {
    if (!editingFlight) return;
    const thru = Math.min((editingFlight.live_thru ?? 0) + 1, HOLES_PER_MATCH);
    const score = (editingFlight.score_vs_par ?? 0) + value;
    updateMatch(editingFlight.id, { live_thru: thru, score_vs_par: score });
    setEditingFlight({ ...editingFlight, live_thru: thru, score_vs_par: score });
  }

  function clear() {
    if (!editingFlight) return;
    updateMatch(editingFlight.id, { score_vs_par: null, live_thru: null });
    setEditingFlight({ ...editingFlight, score_vs_par: null, live_thru: null });
  }

  const editingDone = editingFlight !== null && (editingFlight.live_thru ?? 0) >= HOLES_PER_MATCH;

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
          <FlightRow key={f.id} flight={f} onClick={() => setEditingFlight(f)} />
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
        <ModalShell title="Scramble-score" onClose={() => setEditingFlight(null)}>
          <div className="space-y-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">
              {editingFlight.flight_team === "gray" ? "Gray (Joys)" : "Aquarellos"} &middot;{" "}
              {editingFlight.start_time ?? "--:--"}
            </p>
            <div>
              <p className="font-display text-4xl font-bold text-ink">{fmtVsPar(editingFlight.score_vs_par)}</p>
              <p className="mt-1 text-xs text-ink-light">
                Hull {editingFlight.live_thru ?? 0} av {HOLES_PER_MATCH}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {HOLE_BUTTONS.map((b) => (
                <button
                  key={b.label}
                  disabled={editingDone}
                  onClick={() => recordHole(b.value)}
                  className="flex items-center justify-between rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-ink hover:border-gold-deep/40 hover:bg-card-deep disabled:opacity-40"
                >
                  <span>{b.label}</span>
                  <span className="text-ink-light">{b.value > 0 ? `+${b.value}` : b.value}</span>
                </button>
              ))}
            </div>
            {(editingFlight.score_vs_par !== null || editingFlight.live_thru !== null) && (
              <button onClick={clear} className="text-xs text-ink-light hover:text-ink">
                Nullstill
              </button>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
