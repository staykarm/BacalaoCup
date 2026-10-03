/** One day's forecast, normalized to the same shape regardless of which provider it came from. */
export interface DailyForecast {
  /** ISO date (YYYY-MM-DD), in the forecast location's local time zone. */
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  /** Total precipitation for the day, in mm. */
  precipitationMm: number | null;
  /** 0-100, when the source provides a daily max probability. */
  precipitationProbability: number | null;
  windSpeedMax: number | null;
  /** A short Norwegian description of the day's dominant conditions. */
  label: string;
  /** A single emoji representing `label`. */
  emoji: string;
}

/** Marbella town centre — one shared forecast point for the whole tournament area, not per course. */
export const WEATHER_LOCATION = { lat: 36.51, lon: -4.88 };

const MADRID_TZ = "Europe/Madrid";

interface WeatherCodeInfo {
  label: string;
  emoji: string;
}

const UNKNOWN_CODE: WeatherCodeInfo = { label: "Ukjent", emoji: "❓" };

// --- Open-Meteo -------------------------------------------------------------------

interface OpenMeteoDailyResponse {
  daily?: {
    time: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_sum?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    windspeed_10m_max?: (number | null)[];
    weathercode?: (number | null)[];
  };
}

/** WMO weather codes, as used by Open-Meteo's `weathercode` field. */
const OPEN_METEO_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: "Klarvær", emoji: "☀️" },
  1: { label: "Mest klart", emoji: "🌤️" },
  2: { label: "Delvis skyet", emoji: "⛅" },
  3: { label: "Skyet", emoji: "☁️" },
  45: { label: "Tåke", emoji: "🌫️" },
  48: { label: "Tåke", emoji: "🌫️" },
  51: { label: "Lett yr", emoji: "🌦️" },
  53: { label: "Yr", emoji: "🌦️" },
  55: { label: "Kraftig yr", emoji: "🌧️" },
  56: { label: "Lett underkjølt yr", emoji: "🌧️" },
  57: { label: "Underkjølt yr", emoji: "🌧️" },
  61: { label: "Lett regn", emoji: "🌦️" },
  63: { label: "Regn", emoji: "🌧️" },
  65: { label: "Kraftig regn", emoji: "🌧️" },
  66: { label: "Lett underkjølt regn", emoji: "🌧️" },
  67: { label: "Underkjølt regn", emoji: "🌧️" },
  71: { label: "Lett snø", emoji: "🌨️" },
  73: { label: "Snø", emoji: "🌨️" },
  75: { label: "Kraftig snø", emoji: "🌨️" },
  77: { label: "Snøkorn", emoji: "🌨️" },
  80: { label: "Regnbyger", emoji: "🌦️" },
  81: { label: "Regnbyger", emoji: "🌧️" },
  82: { label: "Kraftige byger", emoji: "⛈️" },
  85: { label: "Snøbyger", emoji: "🌨️" },
  86: { label: "Kraftige snøbyger", emoji: "🌨️" },
  95: { label: "Tordenvær", emoji: "⛈️" },
  96: { label: "Tordenvær m/hagl", emoji: "⛈️" },
  99: { label: "Tordenvær m/hagl", emoji: "⛈️" },
};

function openMeteoCodeInfo(code: number | null | undefined): WeatherCodeInfo {
  if (code === null || code === undefined) return UNKNOWN_CODE;
  return OPEN_METEO_CODES[code] ?? UNKNOWN_CODE;
}

export function normalizeOpenMeteo(raw: OpenMeteoDailyResponse): DailyForecast[] {
  const daily = raw.daily;
  if (!daily?.time) return [];
  return daily.time.map((date, i) => {
    const info = openMeteoCodeInfo(daily.weathercode?.[i]);
    return {
      date,
      tempMax: daily.temperature_2m_max?.[i] ?? null,
      tempMin: daily.temperature_2m_min?.[i] ?? null,
      precipitationMm: daily.precipitation_sum?.[i] ?? null,
      precipitationProbability: daily.precipitation_probability_max?.[i] ?? null,
      windSpeedMax: daily.windspeed_10m_max?.[i] ?? null,
      label: info.label,
      emoji: info.emoji,
    };
  });
}

// --- Yr / MET Norway ---------------------------------------------------------------

interface YrTimeseriesEntry {
  time: string;
  data: {
    instant?: { details?: { air_temperature?: number; wind_speed?: number } };
    next_1_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
    next_6_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
  };
}

interface YrLocationforecastResponse {
  properties?: { timeseries?: YrTimeseriesEntry[] };
}

