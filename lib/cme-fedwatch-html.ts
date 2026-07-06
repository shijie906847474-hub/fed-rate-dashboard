const QUIKSTRIKE_VIEW_URL =
  "https://cmegroup-tools.quikstrike.net/User/QuikStrikeView.aspx?viewitemid=IntegratedFedWatchTool&userId=lwolf&jobRole=&company=&companyType=";

const ENTRY_URL = "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: ENTRY_URL,
  "Cache-Control": "no-cache",
};

export type ParsedRateRange = {
  range: string;
  probability: number;
  isCurrent: boolean;
  lowerBps: number;
  upperBps: number;
};

export type FedWatchHtmlData = {
  rateRanges: ParsedRateRange[];
  currentTarget: { lower: number; upper: number };
  updatedAt: string;
};

function parseTable(viewHTML: string): string {
  const match = viewHTML.match(
    /<table[^>]*class="[^"]*grid-thm[^"]*"[^>]*>[\s\S]*?Target\s+Rate\s*\(bps\)[\s\S]*?<\/table>/i,
  );
  if (!match) {
    throw new Error("FedWatch HTML table not found");
  }
  return match[0];
}

function parseRateRanges(table: string): ParsedRateRange[] {
  const rows: ParsedRateRange[] = [];
  let currentRange: ParsedRateRange | null = null;

  const rowRegex =
    /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\-(\d+)\s*(\(Current\))?\s*<\/td>\s*<td[^>]*class="[^"]*highlight[^"]*"[^>]*>\s*([^<]*?)\s*<\/td>/gi;

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(table))) {
    const lowerBps = Number(match[1]);
    const upperBps = Number(match[2]);
    const isCurrent = Boolean(match[3]);
    const probText = match[4].trim();

    if (!probText) continue;

    const probMatch = probText.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (!probMatch) continue;

    const probability = Number(probMatch[1]);
    if (!isCurrent && probability === 0) continue;

    const entry: ParsedRateRange = {
      range: `${lowerBps}-${upperBps}`,
      probability,
      isCurrent,
      lowerBps,
      upperBps,
    };

    if (isCurrent) currentRange = entry;
    rows.push(entry);
  }

  if (!currentRange) {
    throw new Error("FedWatch HTML missing current target range");
  }

  return rows.sort((a, b) => a.lowerBps - b.lowerBps);
}

function parseUpdatedAt(table: string): string {
  const match = table.match(
    /Data as of\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+CT/i,
  );
  if (!match) {
    return new Date().toISOString();
  }

  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const day = Number(match[1]);
  const month = monthMap[match[2]];
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  const chicagoOffsetHours = (() => {
    const d = new Date(Date.UTC(year, month, day, hour, minute, second));
    const tz = Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      timeZoneName: "short",
    }).formatToParts(d);
    return tz.some((part) => part.value === "CDT") ? 5 : 6;
  })();

  const utcMs =
    Date.UTC(year, month, day, hour, minute, second) + chicagoOffsetHours * 3600 * 1000;
  return new Date(utcMs).toISOString();
}

export async function fetchFedWatchFromHtml(): Promise<FedWatchHtmlData> {
  const response = await fetch(QUIKSTRIKE_VIEW_URL, {
    headers: BROWSER_HEADERS,
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`FedWatch HTML error: ${response.status}`);
  }

  const html = await response.text();
  if (html.length < 10000) {
    throw new Error("FedWatch HTML response too small (likely blocked or shell page)");
  }

  const table = parseTable(html);
  const rateRanges = parseRateRanges(table);
  const current = rateRanges.find((item) => item.isCurrent);

  if (!current) {
    throw new Error("FedWatch HTML missing current range");
  }

  return {
    rateRanges,
    currentTarget: {
      lower: current.lowerBps / 100,
      upper: current.upperBps / 100,
    },
    updatedAt: parseUpdatedAt(table),
  };
}

export function summarizeHtmlProbabilities(
  rateRanges: ParsedRateRange[],
  currentLowerBps: number,
): { hike: number; hold: number; cut: number; rateRanges: { range: string; probability: number }[] } {
  let hike = 0;
  let hold = 0;
  let cut = 0;

  const simplified = rateRanges.map(({ range, probability, lowerBps }) => {
    if (lowerBps > currentLowerBps) hike += probability;
    else if (lowerBps < currentLowerBps) cut += probability;
    else hold += probability;
    return { range, probability };
  });

  return {
    hike: Number(hike.toFixed(1)),
    hold: Number(hold.toFixed(1)),
    cut: Number(cut.toFixed(1)),
    rateRanges: simplified,
  };
}
