"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { hasLiveMatches, pointsToClinch, projectedPoints } from "@/lib/scoring";
import { computeDayBreakdown, computePairStats, computePlayerStats } from "@/lib/stats";
import { FORMAT_LABELS } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function StandingsModal({ onClose }: { onClose: () => void }) {
  const { days, sessions, matches, players } = useTournament();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const { gray, aqua, possible } = projectedPoints(matches);
  const isLive = hasLiveMatches(matches);
  const clinch = pointsToClinch(gray, aqua, possible);
  // Projected points are provisionally split as soon as a match starts, so the
  // pool of points still genuinely up for grabs can be smaller than `clinch`
  // assumes. Cap against that so we never ask a team for more than remains.
  const remaining = Math.max(0, possible - gray - aqua);
  const grayEliminated = clinch.gray > 0 && clinch.gray > remaining;
  const aquaEliminated = clinch.aqua > 0 && clinch.aqua > remaining;
  const dayBreakdown = computeDayBreakdown(days, sessions, matches);
  const playerStats = computePlayerStats(matches, players);
  const grayPlayerStats = playerStats.filter((s) => s.player.team_id === "gray");
  const aquaPlayerStats = playerStats.filter((s) => s.player.team_id === "aqua");
  const pairStats = computePairStats(matches, players).filter((p) => p.winScore > 0);
  const topWinScore = pairStats[0]?.winScore ?? 0;
  const bestPairs = pairStats.filter((p) => p.winScore === topWinScore && topWinScore > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-navy-lighter/60 bg-navy sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-navy-lighter/60 px-5 py-4">
          <h2 className="font-serif text-lg font-bold uppercase tracking-wide text-gold sm:text-xl">
            Stilling &middot; Bacalao Cup MMXXVI
            {isLive && <span className="ml-2 text-sm text-red-400">&middot; LIVE / PROJECTED</span>}
          </h2>
          <button
            onClick={onClose}
            aria-label="Lukk"
            className="rounded-full border border-navy-lighter/60 px-3 py-1 text-sm text-foreground/70 hover:bg-navy-light"
          >
            Lukk ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {/* Head to head */}
          <section className="mb-8">
            <div className="grid grid-cols-3 items-end gap-2 text-center">
              <div>
                <Image
                  src="/logos/gray.png"
                  alt="Gray (Joys)"
                  width={48}
                  height={48}
                  className="mx-auto mb-1 h-10 w-10 rounded-full object-cover sm:h-14 sm:w-14"
                />
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-team-light">
                  Gray (Joys)
                </div>
                <div className="font-serif text-4xl font-bold text-gray-team-light sm:text-6xl">
                  {fmt(gray)}
                </div>
              </div>
              <div className="pb-2 text-sm text-foreground/40">av {fmt(possible)}</div>
              <div>
                <Image
                  src="/logos/aquarellos.png"
                  alt="Aquarellos"
                  width={48}
                  height={48}
                  className="mx-auto mb-1 h-10 w-10 rounded-full object-cover sm:h-14 sm:w-14"
                />
                <div className="text-xs font-semibold uppercase tracking-wider text-aqua-team-light">
                  Aquarellos
                </div>
                <div className="font-serif text-4xl font-bold text-aqua-team-light sm:text-6xl">
                  {fmt(aqua)}
                </div>
              </div>
            </div>
            <ScoreBar gray={gray} aqua={aqua} possible={possible} className="mt-4" />

            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs sm:text-sm">
              <div className="rounded-xl border border-gray-team-deep/50 bg-gray-team-bg/40 px-3 py-2">
                {clinch.gray === 0 ? (
                  <span className="font-semibold text-gray-team-light">Gray har sikret cupen! 🏆</span>
                ) : grayEliminated ? (
                  <span className="text-foreground/50">Gray kan ikke lenger vinne cupen</span>
                ) : (
                  <>
                    <span className="font-semibold text-gray-team-light">Gray</span> trenger{" "}
                    <span className="font-bold text-gold">{fmt(clinch.gray)}</span> poeng til
                  </>
                )}
              </div>
              <div className="rounded-xl border border-aqua-team-deep/50 bg-aqua-team-bg/40 px-3 py-2">
                {clinch.aqua === 0 ? (
                  <span className="font-semibold text-aqua-team-light">Aqua har sikret cupen! 🏆</span>
                ) : aquaEliminated ? (
                  <span className="text-foreground/50">Aqua kan ikke lenger vinne cupen</span>
                ) : (
                  <>
                    <span className="font-semibold text-aqua-team-light">Aqua</span> trenger{" "}
                    <span className="font-bold text-gold">{fmt(clinch.aqua)}</span> poeng til
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Per day/session breakdown */}
          <section className="mb-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">
              Poeng per dag &amp; økt
            </h3>
            <div className="space-y-4">
              {dayBreakdown.map(({ day, gray: dGray, aqua: dAqua, sessions: dSessions }) => (
                <div key={day.id} className="rounded-xl border border-navy-lighter/50 bg-navy-light/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground/90">{day.label}</span>
                    <span className="text-xs text-foreground/50">
                      <span className="text-gray-team-light">{fmt(dGray)}</span>
                      {" – "}
                      <span className="text-aqua-team-light">{fmt(dAqua)}</span>
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {dSessions.map((s) => (
                      <li
                        key={s.session.id}
                        className="flex items-center justify-between text-xs text-foreground/60"
                      >
                        <span>
                          {s.session.name}{" "}
                          <span className="text-foreground/30">
                            ({FORMAT_LABELS[s.session.format]})
                          </span>
                        </span>
                        <span>
                          <span className="text-gray-team-light">{fmt(s.gray)}</span>
                          {" – "}
                          <span className="text-aqua-team-light">{fmt(s.aqua)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Best pair */}
          {bestPairs.length > 0 && (
            <section className="mb-8">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">
                Mest vinnende par
              </h3>
              <div className="flex flex-wrap gap-2">
                {bestPairs.map((p) => (
                  <div
                    key={p.names}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      p.team === "gray"
                        ? "border-gray-team-deep/60 bg-gray-team-bg/40 text-gray-team-light"
                        : "border-aqua-team-deep/60 bg-aqua-team-bg/40 text-aqua-team-light"
                    }`}
                  >
                    {p.names} &middot; {fmt(p.winScore)} p ({p.wins}V {p.halved}D av {p.played})
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Player stats */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">
              Statistikk per spiller
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <PlayerStatTable title="Gray (Joys)" accent="gray" rows={grayPlayerStats} />
              <PlayerStatTable title="Aquarellos" accent="aqua" rows={aquaPlayerStats} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PlayerStatTable({
  title,
  accent,
  rows,
}: {
  title: string;
  accent: "gray" | "aqua";
  rows: ReturnType<typeof computePlayerStats>;
}) {
  const headerColor = accent === "gray" ? "text-gray-team-light" : "text-aqua-team-light";
  const logoSrc = accent === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png";

  return (
    <div className="overflow-hidden rounded-xl border border-navy-lighter/50">
      <div
        className={`flex items-center gap-2 bg-navy-light/60 px-3 py-2 text-xs font-bold uppercase tracking-wider ${headerColor}`}
      >
        <Image src={logoSrc} alt={title} width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
        {title}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-foreground/40">
            <th className="px-3 py-1.5 text-left font-medium">Spiller</th>
            <th className="px-2 py-1.5 text-right font-medium">V</th>
            <th className="px-2 py-1.5 text-right font-medium">T</th>
            <th className="px-2 py-1.5 text-right font-medium">D</th>
            <th className="px-3 py-1.5 text-right font-medium">Poeng</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.player.id} className="border-t border-navy-lighter/40">
              <td className="px-3 py-1.5 text-foreground/90">{r.player.name}</td>
              <td className="px-2 py-1.5 text-right text-foreground/60">{r.wins}</td>
              <td className="px-2 py-1.5 text-right text-foreground/60">{r.losses}</td>
              <td className="px-2 py-1.5 text-right text-foreground/60">{r.halved}</td>
              <td className="px-3 py-1.5 text-right font-semibold text-gold">{fmt(r.pointsContributed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
