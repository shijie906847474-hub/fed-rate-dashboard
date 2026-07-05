"use client";

import type { IndicatorSnapshot } from "@/lib/providers/types";

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

export function IndicatorCards({ indicators }: { indicators: IndicatorSnapshot[] }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">关键宏观指标</h3>
          <p className="text-sm text-zinc-500">左右滑动查看更多</p>
        </div>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {indicators.map((indicator) => {
          const change = formatChange(indicator);
          const positive = (indicator.change ?? 0) > 0;
          const negative = (indicator.change ?? 0) < 0;

          return (
            <article
              key={indicator.id}
              className="min-w-[240px] flex-none snap-start rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"
            >
              <p className="text-sm font-medium text-zinc-100">{indicator.nameZh}</p>
              <p className="text-xs text-zinc-500">{indicator.nameEn}</p>
              <p className="mt-4 font-mono text-3xl text-zinc-50">{formatValue(indicator)}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>{indicator.unit}</span>
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
              </div>
              {indicator.date && (
                <p className="mt-3 text-[11px] text-zinc-600">数据日期 {indicator.date}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
