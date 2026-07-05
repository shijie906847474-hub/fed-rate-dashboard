const FRED_BASE = "https://api.stlouisfed.org/fred";

function getApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    throw new Error("FRED_API_KEY is not configured");
  }
  return key;
}

async function fredGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${FRED_BASE}/${path}`);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("file_type", "json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

type FredObservation = {
  date: string;
  value: string;
};

type FredObservationsResponse = {
  observations: FredObservation[];
};

type FredSeriesResponse = {
  seriess: Array<{
    id: string;
    title: string;
    units: string;
    frequency: string;
    last_updated: string;
  }>;
};

export type FredHistoryPoint = {
  date: string;
  value: number;
};

export async function fetchSeriesObservations(
  seriesId: string,
  options: {
    observationStart?: string;
    units?: string;
    frequency?: string;
    limit?: number;
    sortOrder?: "asc" | "desc";
  } = {},
): Promise<FredHistoryPoint[]> {
  const params: Record<string, string> = {
    series_id: seriesId,
  };

  if (options.observationStart) {
    params.observation_start = options.observationStart;
  }
  if (options.units) params.units = options.units;
  if (options.frequency) params.frequency = options.frequency;
  if (options.limit) params.limit = String(options.limit);
  if (options.sortOrder) params.sort_order = options.sortOrder;

  const data = await fredGet<FredObservationsResponse>("series/observations", params);

  return data.observations
    .filter((obs) => obs.value !== ".")
    .map((obs) => ({
      date: obs.date,
      value: Number(obs.value),
    }));
}

export async function fetchSeriesMeta(seriesId: string) {
  const data = await fredGet<FredSeriesResponse>("series", {
    series_id: seriesId,
  });
  return data.seriess[0];
}

export async function fetchLatestValue(seriesId: string): Promise<number | null> {
  const points = await fetchSeriesObservations(seriesId, {
    sortOrder: "desc",
    limit: 1,
  });
  return points[0]?.value ?? null;
}

export async function fetchEffr(): Promise<number> {
  const value = await fetchLatestValue("DFF");
  if (value === null) {
    throw new Error("Could not fetch EFFR from FRED");
  }
  return value;
}

export async function fetchTargetRange(): Promise<[number, number]> {
  const [lower, upper] = await Promise.all([
    fetchLatestValue("DFEDTARL"),
    fetchLatestValue("DFEDTARU"),
  ]);
  if (lower === null || upper === null) {
    throw new Error("Could not fetch target range from FRED");
  }
  return [lower, upper];
}

export function monthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

export function computeChange(current: number, previous: number | null): number | null {
  if (previous === null || Number.isNaN(previous)) return null;
  return Number((current - previous).toFixed(2));
}

export function computePercentChange(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return Number(((current - previous) / Math.abs(previous)).toFixed(2));
}
