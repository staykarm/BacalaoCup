"use client";

import { useTournament } from "@/context/TournamentContext";
import { ActivityLogEntry, Match, Player, RESULT_LABELS, Session, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmtVsPar(n: number | null) {
  if (n === null) return "–";
  if (n === 0) return "PAR";
  return n > 0 ? `+${n}` : `${n}`;
}

/** Empty string (not null) when there are no named players, so `|| fallback` works at call sites. */
function sideNames(ids: (string | null)[], players: Player[]): string {
  return ids
    .filter((id): id is string => !!id)
    .map((id) => players.find((p) => p.id === id)?.name ?? id)
    .join(" / ");
}

function FeedRow({
  entry,
  match,
  session,
  players,
  hideNames,
}: {
  entry: ActivityLogEntry;
  match: Match;
  session: Session;
  players: Player[];
  hideNames: boolean;
}) {
  const isScramble = session.format === "scramble";
  const flightTeam = match.flight_team as TeamId | null;

  const grayLabel = hideNames ? "Gray (Joys)" : sideNames([match.gray_player1, match.gray_player2], players) || "Gray (Joys)";
  const aquaLabel = hideNames ? "Aquarellos" : sideNames([match.aqua_player1, match.aqua_player2], players) || "Aquarellos";
  const flightLabel = hideNames
    ? flightTeam === "gray"
      ? "Gray (Joys)"
      : "Aquarellos"
    : sideNames(match.flight_players, players) || (flightTeam === "gray" ? "Gray (Joys)" : "Aquarellos");

  const time = new Date(entry.created_at).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });

  let icon = "⛳";
  let text: string;

  if (entry.kind === "started") {
    icon = "▶️";
    text = isScramble ? `${flightLabel} er i gang` : `${grayLabel} vs ${aquaLabel} er i gang`;
  } else if (entry.kind === "finished") {
    icon = "🏁";
    text = isScramble
      ? `${flightLabel} er ferdig`
      : `${RESULT_LABELS[entry.result ?? "not_played"]} — ${grayLabel} vs ${aquaLabel}`;
  } else {
    // kind === "hole"
    if (isScramble) {
      text = `${flightLabel}: hull ${entry.hole_number} i ${fmtVsPar(entry.score_vs_par)}`;
    } else {
      icon = entry.hole_result === "gray" ? "⚪" : entry.hole_result === "aqua" ? "🔵" : "➖";
      const holeText =
        entry.hole_result === "gray" ? "Gray tok hullet" : entry.hole_result === "aqua" ? "Aqua tok hullet" : "Hullet ble delt";
      text = `Hull ${entry.hole_number}: ${holeText} — ${grayLabel} vs ${aquaLabel}`;
    }
  }

  return (
    <div className="flex items-start gap-3 border-b border-card-border px-4 py-3 last:border-0">
      <span className="shrink-0 text-lg leading-none" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{text}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-light/60">{session.name}</p>
      </div>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-light/50">{time}</span>
    </div>
  );
}

export function FeedModal({ onClose }: { onClose: () => void }) {
  const { activityLog, matches, sessions, players, days } = useTournament();

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
            />
          ))}
        </div>
      )}
    </ModalShell>
  );
}
