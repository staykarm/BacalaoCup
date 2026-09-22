"use client";

import { useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { scrambleResult } from "@/lib/scoring";
import { Match, Session, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmtVsPar(n: number | null) {
  if (n === null) return "–";
  if (n === 0) return "PAR";
  return n > 0 ? `+${n}` : `${n}`;
}

function FlightRow({ team, flight, onClick }: { team: TeamId; flight: Match; onClick: () => void }) {
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
      <span className={`font-display text-lg font-bold ${flight.score_vs_par === null ? "text-ink-light/40" : "text-ink"}`}>
        {fmtVsPar(flight.score_vs_par)}
      </span>
    </button>
  );
}

export function ScrambleFlights({ session, matches }: { session: Session; matches: Match[] }) {
  const { updateMatch } = useTournament();
  const [editingFlight, setEditingFlight] = useState<Match | null>(null);

  const grayFlights = matches.filter((m) => m.flight_team === "gray").sort((a, b) => a.sort_order - b.sort_order);
  const aquaFlights = matches.filter((m) => m.flight_team === "aqua").sort((a, b) => a.sort_order - b.sort_order);
  const result = scrambleResult(matches, session);

  function bump(delta: number) {
    if (!editingFlight) return;
    const next = (editingFlight.score_vs_par ?? 0) + delta;
    updateMatch(editingFlight.id, { score_vs_par: next });
    setEditingFlight({ ...editingFlight, score_vs_par: next });
  }

  function clear() {
    if (!editingFlight) return;
    updateMatch(editingFlight.id, { score_vs_par: null });
    setEditingFlight({ ...editingFlight, score_vs_par: null });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {grayFlights.map((f) => (
            <FlightRow key={f.id} team="gray" flight={f} onClick={() => setEditingFlight(f)} />
          ))}
        </div>
        <div className="space-y-2">
          {aquaFlights.map((f) => (
            <FlightRow key={f.id} team="aqua" flight={f} onClick={() => setEditingFlight(f)} />
          ))}
        </div>
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
            <p className="font-display text-4xl font-bold text-ink">{fmtVsPar(editingFlight.score_vs_par)}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => bump(-1)}
                className="h-12 w-12 shrink-0 rounded-full border border-card-border text-xl font-bold text-ink hover:bg-card-deep"
              >
                –
              </button>
              <button
                onClick={() => bump(1)}
                className="h-12 w-12 shrink-0 rounded-full border border-card-border text-xl font-bold text-ink hover:bg-card-deep"
              >
                +
              </button>
            </div>
            {editingFlight.score_vs_par !== null && (
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
