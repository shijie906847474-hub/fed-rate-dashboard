import { CME_SETTLEMENTS_URL } from "./constants";

export type Settlement = {
  month: string;
  settle: number;
  volume: string;
  openInterest: string;
};

type CmeSettlementsResponse = {
  empty?: boolean;
  settlements: Array<{
    month: string;
    settle: string;
    volume?: string;
    openInterest?: string;
  }>;
};

const BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.cmegroup.com/markets/interest-rates/stirs/30-day-federal-fund.quotes.html",
};

function recentBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

function formatTradeDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

async function fetchSettlementsRaw(tradeDate: Date): Promise<CmeSettlementsResponse> {
  const dateStr = formatTradeDate(tradeDate);
  const response = await fetch(`${CME_SETTLEMENTS_URL}?tradeDate=${encodeURIComponent(dateStr)}`, {
    headers: BROWSER_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CME settlements error: ${response.status}`);
  }

  return response.json() as Promise<CmeSettlementsResponse>;
}

export async function fetchSettlements(tradeDate?: Date): Promise<Settlement[]> {
  let queryDate = recentBusinessDay(tradeDate ?? new Date(Date.now() - 86400000));
  let data = await fetchSettlementsRaw(queryDate);

  if (data.empty) {
    queryDate = recentBusinessDay(new Date(queryDate.getTime() - 86400000));
    data = await fetchSettlementsRaw(queryDate);
  }

  return data.settlements
    .filter((item) => item.month !== "Total")
    .flatMap((item) => {
      const settle = Number(item.settle);
      if (Number.isNaN(settle)) return [];
      return [
        {
          month: item.month,
          settle,
          volume: item.volume?.replaceAll(",", "") ?? "0",
          openInterest: item.openInterest?.replaceAll(",", "") ?? "0",
        },
      ];
    });
}

export async function fetchRecentSettlementDays(count: number): Promise<
  Array<{
    tradeDate: string;
    settlements: Settlement[];
  }>
> {
  const results: Array<{ tradeDate: string; settlements: Settlement[] }> = [];
  let cursor = recentBusinessDay(new Date(Date.now() - 86400000));

  while (results.length < count) {
    try {
      const settlements = await fetchSettlements(cursor);
      if (settlements.length > 0) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        results.push({ tradeDate: `${y}-${m}-${d}`, settlements });
      }
    } catch {
      // Skip failed days and continue searching backwards.
    }

    cursor = recentBusinessDay(new Date(cursor.getTime() - 86400000));
    if (results.length === 0 && cursor.getTime() < Date.now() - 30 * 86400000) {
      break;
    }
    if (results.length > 0 && cursor.getTime() < Date.now() - 14 * 86400000) {
      break;
    }
  }

  return results.reverse();
}
