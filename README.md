# Bacalao Cup MMXXV

Live app for golfturneringen **Bacalao Cup MMXXV** i Marbella (7.–10. oktober 2025).
Viser kampoppsett, starttider og resultater for alle dager/økter, med en global
stillingslinje og en detaljert stillingsmodal med statistikk. Alle 15 spillerne kan
redigere direkte i appen, og endringer vises hos alle andre med det samme via
Supabase Realtime — ingen innlogging kreves i denne versjonen.

Bygget med Next.js (App Router) + TypeScript + Tailwind CSS, med Supabase
(Postgres + Realtime) som backend.

## Funksjoner

- Faner per turneringsdag (Onsdag/Torsdag/Fredag/Lørdag) med bane
- Ekspanderbare økter (Fourball, Greensome, Singles, Scramble) med alle kamper
- Inline redigering av starttid, spillere/par og poeng per kamp
- Ett-klikks registrering av resultat (Gray vant / Aqua vant / Delt / Ikke spilt),
  som umiddelbart oppdaterer poengsummen for alle via Supabase Realtime
- Sticky global poenglinje (Gray (Joys) vs Aquarellos) synlig på alle sider
- Flytende "Stilling"-knapp som åpner en modal med:
  - Stort head-to-head-oppsett med poengbar
  - Poeng brutt ned per dag og økt
  - Hvor mange poeng hvert lag trenger for å sikre cupen matematisk
  - Statistikk per spiller (vunnet/tapt/delt, poeng bidratt)
  - Mest vinnende par

## Datamodell

Se `supabase/migrations/0001_init_schema.sql` for full skjema. Kort oppsummert:

- `teams` — Gray (Joys) / Aquarellos
- `players` — 15 spillere, knyttet til et lag
- `days` — turneringsdager med bane
- `sessions` — økter per dag (format + poeng per kamp)
- `matches` — enkeltkamper med starttid, spillere/par, poeng og resultat

`supabase/migrations/0002_seed_data.sql` fyller inn spillerne, dagene, øktene og
alle kampene fra det opprinnelige turneringsoppsettet. Noen rader i
kildematerialet var ufullstendige eller tvetydige (kun én spiller lesbar i et
fourball-par, eller kun én rad lesbar i en hel økt) — disse er markert med et
`note`-felt i appen (⚠) slik at dere kan verifisere og rette dem direkte i UI-et.

## Kom i gang

### 1. Opprett Supabase-prosjekt

1. Gå til [supabase.com](https://supabase.com) og opprett et nytt prosjekt (gratis tier er mer enn nok).
2. Gå til **Project Settings → API** og noter:
   - `Project URL`
   - `anon public` API-nøkkel
3. Gå til **SQL Editor** i Supabase-dashboardet og kjør migrasjonene i rekkefølge:
   - Innholdet i `supabase/migrations/0001_init_schema.sql`
   - Innholdet i `supabase/migrations/0002_seed_data.sql`

   (Alternativt, hvis du har [Supabase CLI](https://supabase.com/docs/guides/cli)
   koblet til prosjektet: `supabase db push`.)
4. Sjekk at **Realtime** er slått på for prosjektet (default). Migrasjonen legger
   `matches`-tabellen til i `supabase_realtime`-publikasjonen automatisk.

### 2. Konfigurer miljøvariabler

Kopier `.env.local.example` til `.env.local` og fyll inn verdiene fra steg 1:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Installer og kjør lokalt

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000).

### 4. Test realtime-oppdatering

Åpne appen i to nettleservinduer/enheter samtidig, registrer et resultat i det
ene, og bekreft at poengsummen og kampstatusen oppdaterer seg i det andre uten
at du trenger å laste siden på nytt.

### 5. Deploy til Vercel

```bash
npm install -g vercel   # hvis du ikke har den fra før
vercel
```

Eller via [vercel.com](https://vercel.com): importer GitHub-repoet, og legg inn
`NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
**Project Settings → Environment Variables** før du deployer.

## Om tilgang / auth

Denne versjonen har ingen innlogging — alle med lenken kan lese og redigere
data. Dette er en bevisst forenkling for internt bruk blant de 15 spillerne som
kjenner hverandre. Rad-nivå-sikkerhet (RLS) er slått på i databasen, men med
åpne policyer for `anon`-nøkkelen (se `0001_init_schema.sql`).

Ønsker dere å legge til enkel tilgangskontroll senere, er de enkleste stegene:

1. Sett opp [Supabase Auth](https://supabase.com/docs/guides/auth) (f.eks. magic link på e-post).
2. Stram inn RLS-policyene på `matches` til å kreve en innlogget bruker
   (`using (auth.role() = 'authenticated')` e.l.) i stedet for `using (true)`.
3. Wrap appen i en enkel innloggingssjekk (Supabase har ferdige React-hjelpere for dette).

## Prosjektstruktur

```
src/
  app/                 Next.js App Router (layout, forside)
  components/          UI-komponenter (ScoreHeader, StandingsModal, MatchRow, ...)
  context/             TournamentContext — henter data + Realtime-subscription
  lib/                 Supabase-klient, typer, poengberegning, statistikk
supabase/
  migrations/          SQL-skjema og seed-data
```
