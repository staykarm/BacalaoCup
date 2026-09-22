"use client";

import dynamic from "next/dynamic";
import { useTournament } from "@/context/TournamentContext";
import { LOCATION_TYPE_LABELS, LocationType, MapLocation } from "@/lib/types";
import { ModalShell } from "./ModalShell";

const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded-2xl bg-card-deep sm:h-96" />,
});

const TYPE_ORDER: LocationType[] = ["course", "house", "restaurant"];

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function LocationRow({ location }: { location: MapLocation }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white p-3">
      <div className="font-semibold text-ink">{location.name}</div>
      {location.address && (
        <a
          href={mapsUrl(location.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 block truncate text-xs text-gold-deep hover:underline"
        >
          {location.address}
        </a>
      )}
      {location.notes && <p className="mt-1 text-xs text-ink-light">{location.notes}</p>}
    </div>
  );
}

export function KartModal({ onClose }: { onClose: () => void }) {
  const { locations } = useTournament();

  return (
    <ModalShell title="Kart" onClose={onClose}>
      <div className="space-y-6">
        <MapView />

        {TYPE_ORDER.map((type) => {
          const items = locations.filter((l) => l.type === type).sort((a, b) => a.sort_order - b.sort_order);

          return (
            <section key={type}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">
                {LOCATION_TYPE_LABELS[type]}
              </h3>

              <div className="space-y-2">
                {items.map((loc) => (
                  <LocationRow key={loc.id} location={loc} />
                ))}
                {items.length === 0 && <p className="text-xs italic text-ink-light/60">Ingen lagt inn ennå.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </ModalShell>
  );
}
