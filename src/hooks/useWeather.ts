"use client";

import { useEffect, useState } from "react";
import { WeatherApiResponse } from "@/lib/weather";

/**
 * Fetches the combined Open-Meteo/Yr forecast once. `error` only covers the request to our
 * own route failing outright (network down, route throwing); a single provider being
 * unavailable is reported per-source instead, via `data.openMeteoError`/`data.yrError`.
 */
export function useWeather() {
  const [data, setData] = useState<WeatherApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((res) => (res.ok ? (res.json() as Promise<WeatherApiResponse>) : Promise.reject(new Error(`Status ${res.status}`))))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Klarte ikke å hente værmelding");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}
