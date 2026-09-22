"use client";

import { useTournament } from "@/context/TournamentContext";
import { RESTAURANTS } from "@/lib/restaurantInfo";
import { ModalShell } from "./ModalShell";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function RestaurantModal({ onClose }: { onClose: () => void }) {
  const { days } = useTournament();

  return (
    <ModalShell title="Restaurant" onClose={onClose}>
      <div className="space-y-5">
        {RESTAURANTS.map((r) => {
          const day = days.find((d) => d.id === r.day);

          return (
            <div key={r.name} className="rounded-2xl border border-card-border bg-white p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gold-deep">
                {day?.label ?? r.day} &middot; {r.time}
              </div>
              <div className="mb-1 font-display text-lg font-bold text-ink">{r.name}</div>
              <a
                href={mapsUrl(r.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 block text-xs text-gold-deep hover:underline"
              >
                {r.address}
              </a>
              <p className="text-sm leading-relaxed text-ink-light">{r.description}</p>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
