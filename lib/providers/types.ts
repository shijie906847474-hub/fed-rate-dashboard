export type FedWatchSource = "calculated" | "official" | "mock";

export interface FedWatchData {
  nextMeeting: { date: string; daysRemaining: number };
  currentRate: number;
  targetRange: { lower: number; upper: number };
  probabilities: { hike: number; hold: number; cut: number };
  rateRanges: { range: string; probability: number }[];
  history: { date: string; hike: number; hold: number; cut: number }[];
  source: FedWatchSource;
  updatedAt: string;
  dataMethod?: "quikstrike" | "settlements" | "fallback";
  stale?: boolean;
  degradedReason?: string;
}

export interface FedWatchProvider {
  getFedWatchData(): Promise<FedWatchData>;
}

export interface MeetingInfo {
  date: string;
  daysRemaining: number;
}

export interface IndicatorSnapshot {
  id: string;
  nameZh: string;
  nameEn: string;
  unit: string;
  value: number | null;
  previousValue: number | null;
  change: number | null;
  date: string | null;
  updatedAt: string;
}

export interface IndicatorHistoryPoint {
  date: string;
  value: number;
}
