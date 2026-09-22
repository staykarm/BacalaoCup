"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { ModalShell } from "./ModalShell";

export function AdminModal({ onClose }: { onClose: () => void }) {
  const { days, sessions, activeSessionId, setActiveSession, resetAllMatches } = useTournament();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  async function confirmReset() {
    setResetting(true);
    await resetAllMatches();
    setResetting(false);
    setConfirming(false);
    setDone(true);
  }

  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ModalShell title="Admin" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-foreground/50">
          Midlertidig admin-panel, åpent for alle mens vi tester appen.
        </p>

        <div className="rounded-xl border border-navy-lighter/50 bg-navy-light/40 p-4">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-foreground/80">Aktiv runde</h3>
          <p className="mb-3 text-xs text-foreground/60">
            Kun den valgte runden kan redigeres — resten låses for alle andre spillere.
          </p>
          <select
            value={activeSessionId ?? ""}
            onChange={(e) => setActiveSession(e.target.value || null)}
            className="w-full rounded-lg border border-navy-lighter/60 bg-navy px-3 py-2 text-sm focus:border-gold/60 focus:outline-none"
          >
            <option value="">Ingen — alle runder åpne</option>
            {sortedDays.map((day) => (
              <optgroup key={day.id} label={day.label}>
                {sessions
                  .filter((s) => s.day_id === day.id)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-4">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-red-300">Nullstill resultater</h3>
          <p className="mb-3 text-xs text-foreground/60">
            Setter alle kamper tilbake til «Ikke spilt» og nullstiller live-stilling, hull og poeng. Kan ikke
            angres.
          </p>

          {done ? (
            <p className="text-sm font-semibold text-foreground/70">Alle resultater er nullstilt.</p>
          ) : confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-red-300">Er du sikker?</span>
              <button
                onClick={confirmReset}
                disabled={resetting}
                className="rounded-lg border border-red-500/60 bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/30 disabled:opacity-40"
              >
                {resetting ? "Nullstiller..." : "Ja, nullstill alt"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-navy-lighter/60 px-3 py-1.5 text-xs text-foreground/60 hover:bg-navy-lighter/30"
              >
                Avbryt
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
            >
              Nullstill alle resultater
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
