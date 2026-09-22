"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTournament } from "@/context/TournamentContext";
import { LOCATION_TYPE_LABELS, LocationType, MapLocation } from "@/lib/types";
import { ModalShell } from "./ModalShell";

const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded-2xl bg-navy-light/40 sm:h-96" />,
});

const TYPE_ORDER: LocationType[] = ["course", "house", "restaurant"];

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function LocationRow({ location, onDelete }: { location: MapLocation; onDelete: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-2xl border border-navy-lighter/50 bg-navy-lighter/30 p-3">
      <div className="min-w-0">
        <div className="font-semibold text-foreground/90">{location.name}</div>
        {location.address && (
          <a
            href={mapsUrl(location.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-xs text-gold hover:underline"
          >
            {location.address}
          </a>
        )}
        {location.notes && <p className="mt-1 text-xs text-foreground/60">{location.notes}</p>}
      </div>
      <button
        onClick={onDelete}
        aria-label="Slett"
        className="shrink-0 rounded-full border border-navy-lighter/60 px-2 py-1 text-xs text-foreground/50 hover:bg-navy-lighter/40"
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                  {LOCATION_TYPE_LABELS[type]}
                </h3>
                <button
                  onClick={() => startAdd(type)}
                  className="rounded-lg border border-gold/50 bg-gold/10 px-2 py-1 text-[11px] font-semibold text-gold hover:bg-gold/20"
                >
                  + Legg til
                </button>
              </div>

              <div className="space-y-2">
                {items.map((loc) => (
                  <LocationRow key={loc.id} location={loc} onDelete={() => deleteLocation(loc.id)} />
                ))}
                {items.length === 0 && (
                  <p className="text-xs italic text-foreground/40">Ingen lagt inn ennå.</p>
                )}
              </div>

              {adding === type && (
                <div className="mt-3 space-y-2 rounded-xl border border-navy-lighter/60 bg-navy p-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Navn"
                    className="w-full rounded-xl border border-navy-lighter/60 bg-navy-light/60 px-2 py-1.5 text-sm focus:border-gold/60 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse"
                    className="w-full rounded-xl border border-navy-lighter/60 bg-navy-light/60 px-2 py-1.5 text-sm focus:border-gold/60 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notat (valgfritt)"
                    className="w-full rounded-xl border border-navy-lighter/60 bg-navy-light/60 px-2 py-1.5 text-sm focus:border-gold/60 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAdding(null)}
                      className="rounded-xl border border-navy-lighter/60 px-3 py-1.5 text-xs text-foreground/60 hover:bg-navy-lighter/30"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={save}
                      disabled={!name.trim()}
                      className="rounded-xl border border-gold/60 bg-gold/20 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/30 disabled:opacity-40"
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
