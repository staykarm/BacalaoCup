export interface TransportLeg {
  time: string;
  from: string;
  to: string;
}

/** Keyed by `day.id`. From Golf Service Booking 195305 (16 people, with golf bags). */
export const TRANSPORT_INFO: Record<string, TransportLeg[]> = {
  wed: [
    { time: "10:30", from: "Malaga lufthavn", to: "Santana Golf" },
    { time: "19:20", from: "Santana Golf", to: "Calle los Lirios" },
  ],
  thu: [
    { time: "07:50", from: "Calle los Lirios", to: "Los Naranjos Golf" },
    { time: "15:30", from: "Los Naranjos Golf", to: "Calle los Lirios" },
  ],
  fri: [
    { time: "09:00", from: "Calle los Lirios", to: "Marbella Club Resort" },
    { time: "16:00", from: "Marbella Club Resort", to: "Calle los Lirios" },
  ],
  sat: [
    { time: "11:15", from: "Calle los Lirios", to: "Mijas Golf (Los Lagos)" },
    { time: "19:30", from: "Mijas Golf (Los Lagos)", to: "Calle los Lirios" },
  ],
  sun: [{ time: "08:30", from: "Calle los Lirios", to: "Malaga lufthavn" }],
};
