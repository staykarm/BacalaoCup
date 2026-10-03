"use client";

import { HourlyForecast } from "@/lib/weather";
import { ModalShell } from "./ModalShell";

function fmtTemp(n: number | null) {
  return n === null ? "–" : `${Math.round(n)}°`;
}

function HourlyColumn({ label, hours }: { label: string; hours: HourlyForecast[] }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-light">{label}</h3>
      {hours.length === 0 ? (
        <p className="text-xs italic text-ink-light/50">Ingen data</p>
      ) : (
        <div className="space-y-1">
          {hours.map((h) => (
            <div
              key={h.hour}
              className="flex items-center justify-between gap-2 rounded-xl bg-card-deep px-3 py-1.5 text-sm"
            >
              <span className="w-10 shrink-0 font-semibold text-ink-light">{String(h.hour).padStart(2, "0")}:00</span>
              <span className="shrink-0 text-base leading-none" aria-hidden>
                {h.emoji}
              </span>
              <span className="min-w-0 flex-1 truncate text-ink-light/70">{h.label}</span>
              <span className="shrink-0 font-semibold text-ink">{fmtTemp(h.temp)}</span>
              {h.precipitationMm !== null && (
                <span className="shrink-0 text-xs text-ink-light/60">💧{h.precipitationMm}mm</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function HourlyWeatherModal({
  dayLabel,
  openMeteoHourly,
  yrHourly,
  onClose,
}: {
  dayLabel: string;
  openMeteoHourly: HourlyForecast[];
  yrHourly: HourlyForecast[];
  onClose: () => void;
}) {
  return (
    <ModalShell title={dayLabel} onClose={onClose}>
      <div className="space-y-5">
        <HourlyColumn label="Open-Meteo" hours={openMeteoHourly} />
        <HourlyColumn label="Yr" hours={yrHourly} />
      </div>
    </ModalShell>
  );
}
