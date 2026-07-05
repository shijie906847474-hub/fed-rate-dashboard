const FOMC_MEETINGS = [
  "2025-01-29",
  "2025-03-19",
  "2025-05-07",
  "2025-06-18",
  "2025-07-30",
  "2025-09-17",
  "2025-10-29",
  "2025-12-10",
  "2026-01-28",
  "2026-03-18",
  "2026-04-29",
  "2026-06-17",
  "2026-07-29",
  "2026-09-16",
  "2026-10-28",
  "2026-12-09",
  "2027-01-27",
  "2027-03-17",
  "2027-04-28",
  "2027-06-09",
  "2027-07-28",
  "2027-09-15",
  "2027-10-27",
  "2027-12-08",
];

const MONTH_CODES: Record<number, string> = {
  1: "F",
  2: "G",
  3: "H",
  4: "J",
  5: "K",
  6: "M",
  7: "N",
  8: "Q",
  9: "U",
  10: "V",
  11: "X",
  12: "Z",
};

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

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getUpcomingMeetings(fromDate = new Date()): Date[] {
  const today = startOfDay(fromDate);
  return FOMC_MEETINGS.map(parseDate).filter((meeting) => meeting >= today);
}

export function getNextMeeting(fromDate = new Date()): Date | null {
  const upcoming = getUpcomingMeetings(fromDate);
  return upcoming[0] ?? null;
}

export function daysUntil(date: Date, fromDate = new Date()): number {
  const from = startOfDay(fromDate).getTime();
  const target = startOfDay(date).getTime();
  return Math.max(0, Math.round((target - from) / (1000 * 60 * 60 * 24)));
}

export function meetingToContractCode(meetingDate: Date): string {
  const code = MONTH_CODES[meetingDate.getMonth() + 1];
  const yearDigit = String(meetingDate.getFullYear() % 10);
  return `ZQ${code}${yearDigit}`;
}

export function meetingToSettlementMonth(meetingDate: Date): string {
  const monthName = MONTH_NAMES[meetingDate.getMonth() + 1];
  const yearShort = String(meetingDate.getFullYear() % 100).padStart(2, "0");
  return `${monthName} ${yearShort}`;
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getAllMeetings(): { date: string; daysRemaining: number }[] {
  const today = new Date();
  return getUpcomingMeetings(today).map((meeting) => ({
    date: toIsoDate(meeting),
    daysRemaining: daysUntil(meeting, today),
  }));
}
