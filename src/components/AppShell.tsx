"use client";

import { useState } from "react";
import { TournamentProvider, useTournament } from "@/context/TournamentContext";
import { ScoreHeader } from "./ScoreHeader";
import { StandingsModal } from "./StandingsModal";

function SyncErrorToast() {
  const { syncError, clearSyncError } = useTournament();
  if (!syncError) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur sm:bottom-8">
      <div className="flex items-start gap-3">
        <p className="flex-1">
          <span className="font-semibold">Klarte ikke å lagre.</span> Sjekk nettforbindelsen og prøv igjen.
        </p>
        <button
          onClick={clearSyncError}
          aria-label="Lukk"
          className="shrink-0 text-red-300/70 hover:text-red-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

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

      <SyncErrorToast />
    </TournamentProvider>
  );
}
