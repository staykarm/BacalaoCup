import { RESTAURANTS, RestaurantInfo } from "./restaurantInfo";

export interface AgendaEvent {
  time: string;
  label: string;
  icon: string;
  /** Street address, shown as a secondary line — set for dinner reservations. */
  address?: string;
  /** Set when this event is a meal at one of RESTAURANTS — lets the agenda link to its info. */
  restaurant?: RestaurantInfo;
}

const wedLunch = RESTAURANTS.find((r) => r.day === "wed" && r.name === "La Cabaña");
const thuLunch = RESTAURANTS.find((r) => r.day === "thu" && r.name === "Hacienda Los Naranjos");
const friLunch = RESTAURANTS.find((r) => r.day === "fri" && r.time === "Klubbhussnack");
const friDinner = RESTAURANTS.find((r) => r.day === "fri" && r.name === "Brasserie Astoria");
const satLunch = RESTAURANTS.find((r) => r.day === "sat" && r.time === "Frokost/lunsj");
const satDinner = RESTAURANTS.find((r) => r.day === "sat" && r.name === "La Sala");
const houseAddress = "C. los Lirios, Nueva Andalucía, 29660 Marbella, Málaga";

/** Extra agenda entries (dinners, social events) keyed by `day.id`, alongside golf and transport. */
export const AGENDA_EXTRAS: Record<string, AgendaEvent[]> = {
  wed: [{ time: "12:00", label: `Lunsj: ${wedLunch?.name}`, icon: "🥪", address: wedLunch?.address, restaurant: wedLunch }],
  thu: [
    { time: "13:30", label: `Lunsj: ${thuLunch?.name}`, icon: "🥪", address: thuLunch?.address, restaurant: thuLunch },
    { time: "16:00", label: "Pool Party", icon: "🏊" },
    { time: "19:30", label: "BBQ-middag", icon: "🍖", address: houseAddress },
  ],
  fri: [
    { time: "15:00", label: `Klubbhussnack: ${friLunch?.name}`, icon: "🥪", address: friLunch?.address, restaurant: friLunch },
    { time: "21:30", label: `Middag: ${friDinner?.name}`, icon: "🍽️", address: friDinner?.address, restaurant: friDinner },
  ],
  sat: [
    { time: "10:00", label: "Rydding av huset", icon: "🧹", address: houseAddress },
    { time: "12:00", label: `Frokost/lunsj: ${satLunch?.name}`, icon: "🥪", address: satLunch?.address, restaurant: satLunch },
    { time: "21:30", label: `Middag: ${satDinner?.name}`, icon: "🍽️", address: satDinner?.address, restaurant: satDinner },
  ],
};
