"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  AreaSeries,
} from "lightweight-charts";

function fitChartToData(chart: IChartApi, width: number, pointCount: number) {
  if (pointCount <= 0) return;

  const horizontalPadding = 24;
  const barSpacing =
    pointCount <= 1
      ? 8
      : Math.max(2, Math.min(14, (width - horizontalPadding * 2) / pointCount));

  chart.applyOptions({
    timeScale: {
      barSpacing,
      fixLeftEdge: true,
      fixRightEdge: true,
      lockVisibleTimeRangeOnResize: true,
      rightOffset: 0,
    },
  });
  chart.timeScale().fitContent();
}

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
  const pointsRef = useRef(points);

  pointsRef.current = points;

  const syncChartData = useCallback(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = containerRef.current;
    const currentPoints = pointsRef.current;

    if (!chart || !series || !container || !currentPoints.length) return;

    series.setData(
      currentPoints.map((point) => ({
        time: point.date,
        value: point.value,
      })),
    );
    fitChartToData(chart, container.clientWidth, currentPoints.length);
  }, []);

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
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightOffset: 0,
      },
      handleScroll: false,
      handleScale: false,
      kineticScroll: {
        touch: false,
        mouse: false,
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
      if (!entry) return;
      chart.applyOptions({ width: entry.contentRect.width });
      fitChartToData(chart, entry.contentRect.width, pointsRef.current.length);
    });
    resizeObserver.observe(containerRef.current);

    syncChartData();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height, syncChartData]);

  useEffect(() => {
    syncChartData();
  }, [points, syncChartData]);

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
