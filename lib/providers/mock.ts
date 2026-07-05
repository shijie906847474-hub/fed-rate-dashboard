import type { FedWatchData, FedWatchProvider } from "./types";

export class MockFedWatchProvider implements FedWatchProvider {
  async getFedWatchData(): Promise<FedWatchData> {
    const now = new Date().toISOString();
    return {
      nextMeeting: { date: "2026-07-29", daysRemaining: 24 },
      currentRate: 4.33,
      targetRange: { lower: 4.25, upper: 4.5 },
      probabilities: { hike: 8.5, hold: 76.2, cut: 15.3 },
      rateRanges: [
        { range: "400-425", probability: 15.3 },
        { range: "425-450", probability: 76.2 },
        { range: "450-475", probability: 8.5 },
      ],
      history: [
        { date: "2026-07-01", hike: 7.1, hold: 78.4, cut: 14.5 },
        { date: "2026-07-02", hike: 7.8, hold: 77.6, cut: 14.6 },
        { date: "2026-07-03", hike: 8.5, hold: 76.2, cut: 15.3 },
      ],
      source: "mock",
      updatedAt: now,
    };
  }
}
