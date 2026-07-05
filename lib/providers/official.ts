import { CME_FEDWATCH_BASE, CME_OAUTH_URL } from "../constants";
import { daysUntil } from "../fomc";
import type { FedWatchData, FedWatchProvider } from "./types";

type CmeForecastItem = {
  meetingDt: string;
  rateRange: string;
  probability: number;
};

type CmeForecastsResponse = {
  payload?: Array<{
    meetingDt: string;
    rateRange: string;
    probability: number;
  }>;
};

async function getAccessToken(): Promise<string> {
  const apiId = process.env.CME_API_ID;
  const apiSecret = process.env.CME_API_SECRET;
  if (!apiId || !apiSecret) {
    throw new Error("CME_API_ID and CME_API_SECRET are required for official provider");
  }

  const credentials = Buffer.from(`${apiId}:${apiSecret}`).toString("base64");
  const response = await fetch(CME_OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CME OAuth error: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function cmeGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${CME_FEDWATCH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`CME FedWatch API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function parseMeetingDate(value: string): string {
  return value.slice(0, 10);
}

function summarizeFromRanges(
  items: CmeForecastItem[],
  currentLower: number,
): { hike: number; hold: number; cut: number; rateRanges: { range: string; probability: number }[] } {
  const currentLowerBps = Math.round(currentLower * 100);

  const rateRanges = items
    .map((item) => ({
      range: item.rateRange.replace(" ", "-"),
      probability: Number(item.probability.toFixed(1)),
    }))
    .sort((a, b) => Number(a.range.split("-")[0]) - Number(b.range.split("-")[0]));

  let hike = 0;
  let hold = 0;
  let cut = 0;

  for (const item of rateRanges) {
    const lowerBps = Number(item.range.split("-")[0]);
    if (lowerBps > currentLowerBps) hike += item.probability;
    else if (lowerBps < currentLowerBps) cut += item.probability;
    else hold += item.probability;
  }

  return {
    hike: Number(hike.toFixed(1)),
    hold: Number(hold.toFixed(1)),
    cut: Number(cut.toFixed(1)),
    rateRanges,
  };
}

export class OfficialFedWatchProvider implements FedWatchProvider {
  async getFedWatchData(): Promise<FedWatchData> {
    const token = await getAccessToken();

    const [meetingsResponse, forecastsResponse] = await Promise.all([
      cmeGet<{ payload?: Array<{ meetingDt: string }> }>("/meetings/future", token),
      cmeGet<CmeForecastsResponse>("/forecasts", token),
    ]);

    const nextMeetingDate = meetingsResponse.payload?.[0]?.meetingDt;
    if (!nextMeetingDate) {
      throw new Error("No upcoming meetings returned by CME API");
    }

    const meetingIso = parseMeetingDate(nextMeetingDate);
    const meetingItems =
      forecastsResponse.payload?.filter((item) => parseMeetingDate(item.meetingDt) === meetingIso) ?? [];

    const currentLower = meetingItems.length
      ? Number(meetingItems[0].rateRange.split("-")[0]) / 100
      : 4.25;

    const summary = summarizeFromRanges(meetingItems, currentLower);

    return {
      nextMeeting: {
        date: meetingIso,
        daysRemaining: daysUntil(new Date(meetingIso)),
      },
      currentRate: currentLower + 0.125,
      targetRange: { lower: currentLower, upper: currentLower + 0.25 },
      probabilities: {
        hike: summary.hike,
        hold: summary.hold,
        cut: summary.cut,
      },
      rateRanges: summary.rateRanges,
      history: [],
      source: "official",
      updatedAt: new Date().toISOString(),
    };
  }
}
