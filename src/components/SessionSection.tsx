"use client";

import { useState } from "react";
import { Match, Player, Session, FORMAT_LABELS } from "@/lib/types";
import { projectedPoints } from "@/lib/scoring";
import { useTournament } from "@/context/TournamentContext";
import { DailyForecast } from "@/lib/weather";
import { MatchRow } from "./MatchRow";
import { ScrambleFlights } from "./ScrambleFlights";
import { FormatInfoModal } from "./FormatInfoModal";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function SessionSection({
  session,
  matches,
  players,
  defaultOpen = false,
  hideNames = false,
  yrForecast = null,
}: {
  session: Session;
  matches: Match[];
  players: Player[];
  defaultOpen?: boolean;
  hideNames?: boolean;
  /** Yr's forecast for this session's day, shown as a discreet corner badge. Null/omitted = no badge. */
  yrForecast?: DailyForecast | null;
}) {
  const { activeSessionIds } = useTournament();
  const [open, setOpen] = useState(defaultOpen);
  const [formatInfoOpen, setFormatInfoOpen] = useState(false);

  const { gray, aqua } = projectedPoints(matches, [session]);
  const isScramble = session.format === "scramble";
  const played = isScramble
    ? matches.filter((m) => m.score_vs_par !== null).length
    : matches.filter((m) => m.result !== "not_played").length;
  const isActive = activeSessionIds.includes(session.id);
  const leader: "gray" | "aqua" | null = gray === aqua ? null : gray > aqua ? "gray" : "aqua";

  // A merged (mixed-format) session can hold matches worth different points, so derive the
  // "Xp/kamp" text from the matches themselves rather than trusting the session's single value.
  const matchPointValues = [...new Set(matches.map((m) => m.points))];
  const pointsLabel = isScramble
    ? `${fmt(session.points_per_match)}p`
    : matchPointValues.length <= 1
      ? `${fmt(session.points_per_match)}p/kamp`
      : `${fmt(Math.min(...matchPointValues))}–${fmt(Math.max(...matchPointValues))}p/kamp`;

  // A scramble session's own card stays plain white — who's leading already shows on
  // the Gray/Aqua total boxes inside it, so tinting the whole card too would just
  // double up (and the strong team colors wash out badly at low opacity over a full card).
  const cardClass = isActive && !isScramble
    ? leader === "gray"
      ? "border-gray-team bg-gray-team-bg/30 border-l-4"
      : leader === "aqua"
        ? "border-aqua-team bg-aqua-team-bg/30 border-l-4"
        : "border-gold bg-gold/10 border-l-4"
    : "border-card-border bg-card";

  // Every leader tint (gray, aqua, gold) and the inactive state all sit on a light fill now, so text stays ink-based throughout.
  const textClass = "text-ink-light/60";
  const titleClass = "text-ink";
  const grayScoreText = "text-ink";
  const aquaScoreText = "text-aqua-team-deep";
  const dashText = "text-ink-light/40";
  const borderTClass = "border-card-border";

  return (
    <div className={`overflow-hidden rounded-3xl border transition-colors ${cardClass}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`transition-transform ${textClass} ${open ? "rotate-90" : ""}`}>▶</span>
          <div>
            <div className={`font-semibold ${titleClass}`}>
              {session.name}
              {isActive && <span className="text-gold-deep"> - pågår</span>}
            </div>
            <div className={`text-[11px] uppercase tracking-wide ${textClass}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFormatInfoOpen(true);
                }}
                className="underline decoration-dotted underline-offset-2 hover:text-ink"
              >
                {FORMAT_LABELS[session.format]}
              </button>{" "}
              &middot; {pointsLabel} &middot; {played}/{matches.length}{" "}
              {isScramble ? "score registrert" : "spilt"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {yrForecast && (
            <span className="flex items-center gap-1 text-[10px] text-ink-light/50" title="Yr">
              <span aria-hidden>{yrForecast.emoji}</span>
              {Math.round(yrForecast.tempMax ?? 0)}°
            </span>
          )}
          <div className="text-sm font-bold">
            <span className={grayScoreText}>{fmt(gray)}</span>
            <span className={dashText}> – </span>
            <span className={aquaScoreText}>{fmt(aqua)}</span>
          </div>
        </div>
      </div>

      {open && (
        <div className={`space-y-2 border-t px-3 pb-3 pt-3 ${borderTClass}`}>
          {isScramble ? (
            <ScrambleFlights session={session} matches={matches} players={players} hideNames={hideNames} />
          ) : (
            matches.map((m) => (
              <MatchRow key={m.id} match={m} players={players} session={session} hideNames={hideNames} />
            ))
          )}
        </div>
      )}

      {formatInfoOpen && (
        <FormatInfoModal format={session.format} onClose={() => setFormatInfoOpen(false)} />
      )}
    </div>
  );
}
