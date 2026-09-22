export interface RestaurantInfo {
  /** `day.id` of the day this dinner is on. */
  day: string;
  name: string;
  address: string;
  time: string;
  description: string;
}

/** Researched from each restaurant's own site and press coverage. */
export const RESTAURANTS: RestaurantInfo[] = [
  {
    day: "fri",
    name: "Brasserie Astoria",
    address: "Av. del Prado 3, Nueva Andalucía",
    time: "21:30",
    description:
      "Internasjonal brasserie i Nueva Andalucía, åpnet i 2025 av lokale Eric Ebbing sammen med den svenske stjernekokken Björn Frantzén (Frantzén i Stockholm, tre Michelin-stjerner). Menyen blander klassiske brasserie-retter med middelhavs- og andalusiske innslag — mye sjømat, og retter som flamberes ved bordet.",
  },
  {
    day: "sat",
    name: "La Sala",
    address: "Calle Juan Belmonte, Puerto Banús",
    time: "21:30",
    description:
      "Livlig restaurant og bar rett ved marinaen i Puerto Banús, med internasjonal og middelhavsinspirert meny og spanske klassikere. Kjent for høy stemning med live musikk og underholdning utover kvelden.",
  },
];