/** Yr's symbol codes carry a "_day"/"_night"/"_polartwilight" suffix for the icon's mood — same conditions underneath. */
const YR_SYMBOL_LABELS: Record<string, WeatherCodeInfo> = {
  clearsky: { label: "Klarvær", emoji: "☀️" },
  fair: { label: "Lettskyet", emoji: "🌤️" },
  partlycloudy: { label: "Delvis skyet", emoji: "⛅" },
  cloudy: { label: "Skyet", emoji: "☁️" },
  fog: { label: "Tåke", emoji: "🌫️" },
  lightrain: { label: "Lett regn", emoji: "🌦️" },
  rain: { label: "Regn", emoji: "🌧️" },
  heavyrain: { label: "Kraftig regn", emoji: "🌧️" },
  lightrainshowers: { label: "Lette regnbyger", emoji: "🌦️" },
  rainshowers: { label: "Regnbyger", emoji: "🌦️" },
  heavyrainshowers: { label: "Kraftige regnbyger", emoji: "🌧️" },
  lightsleet: { label: "Lett sludd", emoji: "🌨️" },
  sleet: { label: "Sludd", emoji: "🌨️" },
  heavysleet: { label: "Kraftig sludd", emoji: "🌨️" },
  lightsnow: { label: "Lett snø", emoji: "🌨️" },
  snow: { label: "Snø", emoji: "🌨️" },
  heavysnow: { label: "Kraftig snø", emoji: "🌨️" },
  thunder: { label: "Tordenvær", emoji: "⛈️" },
  rainandthunder: { label: "Regn og torden", emoji: "⛈️" },
};

function yrSymbolInfo(symbolCode: string | null | undefined): WeatherCodeInfo {
  if (!symbolCode) return UNKNOWN_CODE;
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, "");
  return YR_SYMBOL_LABELS[base] ?? UNKNOWN_CODE;
}

function localDateKey(isoTime: string): string {
  return new Date(isoTime).toLocaleDateString("en-CA", { timeZone: MADRID_TZ });
}

function localHour(isoTime: string): number {
  return Number(new Date(isoTime).toLocaleString("en-GB", { timeZone: MADRID_TZ, hour: "2-digit", hour12: false }));
}

/**
 * Yr's "compact" format gives hourly instant readings plus rolling precipitation/symbol
 * summaries (next_1_hours close in, next_6_hours further out) — there's no ready-made daily
 * total, so this buckets by local calendar date and aggregates. The 6-hour precipitation
 * blocks are UTC-aligned, not local-day-aligned, so the daily sum is an approximation.
 */
export function normalizeYr(raw: YrLocationforecastResponse): DailyForecast[] {
  const entries = raw.properties?.timeseries ?? [];
  const byDate = new Map<string, YrTimeseriesEntry[]>();
  for (const entry of entries) {
    const key = localDateKey(entry.time);
    const list = byDate.get(key) ?? [];
    list.push(entry);
    byDate.set(key, list);
  }

  return [...byDate.keys()].sort().map((date) => {
    const dayEntries = byDate.get(date)!;
    const temps = dayEntries
      .map((e) => e.data.instant?.details?.air_temperature)
      .filter((t): t is number => typeof t === "number");
    const windSpeeds = dayEntries
      .map((e) => e.data.instant?.details?.wind_speed)
      .filter((w): w is number => typeof w === "number");
    const precipAmounts = dayEntries
      .map((e) => e.data.next_6_hours?.details?.precipitation_amount)
      .filter((p): p is number => typeof p === "number");

    // The entry nearest local noon best represents the day's overall conditions.
    const representative = [...dayEntries].sort(
      (a, b) => Math.abs(localHour(a.time) - 12) - Math.abs(localHour(b.time) - 12)
    )[0];
    const symbolCode =
      representative?.data.next_6_hours?.summary?.symbol_code ??
      representative?.data.next_1_hours?.summary?.symbol_code ??
      null;
    const info = yrSymbolInfo(symbolCode);

    return {
      date,
      tempMax: temps.length > 0 ? Math.max(...temps) : null,
      tempMin: temps.length > 0 ? Math.min(...temps) : null,
      precipitationMm: precipAmounts.length > 0 ? Math.round(precipAmounts.reduce((a, b) => a + b, 0) * 10) / 10 : null,
      precipitationProbability: null,
      windSpeedMax: windSpeeds.length > 0 ? Math.max(...windSpeeds) : null,
      label: info.label,
      emoji: info.emoji,
    };
  });
}
