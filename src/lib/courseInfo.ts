export interface CourseInfo {
  name: string;
  location: string;
  designer: string;
  year: string;
  par: number;
  /** Yellow tee, matching the per-hole data in courseHoles.ts. */
  length: string;
  description: string;
  website: string;
}

/**
 * Keyed by the exact `course` string stored on the `days` row, so the
 * Baneinfo modal can look it up directly. Researched from each course's own
 * site and golf-travel listings; par/length cross-checked against the real
 * Yellow-tee scorecards used for the per-hole data in courseHoles.ts.
 */
export const COURSE_INFO: Record<string, CourseInfo> = {
  Santana: {
    name: "Santana Golf & Country Club",
    location: "Mellom La Cala de Mijas og Fuengirola",
    designer: "Cabell B. Robinson",
    year: "2004",
    par: 72,
    length: "5 654 m",
    description:
      "Banen ligger i åsene med fairways som slynger seg gjennom appelsin- og avokadolunder, med Mijas-fjellene i bakgrunnen. Det 8. hullet er et av banens lengste (over 500 meter fra gult utslag), mens det avsluttende par 4-hullet er kantet av en innsjø hele veien på høyre side. Klubbhuset har restaurant.",
    website: "https://santanagolf.com",
  },
  Naranjos: {
    name: "Los Naranjos Golf Club",
    location: "Nueva Andalucía, Marbella",
    designer: "Robert Trent Jones Sr.",
    year: "1977",
    par: 72,
    length: "6 038 m",
    description:
      "En parkland-bane med brede fairways og strategisk plasserte bunkere og vannhindre. Front nine er relativt åpen, mens back nine er trangere og går gjennom appelsinlunder. Har vært vertskap for Marbella Ladies Open og PGA Professional Championship, og ble kåret til Costa del Sols bane av året i 2005 og 2008.",
    website: "https://losnaranjos.com",
  },
  "Marbella Club Resort": {
    name: "Marbella Club Golf Resort",
    location: "Benahavís",
    designer: "Dave Thomas",
    year: "1999",
    par: 72,
    length: "5 724 m",
    description:
      "Ligger i fjellene i Benahavís, ca. 20 minutter fra Marbella Club Hotel, med utsikt mot Gibraltar og den afrikanske kysten på klare dager. Designeren Dave Thomas var selv Ryder Cup-spiller og nådde playoff i to British Open. Front nine har tre påfølgende par 5-hull (6, 7 og 8) — en tidlig utfordring før banen åpner seg mot fjellene.",
    website: "https://www.marbellaclub.com/golf",
  },
  "Mijas Los Lagos": {
    name: "Mijas Golf – Los Lagos",
    location: "Mijas, Costa del Sol",
    designer: "Robert Trent Jones Sr.",
    year: "1976 (renovert 2012)",
    par: 72,
    length: "6 307 m",
    description:
      "Brede fairways med noen skogholt som hindre, men det er banens ni innsjøer som gir den navnet og definerer spillet — sammen med mange bunkere. Myke høydeforskjeller og store greener. Totalrenovert i 2012 med større greener bygget til USGA-standard og utvidede teesteder, uten å røre Trent Jones' opprinnelige design. Det 5. hullet er en av Costa del Sols lengste par 5-er.",
    website: "https://mijasgolf.org/en/los-lagos/",
  },
};
