"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { COMPETITIONS } from "@/lib/competitions";
import { exportBackupToExcel } from "@/lib/exportBackup";
import { Day, Match, Player, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function CompetitionWinnerInput({
  day,
  hole,
  players,
  onSave,
}: {
  day: Day;
  hole: number;
  players: Player[];
  onSave: (winnerId: string) => void;
}) {
  const grayPlayers = players.filter((p) => p.team_id === "gray");
  const aquaPlayers = players.filter((p) => p.team_id === "aqua");
  return (
    <label className="flex items-center gap-2 text-xs text-ink">
      <span className="w-14 shrink-0 text-ink-light">Hull {hole}</span>
      <select
        value={day.competition_winners[hole] ?? ""}
        onChange={(e) => onSave(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-card-border bg-card-deep px-2 py-1 text-xs text-ink focus:border-gold-deep/60 focus:outline-none"
      >
        <option value="">Ingen valgt</option>
        <optgroup label="Gray">
          {grayPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Aqua">
          {aquaPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

function FlightRosterEditor({
  match,
  roster,
  onToggle,
}: {
  match: Match;
  roster: Player[];
  onToggle: (playerId: string) => void;
}) {
  const selected = new Set(match.flight_players);
  const team = match.flight_team as TeamId;
  return (
    <div className="rounded-xl border border-card-border bg-card-deep p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-light">
          {team === "gray" ? "Gray" : "Aqua"} &middot; {match.start_time ?? "--:--"}
        </span>
        <span className="text-[11px] text-ink-light/60">{selected.size} valgt</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {roster.map((p) => {
          const active = selected.has(p.id);
          const activeClass =
            team === "gray" ? "border-gray-team bg-gray-team-bg text-ink" : "border-aqua-team bg-aqua-team-deep text-white";
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                active ? activeClass : "border-card-border bg-white text-ink-light hover:border-gold-deep/40"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminModal({ onClose }: { onClose: () => void }) {
  const {
    players,
    days,
    sessions,
    matches,
    matchHoles,
    playerYearStats,
    activeSessionIds,
    toggleActiveSession,
    resetAllMatches,
    updateSessionHandicap,
    updateDayHideNames,
    updateCompetitionWinner,
    updateMatch,
    adminPin,
    updateAdminPin,
  } = useTournament();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);

  function savePin() {
    if (newPin.length < 4) return;
    updateAdminPin(newPin);
    setNewPin("");
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
  }

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
  const playableDays = sortedDays.filter((day) => sessions.some((s) => s.day_id === day.id));

  function toggleFlightPlayer(match: (typeof matches)[number], playerId: string) {
    const current = match.flight_players;
    const next = current.includes(playerId)
      ? current.filter((id) => id !== playerId)
      : [...current, playerId];
    updateMatch(match.id, { flight_players: next });
  }

  return (
    <ModalShell title="Admin" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-ink-light">
          Midlertidig admin-panel, låst med PIN-kode mens vi tester appen.
        </p>

        <div className="rounded-2xl border border-card-border bg-white p-4">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">PIN-kode</h3>
          <p className="mb-3 text-xs text-ink-light">
            Kreves for å åpne dette panelet. Bytt den om du vil dele den med færre.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={`Nåværende: ${adminPin}`}
              className="min-w-0 flex-1 rounded-xl border border-card-border bg-card-deep px-3 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
            />
            <button
              onClick={savePin}
              disabled={newPin.length < 4}
              className="shrink-0 rounded-xl border border-gold-deep/60 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold-deep hover:bg-gold/20 disabled:opacity-40"
            >
              Lagre
            </button>
          </div>
          {pinSaved && <p className="mt-2 text-xs font-semibold text-ink-light">PIN-kode oppdatert.</p>}
        </div>

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
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">Aktive runder</h3>
          <p className="mb-3 text-xs text-ink-light">
            Valgte runder merkes med «- pågår» i oversikten. Flere runder kan være aktive samtidig — for eksempel
            når to flighter spiller parallelt. Alle runder kan redigeres uansett.
          </p>
          <div className="space-y-3">
            {sortedDays.map((day) => {
              const daySessions = sessions
                .filter((s) => s.day_id === day.id)
                .sort((a, b) => a.sort_order - b.sort_order);
              if (daySessions.length === 0) return null;
              return (
                <div key={day.id}>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-light">{day.label}</p>
                  <div className="space-y-1.5">
                    {daySessions.map((s) => (
                      <label key={s.id} className="flex items-center justify-between gap-2 text-sm text-ink">
                        <span>{s.name}</span>
                        <input
                          type="checkbox"
                          checked={activeSessionIds.includes(s.id)}
                          onChange={() => toggleActiveSession(s.id)}
                          className="h-4 w-4 accent-gold-deep"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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

        {scrambleSessions.length > 0 && (
          <div className="rounded-2xl border border-card-border bg-white p-4">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">Scramble-lag</h3>
            <p className="mb-3 text-xs text-ink-light">
              Velg hvilke spillere som er i hver flight. Grå: to lag med fire spillere. Aqua: ett lag med tre og
              ett med fire.
            </p>
            <div className="space-y-4">
              {scrambleSessions.map((s) => {
                const flights = matches
                  .filter((m) => m.session_id === s.id)
                  .sort((a, b) => a.sort_order - b.sort_order);
                return (
                  <div key={s.id}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-light">{s.name}</p>
                    <div className="space-y-2">
                      {flights.map((f) => (
                        <FlightRosterEditor
                          key={f.id}
                          match={f}
                          roster={players.filter((p) => p.team_id === f.flight_team)}
                          onToggle={(playerId) => toggleFlightPlayer(f, playerId)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-card-border bg-white p-4">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">Skjul spillernavn</h3>
          <p className="mb-3 text-xs text-ink-light">
            Skjuler navnene på kampene den dagen — alt annet (registrering, poeng) fungerer som normalt.
          </p>
          <div className="space-y-2">
            {playableDays.map((day) => (
              <label key={day.id} className="flex items-center justify-between gap-2 text-sm text-ink">
                <span>{day.label}</span>
                <input
                  type="checkbox"
                  checked={day.hide_names}
                  onChange={(e) => updateDayHideNames(day.id, e.target.checked)}
                  className="h-4 w-4 accent-gold-deep"
                />
              </label>
            ))}
          </div>
        </div>

        {playableDays.some((d) => d.course && COMPETITIONS[d.course]) && (
          <div className="rounded-2xl border border-card-border bg-white p-4">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">Konkurranse-vinnere</h3>
            <p className="mb-3 text-xs text-ink-light">
              Hvem vant Longest Drive og Closest to Pin hver dag. Vises i Konkurranser-oversikten.
            </p>
            <div className="space-y-4">
              {playableDays
                .filter((day) => day.course && COMPETITIONS[day.course])
                .map((day) => {
                  const comp = COMPETITIONS[day.course as string];
                  return (
                    <div key={day.id}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-light">{day.label}</p>
                      <div className="space-y-1.5">
                        {[...comp.longestDrive, ...comp.closestToPin].map((hole) => (
                          <CompetitionWinnerInput
                            key={hole}
                            day={day}
                            hole={hole}
                            players={players}
                            onSave={(winnerId) => updateCompetitionWinner(day.id, hole, winnerId)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
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
