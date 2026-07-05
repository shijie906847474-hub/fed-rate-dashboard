"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, type ISeriesApi, ColorType, AreaSeries } from "lightweight-charts";
import { INDICATORS, type IndicatorId } from "@/lib/constants";

type HistoryResponse = {
  id: string;
  nameZh: string;
  nameEn: string;
  unit: string;
  points: Array<{ date: string; value: number }>;
};

export function HistoryChart({
  selectedId,
  onSelect,
  historyMap,
}: {
  selectedId: IndicatorId;
  onSelect: (id: IndicatorId) => void;
  historyMap: Record<string, HistoryResponse | undefined>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const selected = INDICATORS.find((item) => item.id === selectedId) ?? INDICATORS[0];
  const history = historyMap[selected.id];

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      height: 320,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#fbbf24",
      topColor: "rgba(251, 191, 36, 0.35)",
      bottomColor: "rgba(251, 191, 36, 0.02)",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !history?.points?.length) return;

    seriesRef.current.setData(
      history.points.map((point) => ({
        time: point.date,
        value: point.value,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [history]);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">指标历史走势</h3>
        <p className="text-sm text-zinc-500">近 24 个月 · 点击切换指标</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {INDICATORS.map((indicator) => {
          const active = indicator.id === selected.id;
          return (
            <button
              key={indicator.id}
              type="button"
              onClick={() => onSelect(indicator.id)}
              className={`rounded-full px-3 py-2 text-sm transition ${
                active
                  ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40"
                  : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-200"
              }`}
            >
              {indicator.nameZh}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-medium text-zinc-100">{selected.nameZh}</p>
          <p className="text-xs text-zinc-500">
            {selected.nameEn} · {selected.unit}
          </p>
        </div>
        {!history?.points?.length && (
          <span className="text-xs text-zinc-500">加载中...</span>
        )}
      </div>

      <div ref={containerRef} className="w-full overflow-hidden rounded-xl" />
    </section>
  );
}
