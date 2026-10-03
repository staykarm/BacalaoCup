import { NextResponse } from "next/server";
import {
  DailyForecast,
  HourlyForecast,
  normalizeOpenMeteo,
  normalizeOpenMeteoHourly,
  normalizeYr,
  normalizeYrHourly,
  WEATHER_LOCATION,
  WeatherApiResponse,
} from "@/lib/weather";

export const revalidate = 1800;

async function fetchOpenMeteo(): Promise<{ daily: DailyForecast[]; hourly: HourlyForecast[] }> {
  const params = new URLSearchParams({
    latitude: String(WEATHER_LOCATION.lat),
    longitude: String(WEATHER_LOCATION.lon),
    daily:
      "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max",
    hourly: "weathercode,temperature_2m,precipitation,windspeed_10m",
    timezone: "Europe/Madrid",
    forecast_days: "16",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Open-Meteo svarte ${res.status}`);
  const json = await res.json();
  return { daily: normalizeOpenMeteo(json), hourly: normalizeOpenMeteoHourly(json) };
}

async function fetchYr(): Promise<{ daily: DailyForecast[]; hourly: HourlyForecast[] }> {
  const params = new URLSearchParams({ lat: String(WEATHER_LOCATION.lat), lon: String(WEATHER_LOCATION.lon) });
  const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?${params}`, {
    // Required by Yr/MET Norway's terms of service — a missing or generic User-Agent gets blocked outright.
    headers: { "User-Agent": "BacalaoCup/1.0 github.com/staykarm/BacalaoCup" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Yr svarte ${res.status}`);
  const json = await res.json();
  return { daily: normalizeYr(json), hourly: normalizeYrHourly(json) };
}

// One source being down shouldn't take the other with it, so each is fetched independently
// and its own failure is reported back instead of failing the whole response.
export async function GET() {
  const [openMeteo, yr] = await Promise.allSettled([fetchOpenMeteo(), fetchYr()]);
  const body: WeatherApiResponse = {
    openMeteo: openMeteo.status === "fulfilled" ? openMeteo.value.daily : null,
    openMeteoHourly: openMeteo.status === "fulfilled" ? openMeteo.value.hourly : null,
    openMeteoError: openMeteo.status === "rejected" ? String(openMeteo.reason) : null,
    yr: yr.status === "fulfilled" ? yr.value.daily : null,
    yrHourly: yr.status === "fulfilled" ? yr.value.hourly : null,
    yrError: yr.status === "rejected" ? String(yr.reason) : null,
  };
  return NextResponse.json(body);
}
