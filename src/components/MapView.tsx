"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTournament } from "@/context/TournamentContext";
import { LocationType, MapLocation } from "@/lib/types";

// Leaflet's default marker icons reference image files that bundlers don't
// resolve automatically — point them at the CDN copy instead.
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MARBELLA_CENTER: [number, number] = [36.51, -4.89];

const TYPE_MARKER_LABEL: Record<LocationType, string> = {
  course: "⛳",
  house: "🏠",
  restaurant: "🍽️",
};

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    );
    if (!res.ok) return null;
    const results = await res.json();
    if (!results?.[0]) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

export function MapView() {
  const { locations, updateLocationCoords } = useTournament();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const geocodingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    leafletMapRef.current = L.map(mapRef.current).setView(MARBELLA_CENTER, 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(leafletMapRef.current);

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Geocode any location missing coordinates, then persist the result.
  useEffect(() => {
    for (const loc of locations) {
      if (loc.lat !== null && loc.lng !== null) continue;
      if (!loc.address) continue;
      if (geocodingRef.current.has(loc.id)) continue;
      geocodingRef.current.add(loc.id);

      geocode(loc.address).then((coords) => {
        if (coords) updateLocationCoords(loc.id, coords.lat, coords.lng);
      });
    }
  }, [locations, updateLocationCoords]);

  // Keep markers in sync with the location list.
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const withCoords = locations.filter(
      (l): l is MapLocation & { lat: number; lng: number } => l.lat !== null && l.lng !== null
    );
    const seen = new Set<string>();

    for (const loc of withCoords) {
      seen.add(loc.id);
      const existing = markersRef.current.get(loc.id);
      const popup = `<b>${TYPE_MARKER_LABEL[loc.type]} ${loc.name}</b>${loc.notes ? `<br>${loc.notes}` : ""}`;

      if (existing) {
        existing.setLatLng([loc.lat, loc.lng]).setPopupContent(popup);
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup(popup);
        markersRef.current.set(loc.id, marker);
      }
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((l) => [l.lat, l.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [locations]);

  return <div ref={mapRef} className="h-72 w-full rounded-xl sm:h-96" />;
}
