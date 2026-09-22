"use client";

import { useState } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { Match, MatchResult, Player, RESULT_LABELS, Session, TeamId } from "@/lib/types";
import { liveLeader, liveUpLabel } from "@/lib/scoring";
import { PlayerSelect } from "./PlayerSelect";
import { PlayerDetailModal } from "./PlayerDetailModal";

function sidePlayers(match: Match, team: TeamId, players: Player[]) {
  const ids = team === "gray"
    ? [match.gray_player1, match.gray_player2]
    : [match.aqua_player1, match.aqua_player2];
  return ids
    .filter((id): id is string => !!id)
    .map((id) => ({ id, name: players.find((p) => p.id === id)?.name ?? id }));
}

function fmtPts(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const RESULT_OPTIONS: MatchResult[] = ["gray_won", "halved", "aqua_won", "not_played"];

export function MatchRow({ match, session, players }: { match: Match; session: Session; players: Player[] }) {
  const { updateMatch, setMatchResult, activeSessionId } = useTournament();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(match);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const locked = activeSessionId !== null && session.id !== activeSessionId;

  const maxPlayersPerSide = session.format === "scramble" ? 0 : session.format === "singles" ? 1 : 2;

  const grayPlayers = sidePlayers(match, "gray", players);
  const aquaPlayers = sidePlayers(match, "aqua", players);

  function startEdit() {
    setDraft(match);
    setEditing(true);
  }

  async function save() {
    await updateMatch(match.id, {
      start_time: draft.start_time,
      points: draft.points,
      gray_player1: draft.gray_player1,
      gray_player2: draft.gray_player2,
      aqua_player1: draft.aqua_player1,
      aqua_player2: draft.aqua_player2,
      note: draft.note,
    });
    setEditing(false);
  }

  function bumpLiveUp(delta: number) {
    updateMatch(match.id, { live_up: match.live_up + delta });
  }

  function resetLiveUp() {
    updateMatch(match.id, { live_up: 0 });
  }

  function setLiveThru(hole: number | null) {
    updateMatch(match.id, { live_thru: hole });
  }

  function finalizeFromLive() {
    const leader = liveLeader(match.live_up);
    const result: MatchResult = leader === "gray" ? "gray_won" : leader === "aqua" ? "aqua_won" : "halved";
    setMatchResult(match.id, result);
  }

  const liveLeaderTeam = liveLeader(match.live_up);
  const liveColor =
    liveLeaderTeam === "gray"
      ? "text-gray-team-light"
      : liveLeaderTeam === "aqua"
        ? "text-aqua-team-light"
        : "text-gold";
  // Same live-leader color, but for use on the near-white editing panel below the result box.
  const liveColorOnLight =
    liveLeaderTeam === "gray"
      ? "text-ink"
      : liveLeaderTeam === "aqua"
        ? "text-aqua-team-deep"
        : "text-gold-deep";

  // This pill sits on the (now near-white) card body, so it needs readable-on-light colors,
  // even though it's still deliberately team/result-colored per side.
  const resultColor =
    match.result === "gray_won"
      ? "border-gray-team text-ink"
      : match.result === "aqua_won"
        ? "border-aqua-team text-aqua-team-deep"
        : match.result === "halved"
          ? "border-gold-deep text-gold-deep"
          : "border-card-border text-ink-light/60";

  const isLiveInProgress = match.result === "not_played" && (match.live_up !== 0 || match.live_thru !== null);

  // Standard match-play margin, e.g. "3/2" (won with holes to spare) or "1 UP" (won on the last hole).
  const finalMarginLabel = (() => {
    if (match.result !== "gray_won" && match.result !== "aqua_won") return null;
    if (match.live_thru === null) return null;
    const upBy = Math.abs(match.live_up);
    if (upBy === 0) return null;
    const remaining = 18 - match.live_thru;
    return remaining > 0 && upBy > remaining ? `${upBy}/${remaining}` : `${upBy} UP`;
  })();

  const leadingSide: TeamId | null =
    match.result === "gray_won"
      ? "gray"
      : match.result === "aqua_won"
        ? "aqua"
        : match.result === "not_played"
          ? liveLeaderTeam
          : null;

  const marginBadgeText = match.result === "not_played" ? (isLiveInProgress ? liveUpLabel(match.live_up) : null) : finalMarginLabel;

  function sideBg(team: TeamId) {
    const flat = team === "gray" ? "bg-gray-team-bg" : "bg-aqua-team-bg";
    const bold =
      team === "gray"
        ? "bg-gradient-to-br from-gray-team-bg to-gray-team-deep"
        : "bg-gradient-to-br from-aqua-team-bg to-aqua-team-deep";
    if (leadingSide === null) return flat;
    // The trailing/losing side fades to near-white so it blends into the card instead of competing for attention.
    return leadingSide === team ? bold : "bg-card";
  }

  function sideText(team: TeamId) {
    // Gray's fill is a light gray, so it needs dark ink text; Aqua's fill stays dark, so it keeps light text.
    const base = team === "gray" ? "text-ink" : "text-aqua-team-light";
    return leadingSide === null || leadingSide === team ? base : "text-ink-light/30";
  }

  return (
    <div
      className={`relative rounded-2xl border-2 bg-card shadow-sm transition hover:border-gold-deep/40 ${
        leadingSide === "gray"
          ? "border-gray-team"
          : leadingSide === "aqua"
            ? "border-aqua-team"
            : "border-card-border"
      }`}
    >
      {locked ? (
        <span
          title="Denne runden er låst av admin"
          className="absolute right-1.5 top-1.5 z-10 rounded-full border border-navy-lighter/60 bg-navy-deep/70 px-1.5 py-1 text-[10px] text-foreground/40 backdrop-blur"
        >
          🔒
        </span>
      ) : (
        <button
          onClick={startEdit}
          aria-label="Rediger kamp"
          className="absolute right-1.5 top-1.5 z-10 rounded-full border border-navy-lighter/60 bg-navy-deep/70 px-1.5 py-1 text-[10px] text-foreground/60 backdrop-blur hover:bg-navy-lighter/60"
        >
          ✎
        </button>
      )}

      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/50 bg-navy-deep px-2 py-0.5 text-[10px] font-bold text-gold shadow">
        {fmtPts(match.points)}p
      </div>

      <div className="flex items-stretch overflow-hidden rounded-t-2xl">
        <div className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-3 sm:px-4 sm:py-4 ${sideBg("gray")}`}>
          {leadingSide === "gray" && marginBadgeText && (
            <span className="shrink-0 rounded-full bg-navy-deep/60 px-2 py-1 text-sm font-extrabold text-white shadow-sm sm:text-base">
              {marginBadgeText}
            </span>
          )}
          <Image
            src="/logos/gray.png"
            alt=""
            width={24}
            height={24}
            className="hidden h-5 w-5 shrink-0 rounded-full object-cover opacity-80 sm:block sm:h-6 sm:w-6"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            {grayPlayers.length > 0 ? (
              grayPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`truncate text-left text-xs font-bold uppercase tracking-wide hover:underline sm:text-sm ${sideText("gray")}`}
                >
                  {p.name}
                </button>
              ))
            ) : (
              <span className={`truncate text-xs font-bold uppercase tracking-wide sm:text-sm ${sideText("gray")}`}>
                Gray (Joys)
              </span>
            )}
          </div>
        </div>

        <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 bg-navy-deep px-1 py-3 text-center sm:w-24 sm:py-4">
          {match.result !== "not_played" ? (
            <>
              <span className="text-sm font-extrabold text-foreground/70 sm:text-base">F</span>
              {match.result === "halved" && (
                <span className="text-[10px] font-bold text-gold sm:text-xs">HALF</span>
              )}
            </>
          ) : isLiveInProgress ? (
            <>
              <span className={`text-xs font-extrabold sm:text-sm ${liveColor}`}>
                {liveLeaderTeam === "gray" && "GRAY "}
                {liveLeaderTeam === "aqua" && "AQUA "}
                {liveUpLabel(match.live_up)}
              </span>
              {match.live_thru !== null && (
                <span className="text-[9px] font-semibold text-foreground/50 sm:text-[10px]">
                  THRU {match.live_thru}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-bold text-foreground sm:text-sm">{match.start_time ?? "--:--"}</span>
          )}
        </div>

        <div
          className={`flex min-w-0 flex-1 items-center justify-end gap-2 px-3 py-3 text-right sm:px-4 sm:py-4 ${sideBg("aqua")}`}
        >
          <div className="flex min-w-0 flex-col items-end gap-0.5">
            {aquaPlayers.length > 0 ? (
              aquaPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`truncate text-right text-xs font-bold uppercase tracking-wide hover:underline sm:text-sm ${sideText("aqua")}`}
                >
                  {p.name}
                </button>
              ))
            ) : (
              <span className={`truncate text-xs font-bold uppercase tracking-wide sm:text-sm ${sideText("aqua")}`}>
                Aquarellos
              </span>
            )}
          </div>
          <Image
            src="/logos/aquarellos.png"
            alt=""
            width={24}
            height={24}
            className="hidden h-5 w-5 shrink-0 rounded-full object-cover opacity-80 sm:block sm:h-6 sm:w-6"
          />
          {leadingSide === "aqua" && marginBadgeText && (
            <span className="shrink-0 rounded-full bg-navy-deep/60 px-2 py-1 text-sm font-extrabold text-white shadow-sm sm:text-base">
              {marginBadgeText}
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${resultColor}`}>
            {RESULT_LABELS[match.result]}
            {(match.result === "gray_won" || match.result === "aqua_won" || match.result === "halved") &&
              ` · Gray ${fmtPts(match.points_gray)} – ${fmtPts(match.points_aqua)} Aqua`}
          </span>

          {locked ? (
            <span className="ml-auto text-[11px] italic text-ink-light/60">🔒 Runden er låst</span>
          ) : (
            <div className="ml-auto flex flex-wrap gap-1.5">
              {RESULT_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setMatchResult(match.id, r)}
                  className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                    match.result === r
                      ? "border-gold-deep bg-gold/20 text-gold-deep"
                      : "border-card-border text-ink-light hover:border-gold-deep/40 hover:text-ink"
                  }`}
                >
                  {RESULT_LABELS[r]}
                </button>
              ))}
            </div>
          )}
        </div>

        {!locked && match.result === "not_played" && (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-card-deep px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => bumpLiveUp(1)}
                aria-label="Gray ett hull opp"
                className="shrink-0 rounded-lg border border-gray-team-deep/60 bg-gray-team-bg/70 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink hover:bg-gray-team-bg"
              >
                Gray
              </button>
              <span className={`w-20 shrink-0 text-center text-sm font-bold ${liveColorOnLight}`}>
                {liveLeaderTeam === "gray" && "GRAY "}
                {liveLeaderTeam === "aqua" && "AQUA "}
                {liveUpLabel(match.live_up)}
              </span>
              <button
                onClick={() => bumpLiveUp(-1)}
                aria-label="Aqua ett hull opp"
                className="shrink-0 rounded-lg border border-aqua-team-deep/60 bg-aqua-team-bg/70 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-aqua-team-light hover:bg-aqua-team-bg"
              >
                Aqua
              </button>
              {match.live_up !== 0 && (
                <button
                  onClick={resetLiveUp}
                  className="rounded-lg border border-card-border px-2 py-1 text-[11px] text-ink-light hover:bg-white"
                >
                  A/S
                </button>
              )}
            </div>

            <label className="flex items-center gap-1.5 text-xs text-ink-light">
              Hull
              <select
                value={match.live_thru ?? ""}
                onChange={(e) => setLiveThru(e.target.value ? Number(e.target.value) : null)}
                className="rounded-xl border border-card-border bg-white px-2 py-1 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
              >
                <option value="">–</option>
                {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
                  <option key={hole} value={hole}>
                    {hole}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={finalizeFromLive}
              className="ml-auto rounded-lg border border-gold-deep/50 bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold-deep hover:bg-gold/20"
            >
              Sett som endelig stilling
            </button>
          </div>
        )}

        {match.note && <p className="mt-2 text-[11px] italic text-ink-light/60">⚠ {match.note}</p>}

        {editing && (
          <div className="mt-3 space-y-3 rounded-xl border border-card-border bg-card-deep p-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-ink-light">
                Tid
                <input
                  type="text"
                  value={draft.start_time ?? ""}
                  onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                  placeholder="14:20"
                  className="w-20 rounded-xl border border-card-border bg-white px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-light">
                Poeng
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={draft.points}
                  onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
                  className="w-20 rounded-xl border border-card-border bg-white px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
                />
              </label>
            </div>

            {maxPlayersPerSide > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase text-ink">Gray</div>
                  <PlayerSelect
                    players={players}
                    team="gray"
                    value={draft.gray_player1}
                    onChange={(v) => setDraft({ ...draft, gray_player1: v })}
                    className="w-full"
                  />
                  {maxPlayersPerSide === 2 && (
                    <PlayerSelect
                      players={players}
                      team="gray"
                      value={draft.gray_player2}
                      onChange={(v) => setDraft({ ...draft, gray_player2: v })}
                      className="w-full"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase text-aqua-team-deep">Aqua</div>
                  <PlayerSelect
                    players={players}
                    team="aqua"
                    value={draft.aqua_player1}
                    onChange={(v) => setDraft({ ...draft, aqua_player1: v })}
                    className="w-full"
                  />
                  {maxPlayersPerSide === 2 && (
                    <PlayerSelect
                      players={players}
                      team="aqua"
                      value={draft.aqua_player2}
                      onChange={(v) => setDraft({ ...draft, aqua_player2: v })}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            )}

            <label className="block text-xs text-ink-light">
              Notat
              <textarea
                value={draft.note ?? ""}
                onChange={(e) => setDraft({ ...draft, note: e.target.value || null })}
                rows={2}
                className="mt-1 w-full rounded-xl border border-card-border bg-white px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl border border-card-border px-3 py-1.5 text-xs text-ink-light hover:bg-white"
              >
                Avbryt
              </button>
              <button
                onClick={save}
                className="rounded-xl border border-gold-deep/60 bg-gold/20 px-3 py-1.5 text-xs font-semibold text-gold-deep hover:bg-gold/30"
              >
                Lagre
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPlayerId && (
        <PlayerDetailModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
      )}
    </div>
  );
}
