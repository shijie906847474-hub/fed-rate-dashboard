"use client";

import { INDICATORS } from "@/lib/constants";
import type { IndicatorSnapshot } from "@/lib/providers/types";
import { IndicatorHistoryChart } from "./IndicatorHistoryChart";

type HistoryBundle = Record<
  string,
  {
    id: string;
    nameZh: string;
    nameEn: string;
    unit: string;
    points: Array<{ date: string; value: number }>;
  }
>;

function formatValue(indicator: IndicatorSnapshot) {
  if (indicator.value === null) return "—";
  if (indicator.id === "PAYEMS") return `${(indicator.value / 1000).toFixed(0)}k`;
  return indicator.value.toFixed(2);
}

function formatChange(indicator: IndicatorSnapshot) {
  if (indicator.change === null) return null;
  const prefix = indicator.change > 0 ? "+" : "";
  return `${prefix}${indicator.change.toFixed(2)}`;
}

export function IndicatorPanels({
  indicators,
  historyMap,
}: {
  indicators: IndicatorSnapshot[];
  historyMap: HistoryBundle;
}) {
  const indicatorMap = Object.fromEntries(indicators.map((item) => [item.id, item]));

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">关键宏观指标</h3>
        <p className="text-sm text-zinc-500">向下浏览查看各指标最新值与 24 个月历史走势</p>
      </div>

      <div className="space-y-6">
        {INDICATORS.map((meta) => {
          const indicator = indicatorMap[meta.id];
          const history = historyMap[meta.id];
          const change = indicator ? formatChange(indicator) : null;
          const positive = (indicator?.change ?? 0) > 0;
          const negative = (indicator?.change ?? 0) < 0;

          return (
            <article
              key={meta.id}
              className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70"
            >
              <div className="border-b border-zinc-800 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-base font-medium text-zinc-100">{meta.nameZh}</p>
                    <p className="text-sm text-zinc-500">
                      {meta.nameEn} · {meta.unit}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-mono text-4xl text-zinc-50 sm:text-5xl">
                      {indicator ? formatValue(indicator) : "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-sm text-zinc-500 sm:justify-end">
                      {change && (
                        <span
                          className={
                            positive
                              ? "text-rose-400"
                              : negative
                                ? "text-emerald-400"
                                : "text-zinc-400"
                          }
                        >
                          {change}
                        </span>
                      )}
                      {indicator?.date && <span>数据日期 {indicator.date}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  历史走势 · 近 24 个月
                </p>
                <IndicatorHistoryChart points={history?.points ?? []} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
