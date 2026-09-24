export interface RestaurantInfo {
  /** `day.id` of the day this meal is on. */
  day: string;
  name: string;
  address: string;
  time: string;
  description: string;
}

/** Researched from each restaurant's own site and press coverage. */
export const RESTAURANTS: RestaurantInfo[] = [
  {
    day: "wed",
    name: "La Cabaña",
    address: "Santana Golf, Carretera de Mijas, 29649 Mijas, Málaga",
    time: "Lunsj",
    description:
      "Klubbhusrestauranten på Santana Golf, drevet av restauratør Miguel Ramos. Meny basert på ferske, lokale råvarer i en uformell atmosfære — her spiser vi lunsj etter runden onsdag.",
  },
  {
    day: "thu",
    name: "Hacienda Los Naranjos",
    address: "Los Naranjos Golf, Nueva Andalucía, 29660 Marbella",
    time: "Lunsj",
    description:
      "Klubbhusrestauranten på Los Naranjos, en av de mest besøkte golfrestaurantene på Costa del Sol. Her spiser vi lunsj etter runden torsdag.",
  },
  {
    day: "fri",
    name: "Klubbhusrestauranten",
    address: "Marbella Club Golf Resort, Benahavís, Málaga",
    time: "Klubbhussnack",
    description:
      "Klubbhuset på Marbella Club Golf Resort har egen restaurant og kafé/bar med middelhavsinspirert meny. Her tar vi en klubbhussnack etter runden fredag.",
  },
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
    name: "Klubbhusrestauranten",
    address: "Avda. Louison Bobet 1-3, 29650 Mijas, Málaga",
    time: "Frokost/lunsj",
    description:
      "Klubbhuset på Mijas Golf (Los Lagos) har restaurant og snackbar med frokost- og lunsjmeny. Her spiser vi frokost/lunsj lørdag.",
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
