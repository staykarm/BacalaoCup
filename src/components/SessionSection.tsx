"use client";

import { useState } from "react";
import { Match, Player, Session, FORMAT_LABELS } from "@/lib/types";
import { projectedPoints } from "@/lib/scoring";
import { useTournament } from "@/context/TournamentContext";
import { MatchRow } from "./MatchRow";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function SessionSection({
  session,
  matches,
  players,
  defaultOpen = false,
}: {
  session: Session;
  matches: Match[];
  players: Player[];
  defaultOpen?: boolean;
}) {
  const { activeSessionId } = useTournament();
  const [open, setOpen] = useState(defaultOpen);

  const { gray, aqua } = projectedPoints(matches);
  const played = matches.filter((m) => m.result !== "not_played").length;
  const isActive = activeSessionId === session.id;
  const leader: "gray" | "aqua" | null = gray === aqua ? null : gray > aqua ? "gray" : "aqua";

  const cardClass = isActive
    ? leader === "gray"
      ? "border-gray-team bg-gray-team-bg/30 border-l-4"
      : leader === "aqua"
        ? "border-aqua-team bg-aqua-team-bg/30 border-l-4"
        : "border-gold bg-gold/10 border-l-4"
    : "border-navy-lighter/40 bg-navy-light/70";

  return (
    <div className={`overflow-hidden rounded-3xl border transition-colors ${cardClass}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`text-foreground/40 transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          <div>
            <div className="flex items-center gap-2 font-semibold text-foreground/90">
              {session.name}
              {isActive && (
                <span className="rounded-full border border-gold/50 bg-gold/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold">
                  Aktiv runde
                </span>
              )}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-foreground/40">
              {FORMAT_LABELS[session.format]} &middot; {fmt(session.points_per_match)}p/kamp &middot;{" "}
              {played}/{matches.length} spilt
            </div>
          </div>
        </div>
        <div className="shrink-0 text-sm font-bold">
          <span className="text-gray-team-light">{fmt(gray)}</span>
          <span className="text-foreground/30"> – </span>
          <span className="text-aqua-team-light">{fmt(aqua)}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-2 border-t border-navy-lighter/50 px-3 pb-3 pt-3">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} session={session} players={players} />
          ))}
        </div>
      )}
    </div>
  );
}
