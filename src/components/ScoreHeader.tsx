"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { hasLiveMatches, pointsToClinch, projectedPoints, totalPoints } from "@/lib/scoring";
import { TeamId } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function ScoreHeader({
  onOpenAdmin,
  onOpenTeam,
}: {
  onOpenAdmin: () => void;
  onOpenTeam: (team: TeamId) => void;
}) {
  const { matches, sessions } = useTournament();
  const { gray, aqua, possible } = projectedPoints(matches, sessions);
  const settled = totalPoints(matches, sessions);
  const grayLive = Math.max(0, gray - settled.gray);
  const aquaLive = Math.max(0, aqua - settled.aqua);
  const isLive = hasLiveMatches(matches);

  // "Won" is based on officially finalized points only — a live lead can still flip.
  const clinch = pointsToClinch(settled.gray, settled.aqua, settled.possible);
  const winner: TeamId | null = clinch.gray === 0 ? "gray" : clinch.aqua === 0 ? "aqua" : null;
  // How much each team would still need if every live lead held — shown alongside the
  // secure figure above, never in place of it (a live lead can still flip).
  const clinchProjected = pointsToClinch(gray, aqua, possible);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-lighter/60 bg-navy-light/90 backdrop-blur supports-[backdrop-filter]:bg-navy-light/75">
      <div className="relative mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <button
          onClick={onOpenAdmin}
          aria-label="Admin"
          className="absolute right-2 top-2 rounded-full p-1 text-foreground/30 hover:text-foreground/60 sm:right-4"
        >
          ⚙
        </button>

        <div className="flex items-center justify-center gap-2 text-center">
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-red-500" : "bg-gold"}`} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold sm:text-xs">
            Bacalao Cup MMXXVI &middot; Marbella
            {isLive && <span className="ml-2 text-red-400">&middot; LIVE / PROJECTED</span>}
          </p>
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-red-500" : "bg-gold"}`} />
        </div>

        {winner && (
          <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
            <span className={winner === "gray" ? "text-gray-team-light" : "text-aqua-team-light"}>
              🏆 {winner === "gray" ? "Gray (Joys)" : "Aquarellos"} har vunnet cupen!
            </span>
          </p>
        )}

        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button
            onClick={() => onOpenTeam("gray")}
            className="flex min-w-0 items-center justify-end gap-2 rounded-2xl px-2 py-1 transition hover:bg-white/5 sm:gap-4"
          >
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <Image
                src="/logos/gray.png"
                alt="Gray (Joys)"
                width={32}
                height={32}
                className="h-5 w-5 shrink-0 rounded-full object-cover sm:h-8 sm:w-8"
              />
              <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-gray-team-light sm:text-sm">
                Gray (Joys)
              </span>
            </div>
            <div className="text-right">
              {/* Black-on-gray, matching the team's own flat color swatch used everywhere else.
                  Projected total sits inline, right after the secure number, so the chip's
                  own height never depends on whether there's a live match adding to it. */}
              <div className="whitespace-nowrap rounded-2xl bg-gray-team-light px-4 py-0.5 font-display text-4xl font-bold text-ink sm:px-5 sm:py-1 sm:text-6xl">
                {fmt(settled.gray)}
                {grayLive > 0 && (
                  <span className="ml-1 text-xl text-ink/60 sm:text-3xl">({fmt(gray)})</span>
                )}
              </div>
            </div>
          </button>

          <div className="text-center text-lg font-bold text-foreground/40 sm:text-2xl">–</div>

          <button
            onClick={() => onOpenTeam("aqua")}
            className="flex min-w-0 items-center justify-start gap-2 rounded-2xl px-2 py-1 transition hover:bg-white/5 sm:gap-4"
          >
            <div className="text-left">
              {/* White-on-blue, matching the team's own flat color swatch used everywhere else. */}
              <div className="whitespace-nowrap rounded-2xl bg-aqua-team px-4 py-0.5 font-display text-4xl font-bold text-white sm:px-5 sm:py-1 sm:text-6xl">
                {fmt(settled.aqua)}
                {aquaLive > 0 && (
                  <span className="ml-1 text-xl text-white/70 sm:text-3xl">({fmt(aqua)})</span>
                )}
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-aqua-team-light sm:text-sm">
                Aquarellos
              </span>
              <Image
                src="/logos/aquarellos.png"
                alt="Aquarellos"
                width={32}
                height={32}
                className="h-5 w-5 shrink-0 rounded-full object-cover sm:h-8 sm:w-8"
              />
            </div>
          </button>
        </div>

        <ScoreBar
          graySettled={settled.gray}
          grayLive={grayLive}
          aquaSettled={settled.aqua}
          aquaLive={aquaLive}
          possible={possible}
          clinchGray={winner ? null : clinch.gray}
          clinchAqua={winner ? null : clinch.aqua}
          clinchGrayProjected={winner ? null : clinchProjected.gray}
          clinchAquaProjected={winner ? null : clinchProjected.aqua}
          className="mt-3 w-full"
        />
      </div>
    </header>
  );
}
