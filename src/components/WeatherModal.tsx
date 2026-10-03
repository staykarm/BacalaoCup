"use client";

import { useEffect, useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { DailyForecast } from "@/lib/weather";
import { ModalShell } from "./ModalShell";

interface WeatherApiResponse {
  openMeteo: DailyForecast[] | null;
  openMeteoError: string | null;
  yr: DailyForecast[] | null;
  yrError: string | null;
}

function fmtTemp(n: number | null) {
  return n === null ? "–" : `${Math.round(n)}°`;
}

function SourceRow({
  label,
  forecast,
  unavailable,
}: {
  label: string;
  forecast: DailyForecast | undefined;
  unavailable: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-card-deep px-3 py-2 text-sm">
      <span className="min-w-0 shrink-0 truncate font-semibold text-ink-light">{label}</span>
      {forecast ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-lg leading-none" aria-hidden>
            {forecast.emoji}
          </span>
          <span className="truncate text-ink-light/80">{forecast.label}</span>
          <span className="shrink-0 font-semibold text-ink">
            {fmtTemp(forecast.tempMax)} / {fmtTemp(forecast.tempMin)}
          </span>
          {forecast.precipitationMm !== null && (
            <span className="shrink-0 text-xs text-ink-light/60">💧{forecast.precipitationMm}mm</span>
          )}
        </div>
      ) : (
        <span className="shrink-0 text-xs italic text-ink-light/50">
          {unavailable ? "Utilgjengelig" : "Ingen prognose"}
        </span>
      )}
    </div>
  );
}

export function WeatherModal({ onClose }: { onClose: () => void }) {
  const { days } = useTournament();
  const [data, setData] = useState<WeatherApiResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<WeatherApiResponse>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Klarte ikke å hente værmelding");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ModalShell title="Vær" onClose={onClose}>
      {loadError && (
        <p className="mb-3 rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>
      )}
      {!data && !loadError && <p className="text-sm text-ink-light">Henter værmelding…</p>}
      {data && (
        <div className="space-y-3">
          {sortedDays.map((day) => {
            const openMeteo = data.openMeteo?.find((f) => f.date === day.date);
            const yr = data.yr?.find((f) => f.date === day.date);
            return (
              <div key={day.id} className="rounded-2xl border border-card-border bg-white p-3">
                <div className="mb-2 font-semibold text-ink">{day.label}</div>
                <div className="space-y-1.5">
                  <SourceRow label="Open-Meteo" forecast={openMeteo} unavailable={!!data.openMeteoError} />
                  <SourceRow label="Yr" forecast={yr} unavailable={!!data.yrError} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-center text-[11px] text-ink-light/50">
        Værdata fra Open-Meteo og Yr/MET Norway for Marbella-området — ikke banespesifikt.
      </p>
    </ModalShell>
  );
}
