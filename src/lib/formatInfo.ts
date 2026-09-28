import { SessionFormat } from "./types";

/** Short, plain-language explanation of each spilleform, shown from a tap on the format label. */
export const FORMAT_INFO: Record<SessionFormat, string> = {
  singles: "Én mot én. Hver spiller spiller sin egen ball hele hullet. Hullspill — laget som vinner flest hull vinner kampen, ikke laveste score totalt.",
  fourball: "To spillere per lag, hver med sin egen ball hele hullet. Lagets beste nettoscore av de to telles på hvert hull. Hullspill mot det andre laget.",
  greensome: "Irish Greensome er en egen variant av Greensome. To spillere per lag, begge slår ut på hvert hull. På par 3 gjelder vanlig Greensome: laget velger beste utslag med én gang, og den andre spilleren tar andreslaget. På par 4 og par 5 slår begge spillerne et andreslag — men med partnerens ball (dere bytter baller) — og laget velger deretter hvilken av de to ballene dere fortsetter med. Fra der er det annenhver slag (som i foursomes) til ballen er i hull. Hullspill mot det andre laget.",
  scramble: "Alle på laget slår ut, og laget velger det beste slaget. Alle spiller neste slag derfra, og dere velger beste igjen — slik fortsetter det til hullet er ferdig. Ett samlet resultat for laget (score mot par), ikke hullspill hull for hull.",
  mixed: "Denne økten er en blanding av Fourball- og Singles-kamper. Se hver enkelt kamp for hvilket av de to formatene som gjelder der.",
};
