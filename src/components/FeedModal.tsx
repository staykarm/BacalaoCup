"use client";

import { ReactNode } from "react";
import { useTournament } from "@/context/TournamentContext";
import { usePlayerModal } from "@/context/PlayerModalContext";
import { ActivityLogEntry, Match, Player, RESULT_LABELS, Session, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmtVsPar(n: number | null) {
  if (n === null) return "–";
  if (n === 0) return "PAR";
  return n > 0 ? `+${n}` : `${n}`;
}

/** A side's player name(s), each clickable to open that player's own modal — falls
 * back to the plain team label when names are hidden or there's no one named. */
function SideNames({
  ids,
  fallback,
  hideNames,
  players,
  onSelectPlayer,
}: {
  ids: (string | null)[];
  fallback: string;
  hideNames: boolean;
  players: Player[];
  onSelectPlayer: (playerId: string) => void;
}) {
  const valid = hideNames ? [] : ids.filter((id): id is string => !!id);
  if (valid.length === 0) return <>{fallback}</>;
  return (
    <>
      {valid.map((id, i) => {
        const p = players.find((pp) => pp.id === id);
        return (
          <span key={id}>
            {i > 0 && " / "}
            <button onClick={() => onSelectPlayer(id)} className="hover:underline">
              {p?.name ?? id}
            </button>
          </span>
        );
      })}
    </>
  );
}

function FeedRow({
  entry,
  match,
  session,
  players,
  hideNames,
  onSelectPlayer,
}: {
  entry: ActivityLogEntry;
  match: Match;
  session: Session;
  players: Player[];
  hideNames: boolean;
  onSelectPlayer: (playerId: string) => void;
}) {
  const isScramble = session.format === "scramble";
  const flightTeam = match.flight_team as TeamId | null;

  const grayNode = (
    <SideNames
      ids={[match.gray_player1, match.gray_player2]}
      fallback="Gray (Joys)"
      hideNames={hideNames}
      players={players}
      onSelectPlayer={onSelectPlayer}
    />
  );
  const aquaNode = (
    <SideNames
      ids={[match.aqua_player1, match.aqua_player2]}
      fallback="Aquarellos"
      hideNames={hideNames}
      players={players}
      onSelectPlayer={onSelectPlayer}
    />
  );
  const flightNode = (
    <SideNames
      ids={match.flight_players}
      fallback={flightTeam === "gray" ? "Gray (Joys)" : "Aquarellos"}
      hideNames={hideNames}
      players={players}
      onSelectPlayer={onSelectPlayer}
    />
  );

  const time = new Date(entry.created_at).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });

  let icon = "⛳";
  let content: ReactNode;

  if (entry.kind === "started") {
    icon = "▶️";
    content = isScramble ? <>{flightNode} er i gang</> : <>{grayNode} vs {aquaNode} er i gang</>;
  } else if (entry.kind === "finished") {
    icon = "🏁";
    content = isScramble ? (
      <>{flightNode} er ferdig</>
    ) : (
      <>
        {RESULT_LABELS[entry.result ?? "not_played"]} — {grayNode} vs {aquaNode}
      </>
    );
  } else {
    // kind === "hole"
    if (isScramble) {
      content = (
        <>
          {flightNode}: hull {entry.hole_number} i {fmtVsPar(entry.score_vs_par)}
        </>
      );
    } else {
      icon = entry.hole_result === "gray" ? "⚪" : entry.hole_result === "aqua" ? "🔵" : "➖";
      const holeText =
        entry.hole_result === "gray" ? "Gray tok hullet" : entry.hole_result === "aqua" ? "Aqua tok hullet" : "Hullet ble delt";
      content = (
        <>
          Hull {entry.hole_number}: {holeText} — {grayNode} vs {aquaNode}
        </>
      );
    }
  }

  return (
    <div className="flex items-start gap-3 border-b border-card-border px-4 py-3 last:border-0">
      <span className="shrink-0 text-lg leading-none" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{content}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-light/60">{session.name}</p>
      </div>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-light/50">{time}</span>
    </div>
  );
}

export function FeedModal({ onClose }: { onClose: () => void }) {
  const { activityLog, matches, sessions, players, days } = useTournament();
  const { openPlayer } = usePlayerModal();

  const hideNamesBySession = new Map(
    sessions.map((s) => [s.id, days.find((d) => d.id === s.day_id)?.hide_names ?? false])
  );

  const rows = activityLog
    .map((entry) => ({
      entry,
      match: matches.find((m) => m.id === entry.match_id),
      session: sessions.find((s) => s.id === entry.session_id),
    }))
    .filter((r): r is { entry: ActivityLogEntry; match: Match; session: Session } => !!r.match && !!r.session);

  return (
    <ModalShell title="Feed" onClose={onClose}>
      {rows.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-ink-light">
          Ingen hendelser registrert ennå. Følg med her etter hvert som kamper starter og hull registreres.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-card-border">
          {rows.map(({ entry, match, session }) => (
            <FeedRow
              key={entry.id}
              entry={entry}
              match={match}
              session={session}
              players={players}
              hideNames={hideNamesBySession.get(session.id) ?? false}
              onSelectPlayer={openPlayer}
            />
          ))}
        </div>
      )}
    </ModalShell>
  );
}
