import { describe, expect, it } from "vitest";
import { normalizeOpenMeteo, normalizeYr } from "./weather";

describe("normalizeOpenMeteo", () => {
  it("maps each day's fields through, including the weather code's label and emoji", () => {
    const result = normalizeOpenMeteo({
      daily: {
        time: ["2026-10-07", "2026-10-08", "2026-10-09"],
        temperature_2m_max: [24, 22, 20],
        temperature_2m_min: [16, 15, 14],
        precipitation_sum: [0, 3.2, 0],
        precipitation_probability_max: [5, 60, 10],
        windspeed_10m_max: [12, 18, 9],
        weathercode: [0, 61, 95],
      },
    });

    expect(result).toEqual([
      {
        date: "2026-10-07",
        tempMax: 24,
        tempMin: 16,
        precipitationMm: 0,
        precipitationProbability: 5,
        windSpeedMax: 12,
        label: "Klarvær",
        emoji: "☀️",
      },
      {
        date: "2026-10-08",
        tempMax: 22,
        tempMin: 15,
        precipitationMm: 3.2,
        precipitationProbability: 60,
        windSpeedMax: 18,
        label: "Lett regn",
        emoji: "🌦️",
      },
      {
        date: "2026-10-09",
        tempMax: 20,
        tempMin: 14,
        precipitationMm: 0,
        precipitationProbability: 10,
        windSpeedMax: 9,
        label: "Tordenvær",
        emoji: "⛈️",
      },
    ]);
  });

  it("falls back to an 'unknown' label for an unmapped or missing weather code", () => {
    const result = normalizeOpenMeteo({
      daily: {
        time: ["2026-10-07"],
        weathercode: [999],
      },
    });
    expect(result[0].label).toBe("Ukjent");
    expect(result[0].emoji).toBe("❓");
    expect(result[0].tempMax).toBeNull();
  });

  it("returns an empty array when the daily block is missing", () => {
    expect(normalizeOpenMeteo({})).toEqual([]);
  });
});

describe("normalizeYr", () => {
  it("buckets hourly entries by local (Europe/Madrid) calendar date and aggregates them", () => {
    const result = normalizeYr({
      properties: {
        timeseries: [
          { time: "2026-10-07T04:00:00Z", data: { instant: { details: { air_temperature: 14 } } } },
          {
            time: "2026-10-07T10:00:00Z", // 12:00 local — exactly noon
            data: {
              instant: { details: { air_temperature: 22, wind_speed: 4 } },
              next_6_hours: { summary: { symbol_code: "partlycloudy_day" }, details: { precipitation_amount: 0.4 } },
            },
          },
          {
            time: "2026-10-07T16:00:00Z", // 18:00 local
            data: {
              instant: { details: { air_temperature: 19, wind_speed: 7 } },
              next_6_hours: { summary: { symbol_code: "clearsky_day" }, details: { precipitation_amount: 0.1 } },
            },
          },
          { time: "2026-10-08T04:00:00Z", data: { instant: { details: { air_temperature: 13 } } } },
        ],
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: "2026-10-07",
      tempMax: 22,
      tempMin: 14,
      precipitationMm: 0.5,
      precipitationProbability: null,
      windSpeedMax: 7,
      label: "Delvis skyet",
      emoji: "⛅",
    });
    // Only one entry, no 6-hour summary at all — nothing to report beyond the bare temperature.
    expect(result[1]).toEqual({
      date: "2026-10-08",
      tempMax: 13,
      tempMin: 13,
      precipitationMm: null,
      precipitationProbability: null,
      windSpeedMax: null,
      label: "Ukjent",
      emoji: "❓",
    });
  });

  it("falls back to next_1_hours' symbol when the representative entry has no next_6_hours summary", () => {
    const result = normalizeYr({
      properties: {
        timeseries: [
          {
            time: "2026-10-07T10:00:00Z",
            data: {
              instant: { details: { air_temperature: 18 } },
              next_1_hours: { summary: { symbol_code: "rain" } },
            },
          },
        ],
      },
    });
    expect(result[0].label).toBe("Regn");
    expect(result[0].emoji).toBe("🌧️");
  });

  it("returns an empty array when there's no timeseries", () => {
    expect(normalizeYr({})).toEqual([]);
  });
});
