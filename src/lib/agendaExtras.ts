import { RESTAURANTS } from "./restaurantInfo";

export interface AgendaEvent {
  time: string;
  label: string;
  icon: string;
  /** Street address, shown as a secondary line — set for dinner reservations. */
  address?: string;
}

const astoria = RESTAURANTS.find((r) => r.name === "Brasserie Astoria");
const laSala = RESTAURANTS.find((r) => r.name === "La Sala");

/** Extra agenda entries (dinners, social events) keyed by `day.id`, alongside golf and transport. */
export const AGENDA_EXTRAS: Record<string, AgendaEvent[]> = {
  wed: [{ time: "13:00", label: "Lunsj", icon: "🥪" }],
  thu: [
    { time: "14:00", label: "Lunsj", icon: "🥪" },
    { time: "15:00", label: "Bassengfest", icon: "🏊" },
    { time: "19:30", label: "BBQ-middag", icon: "🍖" },
  ],
  fri: [{ time: "21:30", label: "Middag: Brasserie Astoria", icon: "🍽️", address: astoria?.address }],
  sat: [{ time: "21:30", label: "Middag: La Sala", icon: "🍽️", address: laSala?.address }],
};
