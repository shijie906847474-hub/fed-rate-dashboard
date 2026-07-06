export const INDICATORS = [
  {
    id: "PCEPILFE",
    nameZh: "核心 PCE",
    nameEn: "Core PCE",
    unit: "同比 %",
    transform: "pc1" as const,
    description: "美联储首选通胀指标，剔除食品与能源，更能反映潜在通胀趋势。",
    fedImpactUp: "通胀黏性上升 → 降息空间收窄，维持高利率或加息概率上升",
    fedImpactDown: "通胀持续回落 → 接近 2% 目标，降息概率上升",
  },
  {
    id: "CPIAUCSL",
    nameZh: "CPI",
    nameEn: "CPI",
    unit: "同比 %",
    transform: "pc1" as const,
    description: "衡量一篮子消费品与服务价格变动，是公众最关注的通胀指标。",
    fedImpactUp: "整体通胀偏强 → 市场鹰派预期升温，加息/维持概率上升",
    fedImpactDown: "通胀降温 → 支持鸽派立场，降息概率上升",
  },
  {
    id: "PAYEMS",
    nameZh: "非农就业",
    nameEn: "Nonfarm Payrolls",
    unit: "千人",
    transform: "chg" as const,
    description: "每月非农业部门新增就业人数，反映劳动力市场松紧与经济增长动能。",
    fedImpactUp: "就业超预期强劲 → 经济过热风险，维持/加息概率上升",
    fedImpactDown: "新增就业放缓 → 增长动能减弱，降息概率上升",
  },
  {
    id: "UNRATE",
    nameZh: "失业率",
    nameEn: "Unemployment Rate",
    unit: "%",
    transform: "lin" as const,
    description: "失业人口占劳动力比例，是劳动力市场松紧的反向指标。",
    fedImpactUp: "失业率上升 → 经济走弱信号，降息概率上升",
    fedImpactDown: "失业率下降 → 就业市场偏紧，维持/加息概率上升",
  },
] as const;

export type IndicatorId = (typeof INDICATORS)[number]["id"];

export const INDICATOR_HISTORY_MONTHS = 60;

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
