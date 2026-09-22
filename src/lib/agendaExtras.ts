export interface AgendaEvent {
  time: string;
  label: string;
  icon: string;
}

/** Extra agenda entries (dinners, social events) keyed by `day.id`, alongside golf and transport. */
export const AGENDA_EXTRAS: Record<string, AgendaEvent[]> = {
  thu: [
    { time: "15:00", label: "Bassengfest", icon: "🏊" },
    { time: "19:30", label: "BBQ-middag", icon: "🍖" },
  ],
  fri: [{ time: "21:30", label: "Middag: Brasserie Astoria", icon: "🍽️" }],
  sat: [{ time: "21:30", label: "Middag: La Sala", icon: "🍽️" }],
};
