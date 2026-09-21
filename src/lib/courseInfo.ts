export interface CourseInfo {
  name: string;
  location: string;
  designer: string;
  year: string;
  par: number;
  length: string;
  description: string;
}

/**
 * Keyed by the exact `course` string stored on the `days` row, so the
 * Baneinfo modal can look it up directly. Researched from each course's own
 * site and golf-travel listings — see the PR description for sources.
 */
export const COURSE_INFO: Record<string, CourseInfo> = {
  Santana: {
    name: "Santana Golf & Country Club",
    location: "Mellom La Cala de Mijas og Fuengirola",
    designer: "Cabell B. Robinson",
    year: "2004",
    par: 72,
    length: "6 207 m",
    description:
      "Banen ligger i åsene med fairways som slynger seg gjennom appelsin- og avokadolunder, med Mijas-fjellene i bakgrunnen. Det 8. hullet er et av banens lengste (ca. 650 meter), mens det avsluttende par 4-hullet er kantet av en innsjø hele veien på høyre side.",
  },
  Naranjos: {
    name: "Los Naranjos Golf Club",
    location: "Nueva Andalucía, Marbella",
    designer: "Robert Trent Jones Sr.",
    year: "1977",
    par: 72,
    length: "6 532 m",
    description:
      "En parkland-bane med brede fairways og strategisk plasserte bunkere og vannhindre. Front nine er relativt åpen, mens back nine er trangere og går gjennom appelsinlunder. Har vært vertskap for Marbella Ladies Open og PGA Professional Championship, og ble kåret til Costa del Sols bane av året i 2005 og 2008.",
  },
  "Marbella Club Resort": {
    name: "Marbella Club Golf Resort",
    location: "Benahavís",
    designer: "Dave Thomas",
    year: "1999",
    par: 73,
    length: "6 247 m",
    description:
      "Ligger i fjellene i Benahavís, ca. 20 minutter fra Marbella Club Hotel. Designeren Dave Thomas var selv Ryder Cup-spiller og nådde playoff i to British Open. Banen er kjent som en eksklusiv, velholdt layout med signaturpreg fra en av golfens mest erfarne banearkitekter.",
  },
  "Mijas Los Lagos": {
    name: "Mijas Golf – Los Lagos",
    location: "Mijas, Costa del Sol",
    designer: "Robert Trent Jones Sr.",
    year: "1976 (renovert 2012)",
    par: 71,
    length: "6 367 m",
    description:
      "Brede fairways med noen skogholt som hindre, men det er banens ni innsjøer som gir den navnet og definerer spillet — sammen med mange bunkere. Myke høydeforskjeller og store greener. Totalrenovert i 2012 med større greener bygget til USGA-standard og utvidede teesteder, uten å røre Trent Jones' opprinnelige design.",
  },
};
