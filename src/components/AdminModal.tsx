"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { exportBackupToExcel } from "@/lib/exportBackup";
import { TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

export function AdminModal({ onClose }: { onClose: () => void }) {
  const {
    players,
    days,
    sessions,
    matches,
    matchHoles,
    playerYearStats,
    activeSessionId,
    setActiveSession,
    resetAllMatches,
    updateSessionHandicap,
  } = useTournament();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const scrambleSessions = sessions.filter((s) => s.format === "scramble").sort((a, b) => a.sort_order - b.sort_order);

  async function handleExport() {
    setExporting(true);
    setExportError(false);
    try {
      await exportBackupToExcel({ players, days, sessions, matches, matchHoles, playerYearStats });
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

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
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">Backup</h3>
          <p className="mb-3 text-xs text-ink-light">
            Laster ned alle kamper, scramble-score, hull-for-hull-resultater, spillere og historikk som et
            Excel-ark.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-xl border border-gold-deep/60 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold-deep hover:bg-gold/20 disabled:opacity-40"
          >
            {exporting ? "Lager Excel-fil..." : "Eksporter til Excel"}
          </button>
          {exportError && <p className="mt-2 text-xs text-red-700">Klarte ikke å lage filen. Prøv igjen.</p>}
        </div>

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

        {scrambleSessions.length > 0 && (
          <div className="rounded-2xl border border-card-border bg-white p-4">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">Scramble-handicap</h3>
            <p className="mb-3 text-xs text-ink-light">
              Trekkes fra lagets sammenlagte score-vs-par før poengene avgjøres.
            </p>
            <div className="space-y-3">
              {scrambleSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-xs text-ink-light">{s.name}</span>
                  <select
                    value={s.handicap_team ?? ""}
                    onChange={(e) =>
                      updateSessionHandicap(
                        s.id,
                        e.target.value ? (e.target.value as TeamId) : null,
                        s.handicap_strokes
                      )
                    }
                    className="rounded-xl border border-card-border bg-card-deep px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
                  >
                    <option value="">Ingen</option>
                    <option value="gray">Gray</option>
                    <option value="aqua">Aqua</option>
                  </select>
                  <input
                    type="number"
                    step="1"
                    disabled={!s.handicap_team}
                    value={s.handicap_strokes ?? ""}
                    onChange={(e) =>
                      updateSessionHandicap(s.id, s.handicap_team, e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="Slag"
                    className="w-20 rounded-xl border border-card-border bg-card-deep px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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
