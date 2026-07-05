export const INDICATORS = [
  {
    id: "PCEPILFE",
    nameZh: "核心 PCE",
    nameEn: "Core PCE",
    unit: "同比 %",
    transform: "pc1" as const,
  },
  {
    id: "CPIAUCSL",
    nameZh: "CPI",
    nameEn: "CPI",
    unit: "同比 %",
    transform: "pc1" as const,
  },
  {
    id: "PAYEMS",
    nameZh: "非农就业",
    nameEn: "Nonfarm Payrolls",
    unit: "千人",
    transform: "chg" as const,
  },
  {
    id: "UNRATE",
    nameZh: "失业率",
    nameEn: "Unemployment Rate",
    unit: "%",
    transform: "lin" as const,
  },
] as const;

export type IndicatorId = (typeof INDICATORS)[number]["id"];

export const CACHE_TTL = {
  fedwatch: 15 * 60 * 1000,
  indicators: 60 * 60 * 1000,
  history: 6 * 60 * 60 * 1000,
  meetings: 24 * 60 * 60 * 1000,
} as const;

export const CME_SETTLEMENTS_URL =
  "https://www.cmegroup.com/CmeWS/mvc/Settlements/Futures/Settlements/305/FUT";

export const CME_FEDWATCH_BASE = "https://markets.api.cmegroup.com/fedwatch/v1";
export const CME_OAUTH_URL = "https://auth.cmegroup.com/as/token.oauth2";
