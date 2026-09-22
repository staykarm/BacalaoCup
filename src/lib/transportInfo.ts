export interface TransportLeg {
  time: string;
  from: string;
  to: string;
}

/** Keyed by `day.id`. From Golf Service Booking 195305 (16 people, with golf bags). */
export const TRANSPORT_INFO: Record<string, TransportLeg[]> = {
  wed: [
    { time: "10:30", from: "Malaga lufthavn", to: "Santana Golf" },
    { time: "19:00", from: "Santana Golf", to: "Puerto Banús-området" },
  ],
  thu: [
    { time: "07:40", from: "Puerto Banús-området", to: "Los Naranjos Golf" },
    { time: "15:30", from: "Los Naranjos Golf", to: "Puerto Banús-området" },
  ],
  fri: [
    { time: "09:00", from: "Puerto Banús-området", to: "Marbella Club Resort" },
    { time: "15:30", from: "Marbella Club Resort", to: "Puerto Banús-området" },
  ],
  sat: [
    { time: "12:00", from: "Puerto Banús-området", to: "Mijas Golf (Los Lagos)" },
    { time: "19:00", from: "Mijas Golf (Los Lagos)", to: "Puerto Banús-området" },
  ],
};
