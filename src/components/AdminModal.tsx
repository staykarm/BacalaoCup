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
        <p className="text-xs text-ink-light">
          Midlertidig admin-panel, åpent for alle mens vi tester appen.
        </p>

        <div className="rounded-2xl border border-card-border bg-white p-4">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">Aktiv runde</h3>
          <p className="mb-3 text-xs text-ink-light">
            Den valgte runden merkes med «- pågår» i oversikten. Alle runder kan redigeres uansett.
          </p>
          <select
            value={activeSessionId ?? ""}
            onChange={(e) => setActiveSession(e.target.value || null)}
            className="w-full rounded-xl border border-card-border bg-card-deep px-3 py-2 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
          >
            <option value="">Ingen</option>
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

        <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-red-700">Nullstill resultater</h3>
          <p className="mb-3 text-xs text-ink-light">
            Setter alle kamper tilbake til «Ikke spilt» og nullstiller live-stilling, hull og poeng. Kan ikke
            angres.
          </p>

          {done ? (
            <p className="text-sm font-semibold text-ink-light">Alle resultater er nullstilt.</p>
          ) : confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-red-700">Er du sikker?</span>
              <button
                onClick={confirmReset}
                disabled={resetting}
                className="rounded-xl border border-red-400 bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-40"
              >
                {resetting ? "Nullstiller..." : "Ja, nullstill alt"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-card-border px-3 py-1.5 text-xs text-ink-light hover:bg-card-deep"
              >
                Avbryt
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-xl border border-red-400 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
            >
              Nullstill alle resultater
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
