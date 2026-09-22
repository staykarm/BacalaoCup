"use client";

import { useState } from "react";
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

function LocationRow({ location, onDelete }: { location: MapLocation; onDelete: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-2xl border border-card-border bg-white p-3">
      <div className="min-w-0">
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
      <button
        onClick={onDelete}
        aria-label="Slett"
        className="shrink-0 rounded-full border border-card-border px-2 py-1 text-xs text-ink-light hover:bg-card-deep"
      >
        ✕
      </button>
    </div>
  );
}

export function KartModal({ onClose }: { onClose: () => void }) {
  const { locations, addLocation, deleteLocation } = useTournament();
  const [adding, setAdding] = useState<LocationType | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  function startAdd(type: LocationType) {
    setName("");
    setAddress("");
    setNotes("");
    setAdding(type);
  }

  async function save() {
    if (!adding || !name.trim()) return;
    await addLocation(adding, name.trim(), address.trim() || null, notes.trim() || null);
    setAdding(null);
  }

  return (
    <ModalShell title="Kart" onClose={onClose}>
      <div className="space-y-6">
        <MapView />

        {TYPE_ORDER.map((type) => {
          const items = locations.filter((l) => l.type === type).sort((a, b) => a.sort_order - b.sort_order);

          return (
            <section key={type}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-light">
                  {LOCATION_TYPE_LABELS[type]}
                </h3>
                <button
                  onClick={() => startAdd(type)}
                  className="rounded-lg border border-gold-deep/50 bg-gold/10 px-2 py-1 text-[11px] font-semibold text-gold-deep hover:bg-gold/20"
                >
                  + Legg til
                </button>
              </div>

              <div className="space-y-2">
                {items.map((loc) => (
                  <LocationRow key={loc.id} location={loc} onDelete={() => deleteLocation(loc.id)} />
                ))}
                {items.length === 0 && (
                  <p className="text-xs italic text-ink-light/60">Ingen lagt inn ennå.</p>
                )}
              </div>

              {adding === type && (
                <div className="mt-3 space-y-2 rounded-xl border border-card-border bg-card-deep p-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Navn"
                    className="w-full rounded-xl border border-card-border bg-white px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse"
                    className="w-full rounded-xl border border-card-border bg-white px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notat (valgfritt)"
                    className="w-full rounded-xl border border-card-border bg-white px-2 py-1.5 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAdding(null)}
                      className="rounded-xl border border-card-border px-3 py-1.5 text-xs text-ink-light hover:bg-white"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={save}
                      disabled={!name.trim()}
                      className="rounded-xl border border-gold-deep/60 bg-gold/20 px-3 py-1.5 text-xs font-semibold text-gold-deep hover:bg-gold/30 disabled:opacity-40"
                    >
                      Lagre
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </ModalShell>
  );
}
