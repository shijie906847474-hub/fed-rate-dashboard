import {
  daysInMonth,
  meetingToSettlementMonth,
  meetingToContractCode,
} from "./fomc";
import type { Settlement } from "./cme-settlements";

const MONTH_NAMES: Record<number, string> = {
  1: "JAN",
  2: "FEB",
  3: "MAR",
  4: "APR",
  5: "MAY",
  6: "JUN",
  7: "JUL",
  8: "AUG",
  9: "SEP",
  10: "OCT",
  11: "NOV",
  12: "DEC",
};

function monthKey(year: number, month: number): string {
  const shortYear = String(year % 100).padStart(2, "0");
  return `${MONTH_NAMES[month]} ${shortYear}`;
}

function prevMonth(year: number, month: number): [number, number] {
  return month === 1 ? [year - 1, 12] : [year, month - 1];
}

function nextMonth(year: number, month: number): [number, number] {
  return month === 12 ? [year + 1, 1] : [year, month + 1];
}

function targetRangeLabel(lowerBps: number): string {
  return `${lowerBps}-${lowerBps + 25}`;
}

function movesToProbabilities(
  preRate: number,
  postRate: number,
): Record<string, number> {
  const preBps = preRate * 100;
  const preLower = Math.floor(preBps / 25) * 25;
  const expectedMoves = (postRate - preRate) / 0.25;
  const floorM = Math.floor(expectedMoves);
  const pCeil = Math.max(0, Math.min(1, expectedMoves - floorM));
  const pFloor = 1 - pCeil;

  const targetFloor = preLower + floorM * 25;
  const targetCeil = preLower + (floorM + 1) * 25;

  const probs: Record<string, number> = {};
  if (pFloor > 0.001) probs[targetRangeLabel(targetFloor)] = Number((pFloor * 100).toFixed(1));
  if (pCeil > 0.001) probs[targetRangeLabel(targetCeil)] = Number((pCeil * 100).toFixed(1));
  return probs;
}

export type MeetingProbability = {
  date: string;
  contract: string;
  probabilities: Record<string, number>;
};

export function calculateProbabilities(
  settlements: Settlement[],
  meetings: Date[],
  currentRate: number,
): MeetingProbability[] {
  const settleMap = Object.fromEntries(settlements.map((item) => [item.month, item.settle]));
  const results: MeetingProbability[] = [];

  for (const meeting of meetings) {
    const monthKeyStr = meetingToSettlementMonth(meeting);
    if (!(monthKeyStr in settleMap)) continue;

    const settlePrice = settleMap[monthKeyStr];
    const impliedRate = 100 - settlePrice;
    const d = meeting.getDate();
    const D = daysInMonth(meeting);
    const nPost = D - d + 1;

    const [py, pm] = prevMonth(meeting.getFullYear(), meeting.getMonth() + 1);
    const prevKey = monthKey(py, pm);
    const preRate = prevKey in settleMap ? 100 - settleMap[prevKey] : currentRate;

    const [ny, nm] = nextMonth(meeting.getFullYear(), meeting.getMonth() + 1);
    const nextKey = monthKey(ny, nm);

    let postRate: number;
    if (nPost <= 3 && nextKey in settleMap) {
      postRate = 100 - settleMap[nextKey];
    } else {
      const nPre = d - 1;
      postRate = nPost > 0 ? (impliedRate * D - preRate * nPre) / nPost : impliedRate;
    }

    results.push({
      date: meeting.toISOString().slice(0, 10),
      contract: meetingToContractCode(meeting),
      probabilities: movesToProbabilities(preRate, postRate),
    });
  }

  return results;
}

export function summarizeOutcomeProbabilities(
  rangeProbabilities: Record<string, number>,
  currentLower: number,
  currentUpper: number,
): { hike: number; hold: number; cut: number; rateRanges: { range: string; probability: number }[] } {
  const currentMidBps = Math.round(((currentLower + currentUpper) / 2) * 100);
  const currentLowerBps = Math.floor(currentMidBps / 25) * 25;

  let hike = 0;
  let hold = 0;
  let cut = 0;

  const rateRanges = Object.entries(rangeProbabilities)
    .map(([range, probability]) => ({ range, probability }))
    .sort((a, b) => {
      const aStart = Number(a.range.split("-")[0]);
      const bStart = Number(b.range.split("-")[0]);
      return aStart - bStart;
    });

  for (const { range, probability } of rateRanges) {
    const lowerBps = Number(range.split("-")[0]);
    if (lowerBps > currentLowerBps) hike += probability;
    else if (lowerBps < currentLowerBps) cut += probability;
    else hold += probability;
  }

  const total = hike + hold + cut;
  if (total > 0 && Math.abs(total - 100) > 0.5) {
    hike = Number(((hike / total) * 100).toFixed(1));
    hold = Number(((hold / total) * 100).toFixed(1));
    cut = Number(((cut / total) * 100).toFixed(1));
  }

  return {
    hike: Number(hike.toFixed(1)),
    hold: Number(hold.toFixed(1)),
    cut: Number(cut.toFixed(1)),
    rateRanges,
  };
}

export function deriveTargetRange(effr: number): [number, number] {
  const lowerBps = Math.floor((effr * 100) / 25) * 25;
  return [lowerBps / 100, (lowerBps + 25) / 100];
}
