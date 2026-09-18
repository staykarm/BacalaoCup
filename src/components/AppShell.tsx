"use client";

import { useState } from "react";
import { TournamentProvider } from "@/context/TournamentContext";
import { ScoreHeader } from "./ScoreHeader";
import { StandingsModal } from "./StandingsModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [standingsOpen, setStandingsOpen] = useState(false);

  return (
    <TournamentProvider>
      <ScoreHeader />

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6">{children}</main>

      <button
        onClick={() => setStandingsOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-gold/60 bg-gradient-to-b from-gold-bright to-gold-deep px-5 py-3 font-semibold text-navy-deep shadow-lg shadow-black/40 transition hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
      >
        <span aria-hidden>🏆</span>
        Stilling
      </button>

      {standingsOpen && <StandingsModal onClose={() => setStandingsOpen(false)} />}
    </TournamentProvider>
  );
}
