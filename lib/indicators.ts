import { INDICATORS } from "./constants";
import {
  computeChange,
  fetchSeriesObservations,
  monthsAgo,
} from "./fred";
import type { IndicatorHistoryPoint, IndicatorSnapshot } from "./providers/types";

export async function getIndicatorSnapshots(): Promise<IndicatorSnapshot[]> {
  const now = new Date().toISOString();

  return Promise.all(
    INDICATORS.map(async (indicator) => {
      try {
        const points = await fetchSeriesObservations(indicator.id, {
          observationStart: monthsAgo(18),
          units: indicator.transform,
          sortOrder: "asc",
        });

        const latest = points.at(-1);
        const previous = points.at(-2);

        const value = latest?.value ?? null;
        const previousValue = previous?.value ?? null;

        let change: number | null = null;
        if (value !== null && previousValue !== null) {
          change = computeChange(value, previousValue);
        }

        return {
          id: indicator.id,
          nameZh: indicator.nameZh,
          nameEn: indicator.nameEn,
          unit: indicator.unit,
          value,
          previousValue,
          change,
          date: latest?.date ?? null,
          updatedAt: now,
        };
      } catch {
        return {
          id: indicator.id,
          nameZh: indicator.nameZh,
          nameEn: indicator.nameEn,
          unit: indicator.unit,
          value: null,
          previousValue: null,
          change: null,
          date: null,
          updatedAt: now,
        };
      }
    }),
  );
}

export async function getIndicatorHistory(
  seriesId: string,
): Promise<IndicatorHistoryPoint[]> {
  const indicator = INDICATORS.find((item) => item.id === seriesId);
  if (!indicator) {
    throw new Error(`Unknown indicator: ${seriesId}`);
  }

  return fetchSeriesObservations(seriesId, {
    observationStart: monthsAgo(24),
    units: indicator.transform,
  });
}
