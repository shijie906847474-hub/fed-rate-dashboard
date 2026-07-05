import { fetchRecentSettlementDays, fetchSettlements } from "../cme-settlements";
import {
  calculateProbabilities,
  deriveTargetRange,
  summarizeOutcomeProbabilities,
} from "../fedwatch-calc";
import { fetchWithTimeout } from "../fetch-with-timeout";
import { fetchEffr, fetchTargetRange } from "../fred";
import { daysUntil, getNextMeeting, getUpcomingMeetings, toIsoDate } from "../fomc";
import type { FedWatchData, FedWatchProvider } from "./types";

function buildDegradedData(
  nextMeeting: Date,
  effr: number,
  lower: number,
  upper: number,
  reason: string,
): FedWatchData {
  return {
    nextMeeting: {
      date: toIsoDate(nextMeeting),
      daysRemaining: daysUntil(nextMeeting),
    },
    currentRate: effr,
    targetRange: { lower, upper },
    probabilities: { hike: 5, hold: 90, cut: 5 },
    rateRanges: [
      { range: `${Math.round((lower - 0.25) * 100)}-${Math.round(lower * 100)}`, probability: 5 },
      {
        range: `${Math.round(lower * 100)}-${Math.round(upper * 100)}`,
        probability: 90,
      },
      { range: `${Math.round(upper * 100)}-${Math.round((upper + 0.25) * 100)}`, probability: 5 },
    ],
    history: [],
    source: "calculated",
    updatedAt: new Date().toISOString(),
    stale: true,
    degradedReason: reason,
  };
}

export class CalculatedFedWatchProvider implements FedWatchProvider {
  async getFedWatchData(): Promise<FedWatchData> {
    const nextMeeting = getNextMeeting();
    if (!nextMeeting) {
      throw new Error("No upcoming FOMC meetings in schedule");
    }

    const effr = await fetchEffr();

    let lower: number;
    let upper: number;
    try {
      [lower, upper] = await fetchTargetRange();
    } catch {
      [lower, upper] = deriveTargetRange(effr);
    }

    let settlements;
    let recentDays: Awaited<ReturnType<typeof fetchRecentSettlementDays>> = [];

    try {
      settlements = await fetchWithTimeout(fetchSettlements(), 12000, "CME settlements");
      recentDays = await fetchWithTimeout(
        fetchRecentSettlementDays(5),
        20000,
        "CME recent settlements",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "CME 结算价数据暂不可用";
      return buildDegradedData(
        nextMeeting,
        effr,
        lower,
        upper,
        `${message}。当前显示基于 FRED 的估算值，部署至 Vercel 后通常可恢复实时 CME 数据。`,
      );
    }

    const meetingResults = calculateProbabilities(settlements, [nextMeeting], effr);
    const latest = meetingResults[0];

    if (!latest) {
      return buildDegradedData(
        nextMeeting,
        effr,
        lower,
        upper,
        "无法根据 CME 结算价计算概率，已切换为估算值。",
      );
    }

    const summary = summarizeOutcomeProbabilities(latest.probabilities, lower, upper);

    const history = recentDays.flatMap(({ tradeDate, settlements: daySettlements }) => {
      const result = calculateProbabilities(daySettlements, [nextMeeting], effr)[0];
      if (!result) return [];
      const daySummary = summarizeOutcomeProbabilities(result.probabilities, lower, upper);
      return [
        {
          date: tradeDate,
          hike: daySummary.hike,
          hold: daySummary.hold,
          cut: daySummary.cut,
        },
      ];
    });

    return {
      nextMeeting: {
        date: toIsoDate(nextMeeting),
        daysRemaining: daysUntil(nextMeeting),
      },
      currentRate: effr,
      targetRange: { lower, upper },
      probabilities: {
        hike: summary.hike,
        hold: summary.hold,
        cut: summary.cut,
      },
      rateRanges: summary.rateRanges,
      history,
      source: "calculated",
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getUpcomingMeetingList() {
  return getUpcomingMeetings().map((meeting) => ({
    date: toIsoDate(meeting),
    daysRemaining: daysUntil(meeting),
  }));
}
