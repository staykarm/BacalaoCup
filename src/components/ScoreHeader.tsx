"use client";

import { useTournament } from "@/context/TournamentContext";
import { totalPoints } from "@/lib/scoring";
import { ScoreBar } from "./ScoreBar";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function ScoreHeader() {
  const { matches } = useTournament();
  const { gray, aqua, possible } = totalPoints(matches);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-lighter/60 bg-navy-deep/90 backdrop-blur supports-[backdrop-filter]:bg-navy-deep/75">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-center gap-2 text-center">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold sm:text-xs">
            Bacalao Cup MMXXV &middot; Marbella
          </p>
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </div>

        <div className="mt-2 grid grid-cols-3 items-center gap-2">
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-team-light sm:text-sm">
              Gray (Joys)
            </div>
            <div className="font-serif text-3xl font-bold text-gray-team-light drop-shadow sm:text-5xl">
              {fmt(gray)}
            </div>
          </div>

          <div className="text-center text-lg font-bold text-foreground/40 sm:text-2xl">–</div>

          <div className="text-left">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-aqua-team-light sm:text-sm">
              Aquarellos
            </div>
            <div className="font-serif text-3xl font-bold text-aqua-team-light drop-shadow sm:text-5xl">
              {fmt(aqua)}
            </div>
          </div>
        </div>

        <ScoreBar gray={gray} aqua={aqua} possible={possible} className="mx-auto mt-2 max-w-md" />
      </div>
    </header>
  );
}
