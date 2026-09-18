"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { Match, MatchResult, Player, RESULT_LABELS, Session, TeamId } from "@/lib/types";
import { PlayerSelect } from "./PlayerSelect";

function sideNames(match: Match, team: TeamId, players: Player[]) {
  const ids = team === "gray"
    ? [match.gray_player1, match.gray_player2]
    : [match.aqua_player1, match.aqua_player2];
  const names = ids
    .filter((id): id is string => !!id)
    .map((id) => players.find((p) => p.id === id)?.name ?? id);
  return names;
}

function fmtPts(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const RESULT_OPTIONS: MatchResult[] = ["gray_won", "halved", "aqua_won", "not_played"];

export function MatchRow({ match, session, players }: { match: Match; session: Session; players: Player[] }) {
  const { updateMatch, setMatchResult } = useTournament();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(match);

  const maxPlayersPerSide = session.format === "scramble" ? 0 : session.format === "singles" ? 1 : 2;

  const grayNames = sideNames(match, "gray", players);
  const aquaNames = sideNames(match, "aqua", players);

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

  const resultColor =
    match.result === "gray_won"
      ? "border-gray-team text-gray-team-light"
      : match.result === "aqua_won"
        ? "border-aqua-team text-aqua-team-light"
        : match.result === "halved"
          ? "border-gold text-gold"
          : "border-navy-lighter/50 text-foreground/40";

  return (
    <div className="rounded-xl border border-navy-lighter/50 bg-navy-light/30 p-3 transition hover:border-navy-lighter">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-14 shrink-0 text-sm font-semibold text-foreground/70">
          {match.start_time ?? "--:--"}
        </div>

        <div className="min-w-0 flex-1 rounded-lg border border-gray-team-deep/50 bg-gray-team-bg/40 px-3 py-1.5 text-sm font-medium text-gray-team-light">
          {grayNames.length > 0 ? grayNames.join(" / ") : "Gray (Joys)"}
        </div>

        <div className="shrink-0 rounded-full border border-gold/40 bg-navy-deep px-2 py-1 text-[11px] font-bold text-gold">
          {fmtPts(match.points)}p
        </div>

        <div className="min-w-0 flex-1 rounded-lg border border-aqua-team-deep/50 bg-aqua-team-bg/40 px-3 py-1.5 text-right text-sm font-medium text-aqua-team-light">
          {aquaNames.length > 0 ? aquaNames.join(" / ") : "Aquarellos"}
        </div>

        <button
          onClick={startEdit}
          aria-label="Rediger kamp"
          className="shrink-0 rounded-lg border border-navy-lighter/60 px-2 py-1.5 text-xs text-foreground/50 hover:bg-navy-lighter/40"
        >
          ✎
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${resultColor}`}>
          {RESULT_LABELS[match.result]}
          {(match.result === "gray_won" || match.result === "aqua_won" || match.result === "halved") &&
            ` · Gray ${fmtPts(match.points_gray)} – ${fmtPts(match.points_aqua)} Aqua`}
        </span>

        <div className="ml-auto flex flex-wrap gap-1.5">
          {RESULT_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setMatchResult(match.id, r)}
              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                match.result === r
                  ? "border-gold bg-gold/20 text-gold"
                  : "border-navy-lighter/50 text-foreground/50 hover:border-navy-lighter hover:text-foreground/80"
              }`}
            >
              {RESULT_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {match.note && (
        <p className="mt-2 text-[11px] italic text-foreground/40">⚠ {match.note}</p>
      )}

      {editing && (
        <div className="mt-3 space-y-3 rounded-lg border border-navy-lighter/60 bg-navy-deep/60 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-foreground/60">
              Tid
              <input
                type="text"
                value={draft.start_time ?? ""}
                onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                placeholder="14:20"
                className="w-20 rounded-lg border border-navy-lighter/60 bg-navy-deep px-2 py-1.5 text-sm focus:border-gold/60 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground/60">
              Poeng
              <input
                type="number"
                step="0.5"
                min="0"
                value={draft.points}
                onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
                className="w-20 rounded-lg border border-navy-lighter/60 bg-navy-deep px-2 py-1.5 text-sm focus:border-gold/60 focus:outline-none"
              />
            </label>
          </div>

          {maxPlayersPerSide > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-gray-team-light">Gray</div>
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
                <div className="text-[11px] font-semibold uppercase text-aqua-team-light">Aqua</div>
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

          <label className="block text-xs text-foreground/60">
            Notat
            <textarea
              value={draft.note ?? ""}
              onChange={(e) => setDraft({ ...draft, note: e.target.value || null })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-navy-lighter/60 bg-navy-deep px-2 py-1.5 text-sm focus:border-gold/60 focus:outline-none"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-navy-lighter/60 px-3 py-1.5 text-xs text-foreground/60 hover:bg-navy-lighter/30"
            >
              Avbryt
            </button>
            <button
              onClick={save}
              className="rounded-lg border border-gold/60 bg-gold/20 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/30"
            >
              Lagre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
