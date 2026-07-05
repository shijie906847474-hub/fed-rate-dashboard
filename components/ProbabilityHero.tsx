"use client";

import type { FedWatchData } from "@/lib/providers/types";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function ProbabilityBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "hike" | "hold" | "cut";
}) {
  const colors = {
    hike: "bg-rose-500",
    hold: "bg-amber-400",
    cut: "bg-emerald-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="font-mono text-2xl font-semibold text-zinc-50 sm:text-3xl">
          {formatPercent(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors[tone]}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function ProbabilityHero({ data }: { data: FedWatchData }) {
  const primary =
    data.probabilities.hike >= data.probabilities.cut ? "hike" : "cut";
  const primaryLabel = primary === "hike" ? "加息" : "降息";
  const primaryValue =
    primary === "hike" ? data.probabilities.hike : data.probabilities.cut;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 shadow-2xl shadow-black/40 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            下一次 FOMC 会议
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-50 sm:text-3xl">
            {data.nextMeeting.date}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            距会议还有 {data.nextMeeting.daysRemaining} 天
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
          <p className="text-xs text-zinc-500">当前联邦基金利率</p>
          <p className="font-mono text-xl text-zinc-100">
            {data.targetRange.lower.toFixed(2)}% – {data.targetRange.upper.toFixed(2)}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            EFFR {data.currentRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-800 bg-black/30 p-5 sm:p-6">
        <p className="text-sm text-zinc-400">市场隐含 {primaryLabel} 概率</p>
        <p
          className={`mt-2 font-mono text-5xl font-bold sm:text-6xl ${
            primary === "hike" ? "text-rose-400" : "text-emerald-400"
          }`}
        >
          {formatPercent(primaryValue)}
        </p>
      </div>

      <div className="grid gap-5">
        <ProbabilityBar label="加息 Hike" value={data.probabilities.hike} tone="hike" />
        <ProbabilityBar label="维持 Hold" value={data.probabilities.hold} tone="hold" />
        <ProbabilityBar label="降息 Cut" value={data.probabilities.cut} tone="cut" />
      </div>

      {data.rateRanges.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.rateRanges.map((item) => (
            <div
              key={item.range}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3"
            >
              <p className="text-xs text-zinc-500">{item.range} bps</p>
              <p className="font-mono text-lg text-zinc-100">{formatPercent(item.probability)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
