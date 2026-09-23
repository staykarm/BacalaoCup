"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { shortCourseLabel } from "@/lib/courseHoles";
import { Player, TeamId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function TeamTable({ team, players, courses }: { team: TeamId; players: Player[]; courses: string[] }) {
  const teamName = team === "gray" ? "Gray (Joys)" : "Aquarellos";
  const sorted = players
    .filter((p) => p.team_id === team)
    .sort((a, b) => (a.hcp ?? 0) - (b.hcp ?? 0));

  return (
    <div className="rounded-2xl border border-card-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Image
          src={team === "gray" ? "/logos/gray.png" : "/logos/aquarellos.png"}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] shrink-0 rounded-full object-cover"
        />
        <span className="font-display text-base font-bold text-ink">{teamName}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1 text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-ink-light/60">
              <th className="pl-2 pr-2 font-semibold">Navn</th>
              <th className="px-2 text-right font-semibold">HCP</th>
              {courses.map((c) => (
                <th key={c} className="px-2 text-right font-semibold">
                  {shortCourseLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="bg-card-deep">
                <td className="whitespace-nowrap rounded-l-lg py-1.5 pl-2 font-semibold text-ink">
                  {p.name}
                  {p.is_captain && <span className="text-gold-deep"> (C)</span>}
                </td>
                <td className="px-2 py-1.5 text-right text-ink-light">{p.hcp !== null ? fmt(p.hcp) : "–"}</td>
                {courses.map((c, i) => (
                  <td
                    key={c}
                    className={`px-2 py-1.5 text-right font-bold text-ink ${i === courses.length - 1 ? "rounded-r-lg pr-2" : ""}`}
                  >
                    {p.course_strokes[c] ?? "–"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CourseStrokesModal({ onClose }: { onClose: () => void }) {
  const { players, days } = useTournament();
  const courses = [...days]
    .filter((d) => d.course)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => d.course as string)
    .filter((c, i, arr) => arr.indexOf(c) === i);

  return (
    <ModalShell title="HCP og mottatte slag" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-ink-light">
          Mottatte slag per bane, basert på spillerens handicap. Los Lagos har CR-verdi 72,6 (over par), så
          enkelte spillere får ett slag ekstra der.
        </p>
        <TeamTable team="gray" players={players} courses={courses} />
        <TeamTable team="aqua" players={players} courses={courses} />
      </div>
    </ModalShell>
  );
}
