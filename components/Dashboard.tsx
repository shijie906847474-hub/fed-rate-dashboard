"use client";

import useSWR from "swr";
import { useState } from "react";
import { INDICATORS, type IndicatorId } from "@/lib/constants";
import { ProbabilityHero } from "./ProbabilityHero";
import { IndicatorCards } from "./IndicatorCards";
import { HistoryChart } from "./HistoryChart";
import { DataSourceBadge } from "./DataSourceBadge";
import type { FedWatchData, IndicatorSnapshot } from "@/lib/providers/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

export function Dashboard() {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorId>(INDICATORS[0].id);

  const { data: fedwatch, error: fedwatchError, isLoading: fedwatchLoading } = useSWR<FedWatchData>(
    "/api/fedwatch",
    fetcher,
    { refreshInterval: 15 * 60 * 1000 },
  );

  const { data: indicators, isLoading: indicatorsLoading } = useSWR<IndicatorSnapshot[]>(
    "/api/indicators",
    fetcher,
    { refreshInterval: 60 * 60 * 1000 },
  );

  const { data: historyMap } = useSWR<HistoryBundle>(
    "/api/indicators/history",
    fetcher,
    { refreshInterval: 6 * 60 * 60 * 1000 },
  );

  if (fedwatchLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-400">
        正在加载美联储概率数据...
      </div>
    );
  }

  if (fedwatchError || !fedwatch || "error" in fedwatch) {
    return (
      <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-6 text-rose-200">
        暂时无法获取概率数据，请稍后刷新页面。
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProbabilityHero data={fedwatch} />

      {indicatorsLoading || !indicators ? (
        <div className="text-sm text-zinc-500">正在加载宏观指标...</div>
      ) : (
        <IndicatorCards indicators={indicators} />
      )}

      <HistoryChart
        selectedId={selectedIndicator}
        onSelect={setSelectedIndicator}
        historyMap={historyMap ?? {}}
      />

      <DataSourceBadge data={fedwatch} />
    </div>
  );
}
