"use client";

import { RestaurantInfo } from "@/lib/restaurantInfo";
import { ModalShell } from "./ModalShell";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** A single restaurant's info, linked from the agenda — unlike RestaurantModal, which lists every meal. */
export function RestaurantInfoModal({ restaurant, onClose }: { restaurant: RestaurantInfo; onClose: () => void }) {
  return (
    <ModalShell title={restaurant.name} onClose={onClose}>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gold-deep">{restaurant.time}</div>
      <a
        href={mapsUrl(restaurant.address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 block text-xs text-gold-deep hover:underline"
      >
        {restaurant.address}
      </a>
      <p className="text-sm leading-relaxed text-ink-light">{restaurant.description}</p>
    </ModalShell>
  );
}
