"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  AreaSeries,
} from "lightweight-charts";

export function IndicatorHistoryChart({
  points,
  height = 260,
}: {
  points: Array<{ date: string; value: number }>;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

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
      height,
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
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current || !points.length) return;

    seriesRef.current.setData(
      points.map((point) => ({
        time: point.date,
        value: point.value,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  if (!points.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500"
        style={{ height }}
      >
        历史数据加载中...
      </div>
    );
  }

  return <div ref={containerRef} className="w-full overflow-hidden rounded-xl" />;
}
