import { fetchFedWatchFromHtml, summarizeHtmlProbabilities } from "../cme-fedwatch-html";
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
    dataMethod: "fallback",
    updatedAt: new Date().toISOString(),
    stale: true,
    degradedReason: reason,
  };
}

async function buildHistory(
  nextMeeting: Date,
  effr: number,
  lower: number,
  upper: number,
): Promise<FedWatchData["history"]> {
  try {
    const recentDays = await fetchWithTimeout(
      fetchRecentSettlementDays(5),
      15000,
      "CME recent settlements",
    );

    return recentDays.flatMap(({ tradeDate, settlements: daySettlements }) => {
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
  } catch {
    return [];
  }
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

    try {
      const htmlData = await fetchWithTimeout(
        fetchFedWatchFromHtml(),
        15000,
        "FedWatch HTML",
      );
      const summary = summarizeHtmlProbabilities(
        htmlData.rateRanges,
        Math.round(htmlData.currentTarget.lower * 100),
      );

      return {
        nextMeeting: {
          date: toIsoDate(nextMeeting),
          daysRemaining: daysUntil(nextMeeting),
        },
        currentRate: effr,
        targetRange: htmlData.currentTarget,
        probabilities: {
          hike: summary.hike,
          hold: summary.hold,
          cut: summary.cut,
        },
        rateRanges: summary.rateRanges,
        history: [],
        source: "calculated",
        dataMethod: "quikstrike",
        updatedAt: htmlData.updatedAt,
      };
    } catch {
      // Fall through to settlements-based calculation.
    }

    try {
      const settlements = await fetchWithTimeout(fetchSettlements(), 12000, "CME settlements");
      const meetingResults = calculateProbabilities(settlements, [nextMeeting], effr);
      const latest = meetingResults[0];

      if (!latest) {
        throw new Error("Unable to calculate probabilities from settlements");
      }

      const summary = summarizeOutcomeProbabilities(latest.probabilities, lower, upper);
      const history = await buildHistory(nextMeeting, effr, lower, upper);

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
        dataMethod: "settlements",
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "CME 数据暂不可用";
      return buildDegradedData(
        nextMeeting,
        effr,
        lower,
        upper,
        `${message}。CME 结算价接口返回 403 时，已尝试 QuikStrike 公开页面但仍失败，当前显示 FRED 估算值。`,
      );
    }
  }
}

export async function getUpcomingMeetingList() {
  return getUpcomingMeetings().map((meeting) => ({
    date: toIsoDate(meeting),
    daysRemaining: daysUntil(meeting),
  }));
}
